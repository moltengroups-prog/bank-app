import jwt from 'jsonwebtoken';
import WireTransfer  from '../models/WireTransfer.js';
import WireRecipient from '../models/WireRecipient.js';
import BankAccount   from '../models/BankAccount.js';
import OTPModel, { hashOTP } from '../models/OTP.js';
import { evaluateTransfer }      from '../fraud/engine.js';
import * as engine               from '../services/bankingEngine.js';
import * as audit                from '../services/auditService.js';
import { createNotification }    from '../utils/notify.js';
import { getIO }                 from '../socket/index.js';
import { sendOTPEmail }          from '../services/emailService.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Wire fee charged to sender on every executed wire (blocked/pending wires are not charged).
const WIRE_FEE = 30;
const WIRE_OTP_EXPIRY_MS  = 5 * 60 * 1000; // 5 minutes
const WIRE_OTP_MAX_ATTEMPTS = 5;

function recipientName(r) {
  return [r.firstName, r.lastName, r.businessName].filter(Boolean).join(' ') || 'Recipient';
}

// ── POST /api/wire-transfers/request-otp ─────────────────────────
// Sends a 6-digit OTP to the user's email before wire submission.
export async function requestWireOTP(req, res, next) {
  try {
    const user      = req.user;
    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + WIRE_OTP_EXPIRY_MS);

    await OTPModel.deleteMany({ user: user._id });

    const result = await sendOTPEmail({
      to:            user.email,
      firstName:     user.firstName,
      code,
      expiryMinutes: Math.round(WIRE_OTP_EXPIRY_MS / 60000),
    });

    await OTPModel.create({
      user:           user._id,
      email:          user.email,
      codeHash:       hashOTP(code),
      expiresAt,
      lastSentAt:     new Date(),
      deliveryMethod: result.method === 'terminal' ? 'terminal' : 'email',
    });

    const wireOtpToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, type: 'wire-otp-session' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    audit.logWireOTPSent({ user, req }).catch(() => {});

    res.json({ success: true, wireOtpToken });
  } catch (err) {
    next(err);
  }
}

// ── User endpoints ────────────────────────────────────────────────

