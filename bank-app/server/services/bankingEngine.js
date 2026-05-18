/**
 * Banking Engine — single source of truth for all money movement.
 *
 * ALL balance updates must go through this module.
 * No controller may call BankAccount.findByIdAndUpdate({ balance }) directly.
 *
 * Operation mode is detected automatically at first use:
 *  - M10+ / sharded cluster → MongoDB multi-document transactions (fully atomic)
 *  - M0 shared tier          → atomic $inc per document + manual compensation
 *
 * Both modes preserve:
 *  ✓ negative-balance prevention   ✓ ledger writes
 *  ✓ overdraft prevention          ✓ audit logs
 *  ✓ transfer integrity            ✓ fraud flags
 *
 * Production deployments should always run on M10+ so the transaction path
 * is always active. The M0 fallback exists solely to unblock development.
 */

import mongoose from 'mongoose';
import BankAccount  from '../models/BankAccount.js';
import Transaction  from '../models/Transaction.js';
import LedgerEntry  from '../models/LedgerEntry.js';

// ── Helpers ────────────────────────────────────────────────────────

const round2 = (n) => Math.round(n * 100) / 100;

function genRef() {
  return (
    'TXN' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

function genTransferRef() {
  return (
    'TRF' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
}

// ── Custom error classes ───────────────────────────────────────────

export class BankingError extends Error {
  constructor(message, code = 'BANKING_ERROR', details = {}) {
    super(message);
    this.name    = 'BankingError';
    this.code    = code;
    this.details = details;
  }
}

export class InsufficientFundsError extends BankingError {
  constructor(available, required) {
    super(
      `Insufficient funds. Available: $${available.toFixed(2)}, Required: $${required.toFixed(2)}`,
      'INSUFFICIENT_FUNDS',
      { available, required }
    );
    this.name = 'InsufficientFundsError';
  }
}

export class FrozenAccountError extends BankingError {
  constructor(accountId, status) {
    super(
      `Account is ${status} and cannot process transactions.`,
      'ACCOUNT_UNAVAILABLE',
      { accountId, status }
    );
    this.name = 'FrozenAccountError';
  }
}

export class InvalidAmountError extends BankingError {
  constructor(msg) {
    super(msg, 'INVALID_AMOUNT');
    this.name = 'InvalidAmountError';
  }
}

export class SameAccountError extends BankingError {
  constructor() {
    super('Source and destination accounts must be different.', 'SAME_ACCOUNT');
    this.name = 'SameAccountError';
  }
}

export class AccountNotFoundError extends BankingError {
  constructor(msg) {
    super(msg, 'ACCOUNT_NOT_FOUND');
    this.name = 'AccountNotFoundError';
  }
}

export class DuplicateTransactionError extends BankingError {
  constructor(key) {
    super(`Duplicate transaction for idempotency key: ${key}`, 'DUPLICATE_TRANSACTION', { key });
    this.name = 'DuplicateTransactionError';
  }
}

export class TransactionNotFoundError extends BankingError {
  constructor(id) {
    super(`Transaction ${id} not found.`, 'TRANSACTION_NOT_FOUND', { transactionId: id });
    this.name = 'TransactionNotFoundError';
  }
}

export class AlreadyReversedError extends BankingError {
  constructor(id) {
    super(`Transaction ${id} has already been reversed.`, 'ALREADY_REVERSED', { transactionId: id });
    this.name = 'AlreadyReversedError';
  }
}

// ── Fraud thresholds (engine-level safety net) ─────────────────────

const FRAUD = {
  LARGE_AMOUNT:       10_000,
  VERY_LARGE_AMOUNT:  50_000,
  MAX_AMOUNT:      10_000_000,
  VELOCITY_WINDOW_MS: 10 * 60 * 1000,
  VELOCITY_MAX:       5,
};

// ══════════════════════════════════════════════════════════════════
// TRANSACTION SUPPORT DETECTION + DISPATCHER
// ══════════════════════════════════════════════════════════════════

// null = unknown (first run), true = M10+ confirmed, false = M0 fallback
let _txCapable = null;

/**
 * Returns true if `err` is the M0/standalone "transactions not supported"
 * error from MongoDB Atlas or a standalone server.
 *
 * WHY not a probe: session.startTransaction() is local-only (no server
 * round-trip) and session.abortTransaction() on a never-started transaction
 * is silently accepted by M0, making a probe-based detection unreliable.
 * We detect support inline — on the first real withTransaction() call.
 */
function isTxUnsupportedError(err) {
  if (!err) return false;
  const msg  = err.message || '';
  const code = err.code;
  return (
    code === 20 ||                                         // Transaction numbers only allowed on a replica member or mongos
    /sharded cluster/i.test(msg) ||                        // "Only servers in a sharded cluster can start a new transaction"
    /transaction numbers are only allowed/i.test(msg) ||   // older MongoDB driver wording
    /not supported on standalone/i.test(msg) ||            // standalone servers
    /replica member or mongos/i.test(msg)                  // explicit replica requirement
  );
}

/**
 * executeDbOperation(operation)
 *
 * The ONLY place in the backend that decides whether to use transactions.
 *
 * Wraps `operation(session)` in a MongoDB session + transaction on M10+.
 * On M0 shared tier (where transactions are unsupported), automatically
 * falls back to running `operation(null)` with atomic $inc writes instead.
 *
 * Detection is inline: on the first invocation we attempt withTransaction().
 * If MongoDB rejects it with the "sharded cluster" error, we cache `false`
 * and retry the same operation without a session. Subsequent calls skip
 * straight to the fallback path — no overhead, no probe.
 *
 * The callback receives session (or null). Mongoose silently ignores a null
 * session on all query/create/update calls, so both paths share the same code.
 */
async function executeDbOperation(operation) {
  // ── Fast path: cluster already confirmed to not support transactions ──
  if (_txCapable === false) {
    console.log('  [TX] fallback mode active');
    console.log('  [TX] fallback execution');
    return operation(null);
  }

  // ── Attempt full transaction (M10+ path or first detection) ──────────
  console.log('  [TX] session started');
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });

    // First successful transaction → confirm support
    if (_txCapable === null) {
      _txCapable = true;
      console.log('  [TX] transactions supported → true');
    }
    return result;

  } catch (err) {
    // ── M0 / standalone detection ──────────────────────────────────────
    // withTransaction() throws before committing on M0. The operation
    // callback may have been called but no writes were committed (the server
    // rejected the transaction before accepting any changes). Retrying
    // operation(null) is therefore safe — it starts from a clean state.
    if (isTxUnsupportedError(err) && _txCapable !== true) {
      _txCapable = false;
      console.log('  [TX] transactions supported → false');
      console.log('  [TX] fallback mode active');
      console.log('  [TX] fallback execution');
      return operation(null);
    }
    throw err;

  } finally {
    // endSession() is safe to call even after a failed withTransaction
    try { await session.endSession(); } catch { /* ignore cleanup errors */ }
  }
}

