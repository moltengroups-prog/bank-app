import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import { createError } from '../middleware/error.js';
import { createNotification } from '../utils/notify.js';
import { getIO } from '../socket/index.js';
import * as engine from '../services/bankingEngine.js';
import * as audit  from '../services/auditService.js';

const round2 = (n) => Math.round(n * 100) / 100;

function formatTx(tx) {
  return {
    id:              tx._id,
    referenceNumber: tx.referenceNumber,
    amount:          tx.amount,
    description:     tx.description,
    status:          tx.status,
    fraudStatus:     tx.fraudStatus,
    riskScore:       tx.riskScore,
    fraudFlags:      tx.fraudFlags,
    blockedReason:   tx.blockedReason,
    transactionDate: tx.transactionDate,
    reviewedAt:      tx.reviewedAt,
    pendingMeta:     tx.pendingMeta,
    user: tx.user
      ? { id: tx.user._id, firstName: tx.user.firstName, lastName: tx.user.lastName, email: tx.user.email }
      : null,
    account: tx.account
      ? { id: tx.account._id, accountName: tx.account.accountName, last4: tx.account.last4 }
      : null,
    reviewedBy: tx.reviewedBy
      ? { id: tx.reviewedBy._id, firstName: tx.reviewedBy.firstName, lastName: tx.reviewedBy.lastName }
      : null,
  };
}

// ── GET /api/admin/fraud/pending ──────────────────────────────────
export async function getPendingFraud(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.min(parseInt(limit) || 50, 100);

    const [items, total] = await Promise.all([
      Transaction.find({ fraudStatus: 'pending-review' })
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Math.min(parseInt(limit) || 50, 100))
        .populate('user',       'firstName lastName email')
        .populate('account',    'accountName last4')
        .populate('reviewedBy', 'firstName lastName'),
      Transaction.countDocuments({ fraudStatus: 'pending-review' }),
    ]);

    res.json({ success: true, data: items.map(formatTx), total, page: parseInt(page) || 1 });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/fraud/history ──────────────────────────────────
export async function getFraudHistory(req, res, next) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.min(parseInt(limit) || 50, 100);

    const filter = {
      fraudStatus: status
        ? status
        : { $in: ['blocked', 'approved', 'rejected', 'monitoring'] },
    };

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Math.min(parseInt(limit) || 50, 100))
        .populate('user',       'firstName lastName email')
        .populate('account',    'accountName last4')
        .populate('reviewedBy', 'firstName lastName'),
      Transaction.countDocuments(filter),
    ]);

    res.json({ success: true, data: items.map(formatTx), total, page: parseInt(page) || 1 });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/fraud/stats ────────────────────────────────────