// POST /api/wire-transfers
export async function submitWire(req, res, next) {
  try {
    const userId = req.user._id;
    const { fromAccountId, recipientId, amount, memo = '', wireOtpToken, wireOtpCode } = req.body;

    // ── OTP verification (mandatory before any wire submission) ───
    if (!wireOtpToken || !wireOtpCode) {
      return res.status(401).json({
        success: false,
        message: 'Transfer verification code is required.',
      });
    }

    let otpDecoded;
    try {
      otpDecoded = jwt.verify(wireOtpToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Verification session expired. Please request a new code.' });
    }

    if (otpDecoded.type !== 'wire-otp-session' || otpDecoded.sub !== String(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid verification token.' });
    }

    const otp = await OTPModel.findOne({ user: userId, used: false }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: 'No pending verification. Please request a new code.' });
    }
    if (new Date() > otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new code.' });
    }
    if (otp.attempts >= WIRE_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
    }

    otp.attempts += 1;

    if (otp.codeHash !== hashOTP(wireOtpCode.trim())) {
      await otp.save();
      const left = WIRE_OTP_MAX_ATTEMPTS - otp.attempts;
      audit.logWireOTPFailed({ userId, email: req.user.email, attemptsLeft: left, req }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      });
    }

    otp.used = true;
    await otp.save();
    audit.logWireOTPVerified({ user: req.user, req }).catch(() => {});

    if (!fromAccountId || !recipientId || amount == null) {
      return res.status(400).json({
        success: false,
        message: 'fromAccountId, recipientId, and amount are required.',
      });
    }

    const parsedAmount = round2(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ success: false, message: 'Wire amount must be at least $1.00.' });
    }

    const [account, recipient] = await Promise.all([
      BankAccount.findOne({ _id: fromAccountId, user: userId }),
      WireRecipient.findOne({ _id: recipientId, user: userId }),
    ]);

    if (!account)   return res.status(404).json({ success: false, message: 'Source account not found.' });
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found.' });
    if (account.availableBalance < parsedAmount + WIRE_FEE) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Wire requires $${parsedAmount.toFixed(2)} + $${WIRE_FEE.toFixed(2)} fee = $${(parsedAmount + WIRE_FEE).toFixed(2)}.`,
      });
    }

    const fraud = await evaluateTransfer({ userId, accountId: fromAccountId, amount: parsedAmount });

    const io   = getIO();
    const amt  = `$${parsedAmount.toFixed(2)}`;
    const rName = recipientName(recipient);

    // ── CRITICAL / BLOCKED ────────────────────────────────────────────
    if (fraud.outcome === 'blocked') {
      const wire = await WireTransfer.create({
        user:        userId,
        fromAccount: fromAccountId,
        recipient:   recipientId,
        amount:      parsedAmount,
        fee:         WIRE_FEE,
        memo,
        status:      'blocked',
        riskScore:   fraud.riskScore,
        riskLevel:   fraud.riskLevel,
        fraudFlags:  fraud.fraudFlags,
        submittedAt: new Date(),
      });

      if (io) {
        io.to('admins').emit('admin:securityAlert', {
          type:      'WIRE_BLOCKED',
          severity:  'critical',
          riskScore: fraud.riskScore,
          riskLevel: fraud.riskLevel,
          flags:     fraud.fraudFlags,
          userId:    String(userId),
          userName:  `${req.user.firstName} ${req.user.lastName}`,
          amount:    parsedAmount,
          ref:       wire.referenceNumber,
          wireId:    String(wire._id),
        });
      }

      createNotification({
        userId,
        title:    'Wire transfer blocked',
        message:  `Your wire transfer of ${amt} was blocked due to suspicious activity. Contact support if this is an error.`,
        type:     'error',
        category: 'security',
      }).catch(() => {});

      audit.logWireBlocked({ user: req.user, wire, req }).catch(() => {});

      return res.status(403).json({
        success:      false,
        fraudBlocked: true,
        riskLevel:    fraud.riskLevel,
        message:      'Wire transfer blocked due to suspicious activity. Please contact support.',
      });
    }

    // ── HIGH / PENDING-REVIEW ─────────────────────────────────────────
    if (fraud.outcome === 'pending-review') {
      const wire = await WireTransfer.create({
        user:        userId,
        fromAccount: fromAccountId,
        recipient:   recipientId,
        amount:      parsedAmount,
        fee:         WIRE_FEE,
        memo,
        status:      'pending-review',
        riskScore:   fraud.riskScore,
        riskLevel:   fraud.riskLevel,
        fraudFlags:  fraud.fraudFlags,
        submittedAt: new Date(),
      });

      if (io) {
        io.to('admins').emit('admin:wireAlert', {
          type:      'WIRE_PENDING_REVIEW',
          severity:  'high',
          riskScore: fraud.riskScore,
          riskLevel: fraud.riskLevel,
          flags:     fraud.fraudFlags,
          userId:    String(userId),
          userName:  `${req.user.firstName} ${req.user.lastName}`,
          amount:    parsedAmount,
          ref:       wire.referenceNumber,
          wireId:    String(wire._id),
        });
      }

      createNotification({
        userId,
        title:    'Wire transfer under review',
        message:  `Your wire transfer of ${amt} to ${rName} is under security review. You'll be notified once it's processed.`,
        type:     'warning',
        category: 'security',
      }).catch(() => {});

      audit.logWireSubmit({ user: req.user, wire, req }).catch(() => {});

      return res.status(202).json({
        success:         true,
        pendingReview:   true,
        riskLevel:       fraud.riskLevel,
        referenceNumber: wire.referenceNumber,
        message:         'Wire transfer is under security review. You will be notified once it is processed.',
      });
    }

    // ── LOW / MEDIUM → execute immediately ────────────────────────────
    // Deduct amount + WIRE_FEE in a single withdrawal so both are atomic.
    const totalDebit = round2(parsedAmount + WIRE_FEE);
    let engineResult;
    try {
      engineResult = await engine.withdrawFunds({
        accountId:   fromAccountId,
        amount:      totalDebit,
        description: `Wire transfer to ${rName} (incl. $${WIRE_FEE.toFixed(2)} fee)`,
        category:    'wire',
        initiatedBy: userId,
        metadata: {
          recipientId:     String(recipientId),
          transferAmount:  parsedAmount,
          wireFee:         WIRE_FEE,
          fraudFlags:      fraud.fraudFlags,
          fraudStatus:     fraud.outcome === 'monitoring' ? 'monitoring' : 'clean',
          riskScore:       fraud.riskScore,
        },
      });
    } catch (engineErr) {
      if (engineErr.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({ success: false, message: 'Insufficient funds.' });
      }
      if (engineErr.code === 'ACCOUNT_UNAVAILABLE') {
        return res.status(400).json({ success: false, message: engineErr.message });
      }
      console.error('[wireTransferController] banking engine error:', engineErr.message);
      return res.status(500).json({
        success: false,
        message: 'Wire transfer temporarily unavailable. Please try again.',
      });
    }

    const wire = await WireTransfer.create({
      user:               userId,
      fromAccount:        fromAccountId,
      recipient:          recipientId,
      amount:             parsedAmount,
      fee:                WIRE_FEE,
      memo,
      status:             'processing',
      riskScore:          fraud.riskScore,
      riskLevel:          fraud.riskLevel,
      fraudFlags:         fraud.fraudFlags,
      submittedAt:        new Date(),
      transactionRecords: [engineResult.transaction._id],
    });

    res.status(200).json({
      success: true,
      data: {
        wireId:           String(wire._id),
        referenceNumber:  wire.referenceNumber,
        amount:           parsedAmount,
        fee:              WIRE_FEE,
        total:            totalDebit,
        riskLevel:        fraud.riskLevel,
        status:           wire.status,
        recipientName:    rName,
        availableBalance: engineResult.balanceAfter,
      },
    });

    // Post-response side effects
    if (io) {
      io.to('admins').emit('admin:newWire', {
        wireId:          String(wire._id),
        referenceNumber: wire.referenceNumber,
        amount:          parsedAmount,
        riskScore:       fraud.riskScore,
        riskLevel:       fraud.riskLevel,
        userId:          String(userId),
        userName:        `${req.user.firstName} ${req.user.lastName}`,
        recipientName:   rName,
        status:          wire.status,
      });
    }

    createNotification({
      userId,
      title:    'Wire transfer initiated',
      message:  `Your wire transfer of ${amt} to ${rName} is now processing.`,
      type:     'success',
      category: 'transfer',
      metadata: { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: parsedAmount },
    }).catch(() => {});

    audit.logWireSubmit({ user: req.user, wire, req }).catch(() => {});

  } catch (err) {
    next(err);
  }
}

// GET /api/wire-transfers
export async function listWires(req, res, next) {
  try {
    const userId = req.user._id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;

    const [wires, total] = await Promise.all([
      WireTransfer.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recipient', 'firstName lastName businessName nickname country accountNumberMasked')
        .lean(),
      WireTransfer.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      success:    true,
      data:       wires,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/wire-transfers/:id
export async function getWire(req, res, next) {
  try {
    const userId = req.user._id;
    const wire   = await WireTransfer.findOne({ _id: req.params.id, user: userId })
      .populate('recipient',    'firstName lastName businessName nickname country accountNumberMasked bankName routingNumber')
      .populate('fromAccount',  'accountName last4 availableBalance')
      .lean();

    if (!wire) return res.status(404).json({ success: false, message: 'Wire transfer not found.' });
    return res.status(200).json({ success: true, data: wire });
  } catch (err) {
    next(err);
  }
}

// ── Admin endpoints ───────────────────────────────────────────────

// GET /api/admin/wire-transfers/pending
export async function getPendingWires(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 30);
    const skip  = (page - 1) * limit;

    const [wires, total] = await Promise.all([
      WireTransfer.find({ status: 'pending-review' })
        .sort({ createdAt: 1 }) // oldest first for review queue
        .skip(skip)
        .limit(limit)
        .populate('user',        'firstName lastName email')
        .populate('recipient',   'firstName lastName businessName nickname country accountNumberMasked bankName routingNumber')
        .populate('fromAccount', 'accountName last4')
        .lean(),
      WireTransfer.countDocuments({ status: 'pending-review' }),
    ]);

    return res.status(200).json({ success: true, data: wires, pagination: { total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/wire-transfers
export async function getWireHistory(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 30);
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user   = req.query.userId;

    const [wires, total] = await Promise.all([
      WireTransfer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user',        'firstName lastName email')
        .populate('recipient',   'firstName lastName businessName nickname country accountNumberMasked')
        .populate('fromAccount', 'accountName last4')
        .lean(),
      WireTransfer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      data:       wires,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/wire-transfers/:id/approve
export async function approveWire(req, res, next) {
  try {
    const wire = await WireTransfer.findById(req.params.id)
      .populate('user',        'firstName lastName email')
      .populate('recipient',   'firstName lastName businessName nickname')
      .populate('fromAccount', 'accountName last4 availableBalance');

    if (!wire) return res.status(404).json({ success: false, message: 'Wire transfer not found.' });
    if (wire.status !== 'pending-review') {
      return res.status(400).json({ success: false, message: `Cannot approve a wire with status: ${wire.status}.` });
    }

    const account = await BankAccount.findById(wire.fromAccount._id);
    const wireFeeToCharge = round2(wire.fee ?? WIRE_FEE);
    const totalDebitOnApproval = round2(wire.amount + wireFeeToCharge);
    if (!account || account.availableBalance < totalDebitOnApproval) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds to approve this wire. Requires $${totalDebitOnApproval.toFixed(2)} (transfer + $${wireFeeToCharge.toFixed(2)} fee).`,
      });
    }

    const rName = recipientName(wire.recipient);

    let engineResult;
    try {
      engineResult = await engine.withdrawFunds({
        accountId:   String(wire.fromAccount._id),
        amount:      totalDebitOnApproval,
        description: `Wire transfer to ${rName} (admin approved, incl. $${wireFeeToCharge.toFixed(2)} fee)`,
        category:    'wire',
        initiatedBy: req.user._id,
        metadata: {
          wireId:         String(wire._id),
          approvedBy:     String(req.user._id),
          originalFlags:  wire.fraudFlags,
          transferAmount: wire.amount,
          wireFee:        wireFeeToCharge,
        },
      });
    } catch (engineErr) {
      if (engineErr.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({ success: false, message: 'Insufficient funds.' });
      }
      console.error('[wireTransferController] admin approve engine error:', engineErr.message);
      return res.status(500).json({
        success: false,
        message: 'Wire approval could not be processed. Please try again.',
      });
    }

    wire.status      = 'processing';
    wire.reviewedBy  = req.user._id;
    wire.reviewedAt  = new Date();
    wire.reviewNotes = req.body.notes ?? '';
    wire.transactionRecords.push(engineResult.transaction._id);
    await wire.save();

    audit.logWireApproval({ admin: req.user, wire, req }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:wireUpdated', {
        wireId:     String(wire._id),
        status:     'processing',
        reviewedBy: String(req.user._id),
      });
    }

    createNotification({
      userId:   wire.user._id,
      title:    'Wire transfer approved',
      message:  `Your wire transfer of $${wire.amount.toFixed(2)} to ${rName} has been approved and is now processing.`,
      type:     'success',
      category: 'transfer',
      metadata: { wireId: String(wire._id), referenceNumber: wire.referenceNumber },
    }).catch(() => {});

    return res.status(200).json({ success: true, data: wire });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/wire-transfers/:id/settle