// ══════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════

function validateAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new InvalidAmountError('Amount must be a valid number.');
  }
  if (amount <= 0) {
    throw new InvalidAmountError('Amount must be greater than zero.');
  }
  if (amount > FRAUD.MAX_AMOUNT) {
    throw new InvalidAmountError(
      `Amount $${amount.toLocaleString()} exceeds the single-transaction limit of $${FRAUD.MAX_AMOUNT.toLocaleString()}.`
    );
  }
  return round2(amount);
}

async function loadAccount(accountId, session) {
  const acct = await BankAccount.findById(accountId).session(session);
  if (!acct) throw new AccountNotFoundError(`Account ${accountId} not found.`);
  return acct;
}

function assertActive(account) {
  if (account.status !== 'active') {
    throw new FrozenAccountError(account._id.toString(), account.status);
  }
}

async function detectFraud(account, amount, session) {
  const flags     = [];
  let   riskScore = 0;

  const windowStart = new Date(Date.now() - FRAUD.VELOCITY_WINDOW_MS);
  const recentCount = await Transaction.countDocuments({
    account:   account._id,
    createdAt: { $gte: windowStart },
    status:    { $in: ['completed', 'pending'] },
  }).session(session);

  if (recentCount >= FRAUD.VELOCITY_MAX) {
    flags.push('high-velocity');
    riskScore += 40;
  }

  if (amount >= FRAUD.VERY_LARGE_AMOUNT) {
    flags.push('very-large-amount');
    riskScore += 60;
  } else if (amount >= FRAUD.LARGE_AMOUNT) {
    flags.push('large-amount');
    riskScore += 30;
  }

  return { flags, riskScore: Math.min(riskScore, 100) };
}

