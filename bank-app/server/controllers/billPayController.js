import jwt from 'jsonwebtoken';
import Payee       from '../models/Payee.js';
import BillPayment from '../models/BillPayment.js';
import BankAccount from '../models/BankAccount.js';
import OTPModel, { hashOTP } from '../models/OTP.js';
import { createNotification } from '../utils/notify.js';
import { getIO }              from '../socket/index.js';
import * as engine            from '../services/bankingEngine.js';
import * as audit             from '../services/auditService.js';
import { sendOTPEmail }       from '../services/emailService.js';

const round2 = (n) => Math.round(n * 100) / 100;

// ── Recurring: compute next scheduled date ────────────────────────
function nextDate(from, rule) {
  const d = new Date(from);
  switch (rule) {
    case 'weekly':    d.setDate(d.getDate() + 7);   break;
    case 'biweekly':  d.setDate(d.getDate() + 14);  break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'annually':  d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d;
}

// ── Execute a bill payment (debit account, mark completed) ────────
async function executePayment(payment, payee) {
  try {
    const engineResult = await engine.withdrawFunds({
      accountId:   String(payment.fromAccount),
      amount:      payment.amount,
      description: `Bill Pay — ${payee.nickname || payee.name}`,
      category:    'billpay',
      initiatedBy: payment.user,
      metadata: {
        payeeId:            String(payment.payee),
        payeeName:          payee.name,
        confirmationNumber: payment.confirmationNumber,
        billPaymentId:      String(payment._id),
      },
    });

    payment.status        = 'completed';
    payment.processedDate = new Date();
    payment.transaction   = engineResult.transaction._id;
    await payment.save();

    // Update payee stats
    await Payee.findByIdAndUpdate(payment.payee, {
      $set: {
        lastPaymentDate:   new Date(),
        lastPaymentAmount: payment.amount,
      },
      $inc: {
        totalPaid:    payment.amount,
        paymentCount: 1,
      },
    });

    // Spawn next recurring payment if applicable
    if (payment.isRecurring && payment.recurringRule !== 'once') {
      const nextScheduled = nextDate(payment.scheduledDate, payment.recurringRule);
      const endDate = payment.recurringEndDate;
      if (nextScheduled && (!endDate || nextScheduled <= endDate)) {
        const nextPayment = await BillPayment.create({
          user:            payment.user,
          fromAccount:     payment.fromAccount,
          payee:           payment.payee,
          amount:          payment.amount,
          memo:            payment.memo,
          scheduledDate:   nextScheduled,
          isRecurring:     true,
          recurringRule:   payment.recurringRule,
          recurringEndDate:payment.recurringEndDate,
          parentPaymentId: payment._id,
        });
        payment.nextPaymentId = nextPayment._id;
        await payment.save();
      }
    }

    return engineResult;
  } catch (err) {
    payment.status        = 'failed';
    payment.failureReason = err.message || 'Payment processing failed';
    await payment.save();
    throw err;
  }
}

const BILLPAY_OTP_EXPIRY_MS   = 5 * 60 * 1000;
const BILLPAY_OTP_MAX_ATTEMPTS = 5;

// ── POST /api/bill-pay/payments/request-otp ───────────────────────
// Sends a 6-digit OTP before payment submission.
export async function requestBillPayOTP(req, res, next) {
  try {
    const user      = req.user;
    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + BILLPAY_OTP_EXPIRY_MS);

    await OTPModel.deleteMany({ user: user._id });

    const result = await sendOTPEmail({
      to:            user.email,
      firstName:     user.firstName,
      code,
      expiryMinutes: Math.round(BILLPAY_OTP_EXPIRY_MS / 60000),
    });

    await OTPModel.create({
      user:           user._id,
      email:          user.email,
      codeHash:       hashOTP(code),
      expiresAt,
      lastSentAt:     new Date(),
      deliveryMethod: result.method === 'terminal' ? 'terminal' : 'email',
    });

    const billPayOtpToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, type: 'billpay-otp-session' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ success: true, billPayOtpToken });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════════
// USER — PAYEE ENDPOINTS
// ══════════════════════════════════════════════════════════════════

