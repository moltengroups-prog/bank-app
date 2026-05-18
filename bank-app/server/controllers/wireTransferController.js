import WireTransfer  from '../models/WireTransfer.js';
import WireRecipient from '../models/WireRecipient.js';
import BankAccount   from '../models/BankAccount.js';
import { evaluateTransfer }      from '../fraud/engine.js';
import * as engine               from '../services/bankingEngine.js';
import * as audit                from '../services/auditService.js';
import { createNotification }    from '../utils/notify.js';
import { getIO }                 from '../socket/index.js';

const round2 = (n) => Math.round(n * 100) / 100;

function recipientName(r) {
  return [r.firstName, r.lastName, r.businessName].filter(Boolean).join(' ') || 'Recipient';
}

// ── User endpoints ────────────────────────────────────────────────

// POST /api/wire-transfers
export async function submitWire(req, res, next) {
  try {
    const userId = req.user._id;
    const { fromAccountId, recipientId, amount, memo = '' } = req.body;

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
    if (account.availableBalance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds.' });
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
    let engineResult;
    try {
      engineResult = await engine.withdrawFunds({
        accountId:   fromAccountId,
        amount:      parsedAmount,
        description: `Wire transfer to ${rName}`,
        category:    'wire',
        initiatedBy: userId,
        metadata: {
          recipientId: String(recipientId),
          fraudFlags:  fraud.fraudFlags,
          fraudStatus: fraud.outcome === 'monitoring' ? 'monitoring' : 'clean',
          riskScore:   fraud.riskScore,
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
    if (!account || account.availableBalance < wire.amount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds to approve this wire.' });
    }

    const rName = recipientName(wire.recipient);

    let engineResult;
    try {
      engineResult = await engine.withdrawFunds({
        accountId:   String(wire.fromAccount._id),
        amount:      wire.amount,
        description: `Wire transfer to ${rName} (admin approved)`,
        category:    'wire',
        initiatedBy: req.user._id,
        metadata: {
          wireId:        String(wire._id),
          approvedBy:    String(req.user._id),
          originalFlags: wire.fraudFlags,
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