export async function settleWire(req, res, next) {
  try {
    const wire = await WireTransfer.findById(req.params.id)
      .populate('user',      'firstName lastName email')
      .populate('recipient', 'firstName lastName businessName nickname');

    if (!wire) return res.status(404).json({ success: false, message: 'Wire transfer not found.' });
    if (wire.status !== 'processing') {
      return res.status(400).json({ success: false, message: `Cannot settle a wire with status: ${wire.status}.` });
    }

    wire.status    = 'completed';
    wire.settledAt = new Date();
    wire.settledBy = req.user._id;
    if (req.body.notes) wire.reviewNotes = req.body.notes;
    await wire.save();

    audit.logWireSettlement({ admin: req.user, wire, req }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:wireUpdated', {
        wireId:    String(wire._id),
        status:    'completed',
        settledBy: String(req.user._id),
      });
      io.to(`user:${wire.user._id}`).emit('wire:settled', {
        wireId:          String(wire._id),
        referenceNumber: wire.referenceNumber,
        status:          'completed',
      });
    }

    const rName = recipientName(wire.recipient);
    createNotification({
      userId:   wire.user._id,
      title:    'Wire transfer completed',
      message:  `Your wire transfer of $${wire.amount.toFixed(2)} to ${rName} has been successfully settled.`,
      type:     'success',
      category: 'transfer',
      metadata: { wireId: String(wire._id), referenceNumber: wire.referenceNumber },
    }).catch(() => {});

    return res.status(200).json({ success: true, data: wire });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/wire-transfers/:id/reject
