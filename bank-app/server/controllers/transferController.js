import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { createNotification } from '../utils/notify.js';
import { getIO } from '../socket/index.js';
import { evaluateTransfer } from '../fraud/engine.js';
import * as engine from '../services/bankingEngine.js';

const round2 = (n) => Math.round(n * 100) / 100;

function genRef() {
  return (
    'TRF' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

// Execute a pre-approved transfer via the banking engine.
// Called by the fraud approval flow in fraudController.
export async function executeTransfer({ userId, fromAccountId, toAccountId, amount, ref, fraudMeta = {} }) {
  const fromAcct = await BankAccount.findOne({ _id: fromAccountId, user: userId });
  const toAcct   = await BankAccount.findOne({ _id: toAccountId,   user: userId });

  if (!fromAcct) throw new Error('Source account not found.');
  if (!toAcct)   throw new Error('Destination account not found.');

  const result = await engine.transferFunds({
    fromAccountId,
    toAccountId,
    amount:        round2(parseFloat(amount)),
    description:   `Transfer to ${toAcct.accountName} ••••${toAcct.last4}`,
    toDescription: `Transfer from ${fromAcct.accountName} ••••${fromAcct.last4}`,
    category:      'transfer',
    fraudFlags:    fraudMeta.fraudFlags  ?? [],
    fraudStatus:   'approved',
    riskScore:     fraudMeta.riskScore   ?? 0,
    metadata:      { originalRef: ref },
  });

  return {
    fromAccount: { ...fromAcct.toObject(), availableBalance: result.fromAccountBalance },
    toAccount:   { ...toAcct.toObject(),   availableBalance: result.toAccountBalance },
    ref,
    now: new Date(),
  };
}

export async function internalTransfer(req, res, next) {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    const userId = req.user._id;

    if (!fromAccountId || !toAccountId || amount == null) {
      return res.status(400).json({
        success: false,
        message: 'fromAccountId, toAccountId, and amount are required.',
      });
    }

    const parsedAmount = round2(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    if (String(fromAccountId) === String(toAccountId)) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same account.' });
    }

    // Pre-validate accounts exist and belong to user
    const [fromCheck, toCheck] = await Promise.all([
      BankAccount.findOne({ _id: fromAccountId, user: userId }),
      BankAccount.findOne({ _id: toAccountId,   user: userId }),
    ]);

    if (!fromCheck) return res.status(404).json({ success: false, message: 'Source account not found or not owned by you.' });
    if (!toCheck)   return res.status(404).json({ success: false, message: 'Destination account not found or not owned by you.' });
    if (fromCheck.availableBalance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds.' });
    }

    // ── Fraud engine evaluation ───────────────────────────────────────
    const fraud = await evaluateTransfer({
      userId,
      accountId: fromAccountId,
      amount:    parsedAmount,
    });

    const io  = getIO();
    const ref = genRef();
    const now = new Date();
    const amt = `$${parsedAmount.toFixed(2)}`;

    // ── BLOCKED or CRITICAL ───────────────────────────────────────────
    if (fraud.outcome === 'blocked') {
      // Record the blocked attempt without moving money
      await Transaction.create({
        user:            userId,
        account:         fromAccountId,
        type:            'debit',
        category:        'transfer',
        amount:          parsedAmount,
        description:     `BLOCKED: Transfer to ••••${toCheck.last4}`,
        status:          'failed',
        referenceNumber: ref,
        balanceAfter:    fromCheck.availableBalance,
        transactionDate: now,
        riskScore:       fraud.riskScore,
        fraudFlags:      fraud.fraudFlags,
        fraudStatus:     'blocked',
        blockedReason:   fraud.fraudFlags.join(', '),
        pendingMeta:     { fromAccountId, toAccountId },
      });

      // Security alert to admins
      if (io) {
        io.to('admins').emit('admin:securityAlert', {
          type:       'BLOCKED_TRANSFER',
          severity:   'critical',
          riskScore:  fraud.riskScore,
          riskLevel:  fraud.riskLevel,
          flags:      fraud.fraudFlags,
          userId:     String(userId),
          userName:   `${req.user.firstName} ${req.user.lastName}`,
          amount:     parsedAmount,
          ref,
          timestamp:  now,
        });
      }

      // User notification
      createNotification({
        userId,
        title:    'Transfer blocked',
        message:  `Your transfer of ${amt} was blocked due to suspicious activity. Contact support if you believe this is an error.`,
        type:     'error',
        category: 'security',
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        fraudBlocked: true,
        riskLevel: fraud.riskLevel,
        message: 'Transfer blocked due to suspicious activity. Please contact support.',
      });
    }

    // ── HIGH RISK → pending review ────────────────────────────────────
    if (fraud.outcome === 'pending-review') {
      // Record intent without touching balances
      const pendingTx = await Transaction.create({
        user:            userId,
        account:         fromAccountId,
        type:            'debit',
        category:        'transfer',
        amount:          parsedAmount,
        description:     `PENDING REVIEW: Transfer to ${toCheck.accountName} ••••${toCheck.last4}`,
        status:          'pending',
        referenceNumber: ref,
        balanceAfter:    fromCheck.availableBalance,
        transactionDate: now,
        riskScore:       fraud.riskScore,
        fraudFlags:      fraud.fraudFlags,
        fraudStatus:     'pending-review',
        pendingMeta:     { fromAccountId, toAccountId },
      });

      // Security alert to admins (urgent)
      if (io) {
        io.to('admins').emit('admin:securityAlert', {
          type:            'PENDING_REVIEW',
          severity:        'high',
          riskScore:       fraud.riskScore,
          riskLevel:       fraud.riskLevel,
          flags:           fraud.fraudFlags,
          userId:          String(userId),
          userName:        `${req.user.firstName} ${req.user.lastName}`,
          amount:          parsedAmount,
          ref,
          transactionId:   String(pendingTx._id),
          timestamp:       now,
        });
      }

      // User notification
      createNotification({
        userId,
        title:    'Transfer under review',
        message:  `Your transfer of ${amt} is being reviewed for security purposes. It will complete or be released once approved.`,
        type:     'warning',
        category: 'security',
      }).catch(() => {});

      return res.status(202).json({
        success:       true,
        pendingReview: true,
        riskLevel:     fraud.riskLevel,
        referenceNumber: ref,
        message: 'Transfer is pending security review. You will be notified once it is processed.',
      });
    }

    // ── LOW / MEDIUM → execute via banking engine ─────────────────────
    let engineResult;
    try {
      engineResult = await engine.transferFunds({
        fromAccountId,
        toAccountId,
        amount:        parsedAmount,
        description:   `Transfer to ${toCheck.accountName} ••••${toCheck.last4}`,
        toDescription: `Transfer from ${fromCheck.accountName} ••••${fromCheck.last4}`,
        category:      'transfer',
        initiatedBy:   userId,
        // Pass the fraud engine's verdict so the engine doesn't run a second pass
        fraudFlags:    fraud.fraudFlags,
        fraudStatus:   fraud.outcome === 'monitoring' ? 'monitoring' : 'clean',
        riskScore:     fraud.riskScore,
        metadata:      { originalRef: ref },
      });
    } catch (engineErr) {
      if (engineErr.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({ success: false, message: 'Insufficient funds.' });
      }
      if (engineErr.code === 'ACCOUNT_UNAVAILABLE') {
        return res.status(400).json({ success: false, message: engineErr.message });
      }
      if (engineErr.code === 'SAME_ACCOUNT') {
        return res.status(400).json({ success: false, message: engineErr.message });
      }
      // All other banking engine / database errors — log but never expose internals
      console.error('[transferController] banking engine error:', engineErr.message);
      return res.status(500).json({
        success: false,
        message: 'Transfer could not be completed. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        referenceNumber: engineResult.debitTransaction.referenceNumber,
        amount:          parsedAmount,
        riskLevel:       fraud.riskLevel,
        from: {
          id:                  fromAccountId,
          accountName:         fromCheck.accountName,
          last4:               fromCheck.last4,
          maskedAccountNumber: fromCheck.getMaskedAccountNumber(),
          availableBalance:    engineResult.fromAccountBalance,
        },
        to: {
          id:                  toAccountId,
          accountName:         toCheck.accountName,
          last4:               toCheck.last4,
          maskedAccountNumber: toCheck.getMaskedAccountNumber(),
          availableBalance:    engineResult.toAccountBalance,
        },
      },
    });

    // ── Post-response: admin alerts + notifications ─────────────────
    if (io) {
      io.to('admins').emit('admin:newTransfer', {
        referenceNumber: engineResult.debitTransaction.referenceNumber,
        amount:          parsedAmount,
        riskScore:       fraud.riskScore,
        riskLevel:       fraud.riskLevel,
        userId:          String(userId),
        fromAccount:     `${fromCheck.accountName} ••••${fromCheck.last4}`,
        toAccount:       `${toCheck.accountName} ••••${toCheck.last4}`,
        timestamp:       now,
      });

      if (fraud.riskLevel === 'MEDIUM') {
        io.to('admins').emit('admin:securityAlert', {
          type:      'MONITORING',
          severity:  'medium',
          riskScore: fraud.riskScore,
          riskLevel: fraud.riskLevel,
          flags:     fraud.fraudFlags,
          userId:    String(userId),
          userName:  `${req.user.firstName} ${req.user.lastName}`,
          amount:    parsedAmount,
          ref,
          timestamp: now,
        });
      }
    }

    const notifPromises = [
      createNotification({
        userId,
        title:    'Transfer completed',
        message:  `You transferred ${amt} from ${fromCheck.accountName} to ${toCheck.accountName}.`,
        type:     'success',
        category: 'transfer',
        metadata: { referenceNumber: ref, fromAccountId, toAccountId, amount: parsedAmount },
      }),
    ];

    // Extra security notification for MEDIUM risk
    if (fraud.riskLevel === 'MEDIUM') {
      notifPromises.push(
        createNotification({
          userId,
          title:    'Security notice',
          message:  `A transfer of ${amt} was completed and flagged for monitoring. If you did not initiate this, contact support immediately.`,
          type:     'warning',
          category: 'security',
        })
      );
    }

    Promise.all(notifPromises).catch(() => {});
  } catch (err) {
    next(err);
  }
}