export async function getFraudStats(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pending, blockedToday, approvedToday, rejectedToday, frozenAccounts] = await Promise.all([
      Transaction.countDocuments({ fraudStatus: 'pending-review' }),
      Transaction.countDocuments({ fraudStatus: 'blocked',  transactionDate: { $gte: startOfDay } }),
      Transaction.countDocuments({ fraudStatus: 'approved', transactionDate: { $gte: startOfDay } }),
      Transaction.countDocuments({ fraudStatus: 'rejected', transactionDate: { $gte: startOfDay } }),
      BankAccount.countDocuments({ status: 'frozen' }),
    ]);

    res.json({
      success: true,
      data: { pending, blockedToday, approvedToday, rejectedToday, frozenAccounts },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/fraud/:id/approve ────────────────────────────
export async function approveFraud(req, res, next) {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, fraudStatus: 'pending-review' })
      .populate('user', 'firstName lastName email _id');

    if (!tx) return next(createError('Pending fraud case not found', 404));

    const { fromAccountId, toAccountId } = tx.pendingMeta || {};
    if (!fromAccountId || !toAccountId) {
      return next(createError('Transfer metadata missing — cannot execute', 422));
    }

    // Execute via the banking engine (atomic, ledger-backed)
    let execResult;
    try {
      const fromAcct = await BankAccount.findById(fromAccountId);
      const toAcct   = await BankAccount.findById(toAccountId);
      if (!fromAcct || !toAcct) {
        return next(createError('One or both accounts no longer exist', 422));
      }

      execResult = await engine.transferFunds({
        fromAccountId,
        toAccountId,
        amount:      tx.amount,
        description: `Transfer to ${toAcct.accountName} ••••${toAcct.last4}`,
        toDescription: `Transfer from ${fromAcct.accountName} ••••${fromAcct.last4}`,
        category:    'transfer',
        initiatedBy: req.user._id,
        // Preserve original fraud metadata from the routing engine
        fraudFlags:  tx.fraudFlags,
        fraudStatus: 'approved',
        riskScore:   tx.riskScore,
        metadata:    { approvedPendingTxId: tx._id.toString(), approvedBy: req.user._id.toString() },
      });
    } catch (execErr) {
      return next(createError(`Transfer execution failed: ${execErr.message}`, 422));
    }

    // Mark the original pending transaction as approved + completed
    await Transaction.findByIdAndUpdate(tx._id, {
      $set: {
        fraudStatus:  'approved',
        status:       'completed',
        reviewedBy:   req.user._id,
        reviewedAt:   new Date(),
        description:  tx.description.replace('PENDING REVIEW: ', ''),
        'metadata.approvedTransferRef': execResult.transferRef,
      },
    });

    // Audit
    audit.logTransferApproval({ admin: req.user, transaction: tx, req }).catch(() => {});
    audit.logFraudApproval({ admin: req.user, transaction: tx, req }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:securityAlert', {
        type:       'FRAUD_APPROVED',
        severity:   'info',
        userId:     String(tx.user._id),
        userName:   `${tx.user.firstName} ${tx.user.lastName}`,
        amount:     tx.amount,
        ref:        tx.referenceNumber,
        reviewedBy: `${req.user.firstName} ${req.user.lastName}`,
        timestamp:  new Date(),
      });
    }

    createNotification({
      userId:   tx.user._id,
      title:    'Transfer approved',
      message:  `Your transfer of $${Number(tx.amount).toFixed(2)} has been reviewed and approved. The funds have been moved.`,
      type:     'success',
      category: 'security',
    }).catch(() => {});

    res.json({ success: true, message: 'Transfer approved and executed.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/fraud/:id/reject ─────────────────────────────
export async function rejectFraud(req, res, next) {
  try {
    const { reason = 'Rejected by fraud review team' } = req.body;

    const tx = await Transaction.findOne({ _id: req.params.id, fraudStatus: 'pending-review' })
      .populate('user', 'firstName lastName email _id');

    if (!tx) return next(createError('Pending fraud case not found', 404));

    await Transaction.findByIdAndUpdate(tx._id, {
      fraudStatus:   'rejected',
      status:        'failed',
      blockedReason: reason,
      reviewedBy:    req.user._id,
      reviewedAt:    new Date(),
    });

    // Audit
    audit.logTransferRejection({ admin: req.user, transaction: tx, reason, req }).catch(() => {});
    audit.logFraudRejection({ admin: req.user, transaction: tx, reason, req }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:securityAlert', {
        type:       'FRAUD_REJECTED',
        severity:   'warning',
        userId:     String(tx.user._id),
        userName:   `${tx.user.firstName} ${tx.user.lastName}`,
        amount:     tx.amount,
        ref:        tx.referenceNumber,
        reason,
        reviewedBy: `${req.user.firstName} ${req.user.lastName}`,
        timestamp:  new Date(),
      });
    }

    createNotification({
      userId:   tx.user._id,
      title:    'Transfer rejected',
      message:  `Your transfer of $${Number(tx.amount).toFixed(2)} was rejected after security review. No funds were moved. Contact support for details.`,
      type:     'error',
      category: 'security',
    }).catch(() => {});

    res.json({ success: true, message: 'Transfer rejected.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/fraud/:id/freeze-account ──────────────────────
export async function freezeAccountForFraud(req, res, next) {
  try {
    const { reason = 'Frozen due to suspicious activity' } = req.body;

    const tx = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName email _id');

    if (!tx) return next(createError('Transaction not found', 404));

    const accountId = tx.pendingMeta?.fromAccountId || tx.account;

    const freezeResult = await engine.freezeAccount({
      accountId,
      reason,
      adminId: req.user._id,
    });

    if (!freezeResult.account) return next(createError('Account not found', 404));
    const account = freezeResult.account;

    // If still pending-review, also reject the transfer
    if (tx.fraudStatus === 'pending-review') {
      await Transaction.findByIdAndUpdate(tx._id, {
        fraudStatus:   'rejected',
        status:        'failed',
        blockedReason: `Account frozen: ${reason}`,
        reviewedBy:    req.user._id,
        reviewedAt:    new Date(),
      });
    }

    // Audit
    audit.logFraudAccountFreeze({ admin: req.user, account, transaction: tx, reason, req }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:securityAlert', {
        type:       'ACCOUNT_FROZEN',
        severity:   'critical',
        userId:     String(tx.user._id),
        userName:   `${tx.user.firstName} ${tx.user.lastName}`,
        accountId:  String(accountId),
        reason,
        reviewedBy: `${req.user.firstName} ${req.user.lastName}`,
        timestamp:  new Date(),
      });
    }

    createNotification({
      userId:   tx.user._id,
      title:    'Account frozen',
      message:  `Your account (••••${account.last4}) has been frozen due to suspicious activity. Contact support to resolve this.`,
      type:     'error',
      category: 'security',
    }).catch(() => {});

    res.json({ success: true, message: 'Account frozen and transfer rejected.', accountId });
  } catch (err) {
    if (err.code === 'ACCOUNT_NOT_FOUND') return next(createError(err.message, 404));
    next(err);
  }
}