export async function rejectWire(req, res, next) {
  try {
    const { reason = 'Rejected by security review.' } = req.body;

    const wire = await WireTransfer.findById(req.params.id)
      .populate('user',      'firstName lastName email')
      .populate('recipient', 'firstName lastName businessName nickname');

    if (!wire) return res.status(404).json({ success: false, message: 'Wire transfer not found.' });
    if (wire.status !== 'pending-review') {
      return res.status(400).json({ success: false, message: `Cannot reject a wire with status: ${wire.status}.` });
    }

    wire.status        = 'rejected';
    wire.reviewedBy    = req.user._id;
    wire.reviewedAt    = new Date();
    wire.reviewNotes   = reason;
    wire.blockedReason = reason;
    await wire.save();

    audit.logWireRejection({ admin: req.user, wire, reason, req }).catch(() => {});

    const rName = recipientName(wire.recipient);

    createNotification({
      userId:   wire.user._id,
      title:    'Wire transfer rejected',
      message:  `Your wire transfer of $${wire.amount.toFixed(2)} to ${rName} was not approved. Reason: ${reason}`,
      type:     'error',
      category: 'security',
      metadata: { wireId: String(wire._id), referenceNumber: wire.referenceNumber },
    }).catch(() => {});

    return res.status(200).json({ success: true, data: wire });
  } catch (err) {
    next(err);
  }
}
