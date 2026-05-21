import { describe, it, expect } from '@jest/globals';
import BillPayment from '../models/BillPayment.js';
import BankAccount from '../models/BankAccount.js';
import Payee from '../models/Payee.js';
import { runBillPayScheduler } from '../services/schedulerService.js';
import { createUserWithAccount } from './helpers/fixtures.js';

async function makePayee(userId) {
  return Payee.create({ user: userId, name: 'Power Co', category: 'utility' });
}

const pastDate  = () => new Date(Date.now() - 60_000);   // 1 min ago
const futureDate = () => new Date(Date.now() + 86_400_000); // tomorrow

describe('runBillPayScheduler', () => {
  it('processes a due pending payment', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await makePayee(user._id);

    const payment = await BillPayment.create({
      user:         user._id,
      fromAccount:  account._id,
      payee:        payee._id,
      amount:       100,
      scheduledDate: pastDate(),
      status:       'pending',
    });

    await runBillPayScheduler();

    const updated = await BillPayment.findById(payment._id);
    expect(updated.status).toBe('completed');

    // Balance should have decreased
    const updatedAcct = await BankAccount.findById(account._id);
    expect(updatedAcct.balance).toBeCloseTo(5000 - 100, 2);
  });

  it('does not process a future-dated payment', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await makePayee(user._id);

    const payment = await BillPayment.create({
      user:         user._id,
      fromAccount:  account._id,
      payee:        payee._id,
      amount:       50,
      scheduledDate: futureDate(),
      status:       'pending',
    });

    await runBillPayScheduler();

    const unchanged = await BillPayment.findById(payment._id);
    expect(unchanged.status).toBe('pending');
  });

  it('is idempotent — running twice does not double-charge', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await makePayee(user._id);

    await BillPayment.create({
      user:         user._id,
      fromAccount:  account._id,
      payee:        payee._id,
      amount:       200,
      scheduledDate: pastDate(),
      status:       'pending',
    });

    // Run scheduler twice concurrently — only one should claim via findOneAndUpdate
    await Promise.all([runBillPayScheduler(), runBillPayScheduler()]);

    const finalAcct = await BankAccount.findById(account._id);
    expect(finalAcct.balance).toBeCloseTo(5000 - 200, 2);
  });

  it('marks payment failed and does not deduct when account has insufficient funds', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10, availableBalance: 10 });
    const payee = await makePayee(user._id);

    const payment = await BillPayment.create({
      user:         user._id,
      fromAccount:  account._id,
      payee:        payee._id,
      amount:       500,
      scheduledDate: pastDate(),
      status:       'pending',
    });

    await runBillPayScheduler();

    const updated = await BillPayment.findById(payment._id);
    expect(updated.status).toBe('failed');
    expect(updated.failureReason).toBeTruthy();

    // Balance should be unchanged
    const updatedAcct = await BankAccount.findById(account._id);
    expect(updatedAcct.balance).toBeCloseTo(10, 2);
  });

  it('spawns a next recurring payment after completing a monthly one', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await makePayee(user._id);

    const payment = await BillPayment.create({
      user:          user._id,
      fromAccount:   account._id,
      payee:         payee._id,
      amount:        75,
      scheduledDate: pastDate(),
      status:        'pending',
      isRecurring:   true,
      recurringRule: 'monthly',
    });

    await runBillPayScheduler();

    const parent = await BillPayment.findById(payment._id);
    expect(parent.status).toBe('completed');
    expect(parent.nextPaymentId).toBeTruthy();

    const next = await BillPayment.findById(parent.nextPaymentId);
    expect(next).not.toBeNull();
    expect(next.status).toBe('pending');
    expect(next.recurringRule).toBe('monthly');
    expect(next.amount).toBe(75);
  });
});