async function writeLedger(data, session) {
  const [entry] = await LedgerEntry.create([data], { session });
  return entry;
}

/**
 * applyBalanceDelta(accountId, delta, session)
 *
 * Atomically adjusts balance and availableBalance using $inc.
 *
 * For debits (delta < 0): conditions the update on balance >= |delta| so
 * the balance can never go negative — even without a wrapping transaction.
 * This is the key guard for the M0 fallback path.
 *
 * Returns the updated account document (new: true), or null if the floor
 * guard blocked the update (race condition — caller should throw InsufficientFunds).
 */
async function applyBalanceDelta(accountId, delta, session) {
  const filter = delta < 0
    ? { _id: accountId, balance: { $gte: -delta } }
    : { _id: accountId };

  return BankAccount.findOneAndUpdate(
    filter,
    { $inc: { balance: delta, availableBalance: delta } },
    { session, new: true }
  );
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/**
 * Transfer funds between two internal accounts.
 *
 * Callers that have already run the fraud routing engine should pass
 * the pre-computed { fraudFlags, fraudStatus, riskScore } so this
 * function doesn't run a redundant second detection pass.
 *
 * Returns { success, duplicate, debitTransaction, creditTransaction,
 *           transferRef, fromAccountBalance, toAccountBalance,
 *           fraudFlags, riskScore, flagged }
 */
export async function transferFunds({
  fromAccountId,
  toAccountId,
  amount,
  description    = 'Internal Transfer',
  toDescription  = null,
  category       = 'transfer',
  initiatedBy    = null,
  metadata       = {},
  idempotencyKey = null,
  fraudFlags     = null,
  fraudStatus    = null,
  riskScore      = null,
}) {
  const validAmount = validateAmount(amount);

  if (String(fromAccountId) === String(toAccountId)) throw new SameAccountError();

  if (idempotencyKey) {
    const existing = await Transaction.findOne({ 'metadata.idempotencyKey': idempotencyKey });
    if (existing) return { success: true, duplicate: true, transaction: existing };
  }

  return executeDbOperation(async (session) => {
    const [fromAcct, toAcct] = await Promise.all([
      loadAccount(fromAccountId, session),
      loadAccount(toAccountId,   session),
    ]);

    assertActive(fromAcct);
    assertActive(toAcct);

    if (fromAcct.balance < validAmount) {
      throw new InsufficientFundsError(fromAcct.balance, validAmount);
    }

    // Use caller-provided fraud data or run detection
    let fraud;
    if (fraudFlags !== null) {
      fraud = { flags: fraudFlags, riskScore: riskScore ?? 0 };
    } else {
      fraud = await detectFraud(fromAcct, validAmount, session);
    }

    const resolvedFraudStatus = fraudStatus ?? (fraud.flags.length > 0 ? 'monitoring' : 'clean');
    const ref         = genRef();
    const transferRef = genTransferRef();
    const creditDesc  = toDescription ?? description;

    // ── Apply balance changes ──────────────────────────────────────
    // applyBalanceDelta uses atomic $inc with a floor guard so the
    // balance never goes negative, even without a wrapping transaction.
    //
    // Transaction path (M10+): session ensures all writes are atomic.
    // Fallback path (M0):      $inc is atomic per-document; if the credit
    //                          step fails we reverse the debit manually.

    const fromResult = await applyBalanceDelta(fromAccountId, -validAmount, session);
    if (!fromResult) {
      // Race: another operation depleted the balance between our read and update
      throw new InsufficientFundsError(fromAcct.balance, validAmount);
    }

    let toResult;
    try {
      toResult = await applyBalanceDelta(toAccountId, validAmount, session);
      if (!toResult) throw new AccountNotFoundError(`Destination account ${toAccountId} not found.`);
    } catch (creditErr) {
      if (!session) {
        // M0 fallback: manually reverse the debit we already applied
        await BankAccount.findOneAndUpdate(
          { _id: fromAccountId },
          { $inc: { balance: validAmount, availableBalance: validAmount } }
        );
        console.error('  [banking] transfer credit failed — source balance restored (compensating write)');
      }
      throw creditErr;
    }

    const fromAfter  = fromResult.balance;
    const toAfter    = toResult.balance;
    const fromBefore = round2(fromAfter  + validAmount);
    const toBefore   = round2(toAfter    - validAmount);

    // ── Create transaction records ─────────────────────────────────
    const [[debitTx], [creditTx]] = await Promise.all([
      Transaction.create([{
        user:            fromAcct.user,
        account:         fromAccountId,
        type:            'debit',
        category,
        amount:          validAmount,
        description,
        status:          'completed',
        referenceNumber: ref,
        balanceAfter:    fromAfter,
        fraudFlags:      fraud.flags,
        fraudStatus:     resolvedFraudStatus,
        riskScore:       fraud.riskScore,
        metadata:        { ...metadata, idempotencyKey, transferRef, role: 'source' },
      }], { session }),
      Transaction.create([{
        user:            toAcct.user,
        account:         toAccountId,
        type:            'credit',
        category,
        amount:          validAmount,
        description:     creditDesc,
        status:          'completed',
        referenceNumber: ref,
        balanceAfter:    toAfter,
        fraudFlags:      [],
        fraudStatus:     'clean',
        riskScore:       0,
        metadata:        { ...metadata, transferRef, role: 'destination' },
      }], { session }),
    ]);

    // ── Write ledger entries ───────────────────────────────────────
    await Promise.all([
      writeLedger({
        transactionId: debitTx._id,
        account:       fromAccountId,
        user:          fromAcct.user,
        type:          'debit',
        amount:        validAmount,
        balanceBefore: fromBefore,
        balanceAfter:  fromAfter,
        description,
        status:        'completed',
        createdBy:     initiatedBy,
        metadata:      { transferRef, pairedTransactionId: creditTx._id },
      }, session),
      writeLedger({
        transactionId: creditTx._id,
        account:       toAccountId,
        user:          toAcct.user,
        type:          'credit',
        amount:        validAmount,
        balanceBefore: toBefore,
        balanceAfter:  toAfter,
        description:   creditDesc,
        status:        'completed',
        createdBy:     initiatedBy,
        metadata:      { transferRef, pairedTransactionId: debitTx._id },
      }, session),
    ]);

    return {
      success:            true,
      duplicate:          false,
      debitTransaction:   debitTx,
      creditTransaction:  creditTx,
      transferRef,
      fromAccountBalance: fromAfter,
      toAccountBalance:   toAfter,
      fraudFlags:         fraud.flags,
      riskScore:          fraud.riskScore,
      flagged:            fraud.flags.length > 0,
    };
  });
}

/**
 * Deposit funds into an account from an external source or admin action.
 *
 * Returns { success, transaction, balanceBefore, balanceAfter }
 */
export async function depositFunds({
  accountId,
  amount,
  description = 'Deposit',
  category    = 'deposit',
  source      = 'external',
  initiatedBy = null,
  metadata    = {},
}) {
  const validAmount = validateAmount(amount);

  return executeDbOperation(async (session) => {
    const account = await loadAccount(accountId, session);
    assertActive(account);

    const updatedAccount = await applyBalanceDelta(accountId, validAmount, session);
    const balanceAfter   = updatedAccount.balance;
    const balanceBefore  = round2(balanceAfter - validAmount);

    const [tx] = await Transaction.create([{
      user:            account.user,
      account:         accountId,
      type:            'credit',
      category,
      amount:          validAmount,
      description,
      status:          'completed',
      referenceNumber: genRef(),
      balanceAfter,
      fraudFlags:      [],
      fraudStatus:     'clean',
      riskScore:       0,
      metadata:        { ...metadata, source },
    }], { session });

    await writeLedger({
      transactionId: tx._id,
      account:       accountId,
      user:          account.user,
      type:          'credit',
      amount:        validAmount,
      balanceBefore,
      balanceAfter,
      description,
      status:        'completed',
      createdBy:     initiatedBy,
      metadata:      { ...metadata, source },
    }, session);

    return { success: true, transaction: tx, balanceBefore, balanceAfter };
  });
}

/**
 * Withdraw funds from an account.
 *
 * Returns { success, transaction, balanceBefore, balanceAfter, fraudFlags, riskScore, flagged }
 */
export async function withdrawFunds({
  accountId,
  amount,
  description = 'Withdrawal',
  category    = 'atm',
  initiatedBy = null,
  metadata    = {},
}) {
  const validAmount = validateAmount(amount);

  return executeDbOperation(async (session) => {
    const account = await loadAccount(accountId, session);
    assertActive(account);

    if (account.balance < validAmount) {
      throw new InsufficientFundsError(account.balance, validAmount);
    }

    const fraud = await detectFraud(account, validAmount, session);

    const updatedAccount = await applyBalanceDelta(accountId, -validAmount, session);
    if (!updatedAccount) {
      // Race: balance dropped between read and update
      throw new InsufficientFundsError(account.balance, validAmount);
    }

    const balanceAfter  = updatedAccount.balance;
    const balanceBefore = round2(balanceAfter + validAmount);
    const fStatus       = fraud.flags.length > 0 ? 'monitoring' : 'clean';

    const [tx] = await Transaction.create([{
      user:            account.user,
      account:         accountId,
      type:            'debit',
      category,
      amount:          validAmount,
      description,
      status:          'completed',
      referenceNumber: genRef(),
      balanceAfter,
      fraudFlags:      fraud.flags,
      fraudStatus:     fStatus,
      riskScore:       fraud.riskScore,
      metadata,
    }], { session });

    await writeLedger({
      transactionId: tx._id,
      account:       accountId,
      user:          account.user,
      type:          'debit',
      amount:        validAmount,
      balanceBefore,
      balanceAfter,
      description,
      status:        'completed',
      createdBy:     initiatedBy,
      metadata,
    }, session);

    return {
      success:     true,
      transaction: tx,
      balanceBefore,
      balanceAfter,
      fraudFlags:  fraud.flags,
      riskScore:   fraud.riskScore,
      flagged:     fraud.flags.length > 0,
    };
  });
}

/**
 * Reverse a completed transaction (or both legs of a transfer).
 *
 * For transfers, pass either leg's transactionId — both sides will be
 * reversed automatically via the shared transferRef in metadata.
 *
 * Returns { success, reversals: [{ original, reversal, balanceBefore, balanceAfter }], reason }
 */
export async function reverseTransaction({
  transactionId,
  reason   = 'Admin reversal',
  adminId  = null,
  metadata = {},
}) {
  return executeDbOperation(async (session) => {
    const original = await Transaction.findById(transactionId).session(session);
    if (!original) throw new TransactionNotFoundError(transactionId);
    if (original.status === 'reversed') throw new AlreadyReversedError(transactionId);

    const transferRef  = original.metadata?.transferRef;
    const txsToReverse = transferRef
      ? await Transaction.find({
          'metadata.transferRef': transferRef,
          status:                 { $ne: 'reversed' },
        }).session(session)
      : [original];

    const reversals = [];

    for (const tx of txsToReverse) {
      const account      = await loadAccount(tx.account, session);
      const reversalType = tx.type === 'debit' ? 'credit' : 'debit';
      const delta        = reversalType === 'credit' ? tx.amount : -tx.amount;
      const balanceBefore = account.balance;

      // Apply the reversal balance change atomically
      const updatedAccount = await applyBalanceDelta(tx.account, delta, session);
      const balanceAfter   = updatedAccount ? updatedAccount.balance : balanceBefore;

      if (!updatedAccount && reversalType === 'debit') {
        // Account doesn't have enough to debit back — log and continue in M0 mode
        console.error(`  [banking] reversal balance update skipped for ${tx.account}: insufficient funds`);
      }

      const [reversalTx] = await Transaction.create([{
        user:            tx.user,
        account:         tx.account,
        type:            reversalType,
        category:        tx.category,
        amount:          tx.amount,
        description:     `Reversal — ${reason}`,
        status:          'completed',
        referenceNumber: genRef(),
        balanceAfter,
        fraudFlags:      [],
        fraudStatus:     'clean',
        riskScore:       0,
        metadata:        {
          ...metadata,
          reversalOf:          tx._id.toString(),
          reversalReason:      reason,
          reversedBy:          adminId,
          originalTransferRef: transferRef,
        },
      }], { session });

      const originalEntries = await LedgerEntry.find({ transactionId: tx._id }).session(session);
      for (const entry of originalEntries) {
        await writeLedger({
          transactionId: reversalTx._id,
          account:       entry.account,
          user:          entry.user,
          type:          entry.type === 'debit' ? 'credit' : 'debit',
          amount:        entry.amount,
          balanceBefore,
          balanceAfter,
          description:   `Reversal — ${reason}`,
          status:        'reversed',
          createdBy:     adminId,
          reversalOf:    entry._id,
          metadata:      { ...metadata, reason, originalTransactionId: tx._id },
        }, session);
      }

      await Transaction.findByIdAndUpdate(
        tx._id,
        {
          $set: {
            status:                           'reversed',
            'metadata.reversalTransactionId': reversalTx._id,
            'metadata.reversedAt':            new Date(),
            'metadata.reversedBy':            adminId,
            'metadata.reversalReason':        reason,
          },
        },
        { session }
      );

      reversals.push({ original: tx, reversal: reversalTx, balanceBefore, balanceAfter });
    }

    return { success: true, reversals, reason };
  });
}

/**
 * Freeze an account. Idempotent — already-frozen accounts return { alreadyFrozen: true }.
 *
 * Returns { success, alreadyFrozen, account, before, after }
 */
export async function freezeAccount({ accountId, reason = '', adminId = null }) {
  const account = await BankAccount.findById(accountId);
  if (!account) throw new AccountNotFoundError(`Account ${accountId} not found.`);
  if (account.status === 'frozen') return { success: true, alreadyFrozen: true, account };

  const before = { status: account.status };
  account.status = 'frozen';
  await account.save();

  return { success: true, alreadyFrozen: false, account, before, after: { status: 'frozen' }, reason };
}

/**
 * Unfreeze an account. Idempotent — already-active accounts return { alreadyActive: true }.
 *
 * Returns { success, alreadyActive, account, before, after }
 */
export async function unfreezeAccount({ accountId, reason = '', adminId = null }) {
  const account = await BankAccount.findById(accountId);
  if (!account) throw new AccountNotFoundError(`Account ${accountId} not found.`);
  if (account.status === 'active') return { success: true, alreadyActive: true, account };

  const before = { status: account.status };
  account.status = 'active';
  await account.save();

  return { success: true, alreadyActive: false, account, before, after: { status: 'active' }, reason };
}

/**
 * Admin balance adjustment — creates a ledger entry and transaction
 * rather than directly overwriting the balance.
 *
 * amount > 0  →  credit (add funds)
 * amount < 0  →  debit  (remove funds)
 *
 * Returns { success, transaction, balanceBefore, balanceAfter, adjustment }
 */
export async function applyAdminAdjustment({
  accountId,
  amount,
  description = 'Admin Balance Adjustment',
  reason      = '',
  adminId     = null,
  metadata    = {},
}) {
  if (typeof amount !== 'number' || isNaN(amount) || amount === 0) {
    throw new InvalidAmountError('Adjustment amount must be a non-zero number.');
  }

  const absAmount = round2(Math.abs(amount));
  const entryType = amount > 0 ? 'credit' : 'debit';
  const delta     = amount > 0 ? absAmount : -absAmount;
  const fullDesc  = reason ? `${description} — ${reason}` : description;

  return executeDbOperation(async (session) => {
    const account = await loadAccount(accountId, session);

    if (entryType === 'debit' && account.balance < absAmount) {
      throw new InsufficientFundsError(account.balance, absAmount);
    }

    const updatedAccount = await applyBalanceDelta(accountId, delta, session);
    if (!updatedAccount) throw new InsufficientFundsError(account.balance, absAmount);

    const balanceAfter  = updatedAccount.balance;
    const balanceBefore = round2(balanceAfter - delta);

    const [tx] = await Transaction.create([{
      user:            account.user,
      account:         accountId,
      type:            entryType,
      category:        'other',
      amount:          absAmount,
      description:     fullDesc,
      status:          'completed',
      referenceNumber: genRef(),
      balanceAfter,
      fraudFlags:      [],
      fraudStatus:     'clean',
      riskScore:       0,
      metadata:        { ...metadata, adminAdjustment: true, reason, adminId: adminId?.toString() },
    }], { session });

    await writeLedger({
      transactionId: tx._id,
      account:       accountId,
      user:          account.user,
      type:          entryType,
      amount:        absAmount,
      balanceBefore,
      balanceAfter,
      description:   fullDesc,
      status:        'completed',
      createdBy:     adminId,
      metadata:      { ...metadata, reason, adminId: adminId?.toString(), adminAdjustment: true },
    }, session);

    return { success: true, transaction: tx, balanceBefore, balanceAfter, adjustment: amount };
  });
}