// POST /api/bill-pay/payees
export async function addPayee(req, res, next) {
  try {
    const userId = req.user._id;
    const { name, nickname, category, accountNumber, address, addressTwo, city, state, zipCode, phoneNumber } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Payee name is required.' });
    }

    const payee = await Payee.create({
      user: userId,
      name: name.trim(),
      nickname: nickname?.trim() ?? '',
      category: category ?? 'other',
      accountNumber: accountNumber?.trim() ?? '',
      address: address?.trim() ?? '',
      addressTwo: addressTwo?.trim() ?? '',
      city: city?.trim() ?? '',
      state: state?.trim() ?? '',
      zipCode: zipCode?.trim() ?? '',
      phoneNumber: phoneNumber?.trim() ?? '',
    });

    audit.logBillPayAction({ user: req.user, action: 'PAYEE_ADDED', payeeId: String(payee._id), payeeName: payee.name, req }).catch(() => {});

    return res.status(201).json({ success: true, data: payee });
  } catch (err) {
    next(err);
  }
}

// GET /api/bill-pay/payees
export async function getPayees(req, res, next) {
  try {
    const payees = await Payee.find({ user: req.user._id, isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: payees });
  } catch (err) {
    next(err);
  }
}

// GET /api/bill-pay/payees/:id
export async function getPayee(req, res, next) {
  try {
    const payee = await Payee.findOne({ _id: req.params.id, user: req.user._id });
    if (!payee) return res.status(404).json({ success: false, message: 'Payee not found.' });
    return res.status(200).json({ success: true, data: payee });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bill-pay/payees/:id
export async function updatePayee(req, res, next) {
  try {
    const payee = await Payee.findOne({ _id: req.params.id, user: req.user._id });
    if (!payee) return res.status(404).json({ success: false, message: 'Payee not found.' });

    const editable = ['name', 'nickname', 'category', 'accountNumber', 'address', 'addressTwo', 'city', 'state', 'zipCode', 'phoneNumber'];
    for (const field of editable) {
      if (req.body[field] !== undefined) payee[field] = req.body[field];
    }
    await payee.save();
    return res.status(200).json({ success: true, data: payee });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/bill-pay/payees/:id (soft delete)
export async function deactivatePayee(req, res, next) {
  try {
    const payee = await Payee.findOne({ _id: req.params.id, user: req.user._id });
    if (!payee) return res.status(404).json({ success: false, message: 'Payee not found.' });

    payee.isActive = false;
    await payee.save();
    return res.status(200).json({ success: true, message: 'Payee removed.' });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════════
// USER — PAYMENT ENDPOINTS
// ══════════════════════════════════════════════════════════════════

// POST /api/bill-pay/payments
export async function schedulePayment(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      fromAccountId, payeeId, amount, scheduledDate,
      memo = '', isRecurring = false, recurringRule = 'once', recurringEndDate,
      billPayOtpToken, billPayOtpCode,
    } = req.body;

    // ── OTP verification (mandatory before any payment) ───────────
    if (!billPayOtpToken || !billPayOtpCode) {
      return res.status(401).json({ success: false, message: 'Payment verification code is required.' });
    }
    let otpDecoded;
    try {
      otpDecoded = jwt.verify(billPayOtpToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Verification session expired. Please request a new code.' });
    }
    if (otpDecoded.type !== 'billpay-otp-session' || otpDecoded.sub !== String(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid verification token.' });
    }
    const otp = await OTPModel.findOne({ user: userId, used: false }).sort({ createdAt: -1 });
    if (!otp)                        return res.status(400).json({ success: false, message: 'No pending verification. Please request a new code.' });
    if (new Date() > otp.expiresAt)  return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new code.' });
    if (otp.attempts >= BILLPAY_OTP_MAX_ATTEMPTS) return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
    otp.attempts += 1;
    if (otp.codeHash !== hashOTP(billPayOtpCode.trim())) {
      await otp.save();
      const left = BILLPAY_OTP_MAX_ATTEMPTS - otp.attempts;
      return res.status(400).json({
        success: false,
        message: left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      });
    }
    otp.used = true;
    await otp.save();

    if (!fromAccountId || !payeeId || amount == null || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'fromAccountId, payeeId, amount, and scheduledDate are required.' });
    }

    const parsedAmount = round2(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      return res.status(400).json({ success: false, message: 'Amount must be at least $0.01.' });
    }

    const [account, payee] = await Promise.all([
      BankAccount.findOne({ _id: fromAccountId, user: userId }),
      Payee.findOne({ _id: payeeId, user: userId, isActive: true }),
    ]);

    if (!account) return res.status(404).json({ success: false, message: 'Source account not found.' });
    if (!payee)   return res.status(404).json({ success: false, message: 'Payee not found.' });

    const scheduled = new Date(scheduledDate);
    const isToday   = scheduled <= new Date();

    if (isToday && account.availableBalance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds.' });
    }

    const payment = await BillPayment.create({
      user:            userId,
      fromAccount:     fromAccountId,
      payee:           payeeId,
      amount:          parsedAmount,
      memo:            memo.trim(),
      scheduledDate:   scheduled,
      isRecurring:     Boolean(isRecurring),
      recurringRule:   isRecurring ? (recurringRule || 'monthly') : 'once',
      recurringEndDate:recurringEndDate ? new Date(recurringEndDate) : null,
      status:          isToday ? 'processing' : 'pending',
    });

    const io = getIO();

    if (isToday) {
      // Execute immediately — fire and forget after response
      res.status(201).json({
        success: true,
        data: { ...payment.toObject(), payeeName: payee.name },
        message: 'Payment is being processed.',
      });

      try {
        await executePayment(payment, payee);
        createNotification({
          userId,
          title:    'Bill payment sent',
          message:  `Your payment of $${parsedAmount.toFixed(2)} to ${payee.nickname || payee.name} was processed.`,
          type:     'success',
          category: 'billpay',
          metadata: { confirmationNumber: payment.confirmationNumber, paymentId: String(payment._id) },
        }).catch(() => {});
        audit.logBillPayScheduled({ user: req.user, payment, payee, req }).catch(() => {});
      } catch (execErr) {
        createNotification({
          userId,
          title:    'Bill payment failed',
          message:  `Your payment of $${parsedAmount.toFixed(2)} to ${payee.nickname || payee.name} could not be processed. ${execErr.code === 'INSUFFICIENT_FUNDS' ? 'Insufficient funds.' : 'Please try again or contact support.'}`,
          type:     'error',
          category: 'billpay',
        }).catch(() => {});
        if (io) io.to('admins').emit('admin:billPayFailed', { paymentId: String(payment._id), amount: parsedAmount, payeeName: payee.name, userId: String(userId), reason: execErr.message });
      }
    } else {
      audit.logBillPayScheduled({ user: req.user, payment, payee, req }).catch(() => {});
      createNotification({
        userId,
        title:    'Bill payment scheduled',
        message:  `Your payment of $${parsedAmount.toFixed(2)} to ${payee.nickname || payee.name} is scheduled for ${scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
        type:     'info',
        category: 'billpay',
        metadata: { confirmationNumber: payment.confirmationNumber, paymentId: String(payment._id) },
      }).catch(() => {});
      return res.status(201).json({
        success: true,
        data: { ...payment.toObject(), payeeName: payee.name },
        message: 'Payment scheduled.',
      });
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/bill-pay/payments
export async function getPayments(req, res, next) {
  try {
    const userId = req.user._id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;

    const filter = { user: userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.payeeId) filter.payee = req.query.payeeId;

    const [payments, total] = await Promise.all([
      BillPayment.find(filter)
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('payee', 'name nickname category')
        .populate('fromAccount', 'accountName last4')
        .lean(),
      BillPayment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      data:       payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/bill-pay/payments/upcoming
export async function getUpcomingPayments(req, res, next) {
  try {
    const payments = await BillPayment.find({
      user:          req.user._id,
      status:        'pending',
      scheduledDate: { $gte: new Date() },
    })
      .sort({ scheduledDate: 1 })
      .limit(20)
      .populate('payee',       'name nickname category')
      .populate('fromAccount', 'accountName last4')
      .lean();

    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

// GET /api/bill-pay/payments/:id
export async function getPayment(req, res, next) {
  try {
    const payment = await BillPayment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('payee',       'name nickname category address city state zipCode')
      .populate('fromAccount', 'accountName last4')
      .lean();

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    return res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

// POST /api/bill-pay/payments/:id/cancel
export async function cancelPayment(req, res, next) {
  try {
    const payment = await BillPayment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('payee', 'name nickname');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (!['pending'].includes(payment.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a payment with status: ${payment.status}.` });
    }

    payment.status             = 'cancelled';
    payment.cancelledAt        = new Date();
    payment.cancelledBy        = req.user._id;
    payment.cancellationReason = req.body.reason ?? 'Cancelled by user';
    await payment.save();

    audit.logBillPayCancelled({ user: req.user, payment, req }).catch(() => {});

    createNotification({
      userId:   req.user._id,
      title:    'Bill payment cancelled',
      message:  `Your scheduled payment of $${payment.amount.toFixed(2)} to ${payment.payee?.nickname || payment.payee?.name} has been cancelled.`,
      type:     'warning',
      category: 'billpay',
    }).catch(() => {});

    return res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ══════════════════════════════════════════════════════════════════

// GET /api/admin/bill-pay/payments
export async function adminGetPayments(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const skip  = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user   = req.query.userId;

    const [payments, total] = await Promise.all([
      BillPayment.find(filter)
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user',        'firstName lastName email')
        .populate('payee',       'name nickname category')
        .populate('fromAccount', 'accountName last4')
        .lean(),
      BillPayment.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data: payments, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/bill-pay/payments/failed
export async function adminGetFailedPayments(req, res, next) {
  try {
    const payments = await BillPayment.find({ status: 'failed' })
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate('user',        'firstName lastName email')
      .populate('payee',       'name nickname')
      .populate('fromAccount', 'accountName last4')
      .lean();

    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/bill-pay/payments/:id/retry
export async function adminRetryPayment(req, res, next) {
  try {
    const payment = await BillPayment.findById(req.params.id)
      .populate('payee', 'name nickname');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Only failed payments can be retried.' });
    }

    payment.status        = 'processing';
    payment.failureReason = '';
    await payment.save();

    try {
      await executePayment(payment, payment.payee);

      createNotification({
        userId:   payment.user,
        title:    'Bill payment completed',
        message:  `Your payment of $${payment.amount.toFixed(2)} to ${payment.payee?.name} has been processed successfully.`,
        type:     'success',
        category: 'billpay',
      }).catch(() => {});

      return res.status(200).json({ success: true, data: payment, message: 'Payment retried and completed.' });
    } catch (execErr) {
      return res.status(400).json({ success: false, message: execErr.message || 'Retry failed.' });
    }
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/bill-pay/payments/:id/refund
export async function adminRefundPayment(req, res, next) {
  try {
    const { reason = 'Admin refund' } = req.body;

    const payment = await BillPayment.findById(req.params.id)
      .populate('user',  'firstName lastName email')
      .populate('payee', 'name nickname');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed payments can be refunded.' });
    }
    if (payment.refundedAt) {
      return res.status(400).json({ success: false, message: 'Payment has already been refunded.' });
    }

    // Credit the amount back to the account
    const engineResult = await engine.applyAdminAdjustment({
      accountId:   String(payment.fromAccount),
      amount:      payment.amount, // positive = credit
      description: `Bill Pay Refund — ${payment.payee?.name}`,
      reason:      reason.trim(),
      adminId:     req.user._id,
      metadata:    { billPaymentId: String(payment._id), confirmationNumber: payment.confirmationNumber },
    });

    payment.refundedAt        = new Date();
    payment.refundedBy        = req.user._id;
    payment.refundTransaction = engineResult.transaction._id;
    payment.adminNotes        = reason.trim();
    await payment.save();

    audit.logBillPayRefunded({ admin: req.user, payment, req }).catch(() => {});

    createNotification({
      userId:   payment.user._id,
      title:    'Bill payment refunded',
      message:  `A refund of $${payment.amount.toFixed(2)} from your ${payment.payee?.name} payment has been credited to your account.`,
      type:     'success',
      category: 'billpay',
    }).catch(() => {});

    return res.status(200).json({ success: true, data: payment, message: 'Refund processed.' });
  } catch (err) {
    next(err);
  }
}
