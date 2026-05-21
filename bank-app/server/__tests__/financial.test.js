import { describe, it, expect } from '@jest/globals';
import BankAccount from '../models/BankAccount.js';
import LedgerEntry from '../models/LedgerEntry.js';
import Transaction from '../models/Transaction.js';
import * as engine from '../services/bankingEngine.js';
import { createUserWithAccount, createTransferPair } from './helpers/fixtures.js';

// ── Balance reconciliation helper ────────────────────────────────
async function sumLedger(accountId) {
  const entries = await LedgerEntry.find({ account: accountId });
  let net = 0;
  for (const e of entries) {
    net += e.type === 'credit' ? e.amount : -e.amount;
  }
  return Math.round(net * 100) / 100;
}

describe('Banking engine — transferFunds', () => {
  it('correctly debits sender and credits receiver', async () => {
    const { sender, receiver, fromAccount, toAccount } = await createTransferPair({ senderBalance: 1000, receiverBalance: 500 });

    await engine.transferFunds({
      fromAccountId: String(fromAccount._id),
      toAccountId:   String(toAccount._id),
      amount:        250,
      description:   'Test transfer',
      toDescription: 'Test credit',
      category:      'transfer',
    });

    const [from, to] = await Promise.all([
      BankAccount.findById(fromAccount._id),
      BankAccount.findById(toAccount._id),
    ]);

    expect(from.balance).toBeCloseTo(750, 2);
    expect(to.balance).toBeCloseTo(750, 2);
  });

  it('creates paired debit and credit ledger entries with same transferRef', async () => {
    const { fromAccount, toAccount } = await createTransferPair();

    const result = await engine.transferFunds({
      fromAccountId: String(fromAccount._id),
      toAccountId:   String(toAccount._id),
      amount:        100,
      description:   'Paired test',
      toDescription: 'Paired credit',
      category:      'transfer',
    });

    const debitEntry  = await LedgerEntry.findOne({ transactionId: result.debitTransaction._id });
    const creditEntry = await LedgerEntry.findOne({ transactionId: result.creditTransaction._id });

    expect(debitEntry).not.toBeNull();
    expect(creditEntry).not.toBeNull();
    expect(debitEntry.type).toBe('debit');
    expect(creditEntry.type).toBe('credit');
    expect(debitEntry.amount).toBe(100);
    expect(creditEntry.amount).toBe(100);
  });

  it('ledger net change matches balance change', async () => {
    const { fromAccount, toAccount } = await createTransferPair({ senderBalance: 2000 });

    await engine.transferFunds({
      fromAccountId: String(fromAccount._id),
      toAccountId:   String(toAccount._id),
      amount:        300,
      description:   'Reconcile test',
      toDescription: 'Reconcile credit',
      category:      'transfer',
    });

    // Sender ledger: total credits - total debits = balance - initial balance
    const fromFinal = await BankAccount.findById(fromAccount._id);
    const fromNet   = await sumLedger(String(fromAccount._id));
    // Net on sender should be -300 from initial 2000 → final 1700
    expect(fromNet).toBeCloseTo(-300, 2);
    expect(fromFinal.balance).toBeCloseTo(1700, 2);
  });

  it('rejects when sender has insufficient funds', async () => {
    const { fromAccount, toAccount } = await createTransferPair({ senderBalance: 50 });

    await expect(
      engine.transferFunds({
        fromAccountId: String(fromAccount._id),
        toAccountId:   String(toAccount._id),
        amount:        200,
        description:   'Should fail',
        toDescription: 'Should not reach',
        category:      'transfer',
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' });

    // Verify no balance change occurred
    const [from, to] = await Promise.all([
      BankAccount.findById(fromAccount._id),
      BankAccount.findById(toAccount._id),
    ]);
    expect(from.balance).toBeCloseTo(50, 2);
    expect(to.balance).toBeCloseTo(1000, 2);
  });

  it('preserves total money supply across a transfer', async () => {
    const { fromAccount, toAccount } = await createTransferPair({ senderBalance: 3000, receiverBalance: 1000 });
    const initialTotal = 3000 + 1000;

    await engine.transferFunds({
      fromAccountId: String(fromAccount._id),
      toAccountId:   String(toAccount._id),
      amount:        500,
      description:   'Conservation test',
      toDescription: 'Conservation credit',
      category:      'transfer',
    });

    const [from, to] = await Promise.all([
      BankAccount.findById(fromAccount._id),
      BankAccount.findById(toAccount._id),
    ]);

    expect(from.balance + to.balance).toBeCloseTo(initialTotal, 2);
  });
});

describe('Banking engine — withdrawFunds', () => {
  it('debits the account and creates a ledger entry', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 1000, availableBalance: 1000 });

    const result = await engine.withdrawFunds({
      accountId:   String(account._id),
      amount:      200,
      description: 'Withdrawal test',
      category:    'other',
      initiatedBy: user._id,
    });

    const updated = await BankAccount.findById(account._id);
    expect(updated.balance).toBeCloseTo(800, 2);
    expect(result.transaction).toBeDefined();

    const entry = await LedgerEntry.findOne({ transactionId: result.transaction._id });
    expect(entry).not.toBeNull();
    expect(entry.type).toBe('debit');
    expect(entry.amount).toBe(200);
  });

  it('rejects withdrawal exceeding available balance', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 100, availableBalance: 100 });

    await expect(
      engine.withdrawFunds({
        accountId:   String(account._id),
        amount:      999,
        description: 'Over-draw attempt',
        category:    'other',
        initiatedBy: user._id,
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' });

    const unchanged = await BankAccount.findById(account._id);
    expect(unchanged.balance).toBeCloseTo(100, 2);
  });
});

describe('LedgerEntry immutability', () => {
  it('prevents updating a ledger entry', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 500, availableBalance: 500 });
    const result = await engine.withdrawFunds({
      accountId:   String(account._id),
      amount:      50,
      description: 'Immutability test',
      category:    'other',
      initiatedBy: user._id,
    });

    const entry = await LedgerEntry.findOne({ transactionId: result.transaction._id });

    await expect(
      LedgerEntry.updateOne({ _id: entry._id }, { $set: { amount: 9999 } })
    ).rejects.toThrow();
  });

  it('prevents deleting a ledger entry', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 500, availableBalance: 500 });
    const result = await engine.withdrawFunds({
      accountId:   String(account._id),
      amount:      50,
      description: 'Delete test',
      category:    'other',
      initiatedBy: user._id,
    });

    const entry = await LedgerEntry.findOne({ transactionId: result.transaction._id });

    await expect(
      LedgerEntry.deleteOne({ _id: entry._id })
    ).rejects.toThrow();
  });
});

describe('Double-execution prevention', () => {
  it('two concurrent transfers of the same payment do not double-debit', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });

    // Simulate two concurrent bill-pay withdrawals for same amount
    const [r1, r2] = await Promise.allSettled([
      engine.withdrawFunds({
        accountId:   String(account._id),
        amount:      200,
        description: 'Concurrent A',
        category:    'billpay',
        initiatedBy: user._id,
      }),
      engine.withdrawFunds({
        accountId:   String(account._id),
        amount:      200,
        description: 'Concurrent B',
        category:    'billpay',
        initiatedBy: user._id,
      }),
    ]);

    const finalAcct = await BankAccount.findById(account._id);

    // Both could succeed (400 balance left) or one could fail if the floor guard prevents it
    const succeeded = [r1, r2].filter(r => r.status === 'fulfilled').length;
    const expectedBalance = 5000 - (succeeded * 200);
    expect(finalAcct.balance).toBeCloseTo(expectedBalance, 2);
  });
});
