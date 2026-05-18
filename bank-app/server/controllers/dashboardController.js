import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { createError } from '../middleware/error.js';

// ── GET /api/dashboard/accounts/:id/number ────────────────────────
export async function getFullAccountNumber(req, res, next) {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).select('+accountNumber');

    if (!account) {
      return next(createError('Account not found or access denied', 404));
    }

    res.json({ success: true, data: { accountNumber: account.accountNumber } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/dashboard/accounts ───────────────────────────────────
export async function getAccounts(req, res, next) {
  try {
    const accounts = await BankAccount.find({
      user: req.user.id,
      status: { $ne: 'closed' },
    }).sort({ isPrimary: -1, createdAt: 1 });

    const data = accounts.map((acc) => ({
      id:                  acc._id,
      accountName:         acc.accountName,
      accountType:         acc.accountType,
      maskedAccountNumber: acc.getMaskedAccountNumber(),
      routingNumber:       acc.routingNumber,
      balance:             acc.balance,
      availableBalance:    acc.availableBalance,
      currency:            acc.currency,
      status:              acc.status,
      isPrimary:           acc.isPrimary,
      createdAt:           acc.createdAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/dashboard/transactions ───────────────────────────────
export async function getTransactions(req, res, next) {
  try {
    const { accountId, limit = 20 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const filter = { user: req.user.id };

    if (accountId) {
      // Verify the user actually owns this account
      const owned = await BankAccount.findOne({ _id: accountId, user: req.user.id });
      if (!owned) {
        return next(createError('Account not found or access denied', 404));
      }
      filter.account = accountId;
    }

    const transactions = await Transaction.find(filter)
      .sort({ transactionDate: -1 })
      .limit(parsedLimit)
      .populate('account', 'accountName accountType last4');

    const data = transactions.map((tx) => ({
      id:              tx._id,
      account: {
        id:            tx.account._id,
        accountName:   tx.account.accountName,
        accountType:   tx.account.accountType,
        maskedNumber:  `••••${tx.account.last4}`,
      },
      type:            tx.type,
      category:        tx.category,
      amount:          tx.amount,
      description:     tx.description,
      merchant:        tx.merchant,
      status:          tx.status,
      referenceNumber: tx.referenceNumber,
      balanceAfter:    tx.balanceAfter,
      transactionDate: tx.transactionDate,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}
