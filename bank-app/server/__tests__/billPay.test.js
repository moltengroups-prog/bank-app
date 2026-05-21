import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import BillPayment from '../models/BillPayment.js';
import Payee from '../models/Payee.js';
import { createApp } from '../app.js';
import { createUserWithAccount, createAdmin } from './helpers/fixtures.js';
import { tokenFor } from './helpers/auth.js';

const app = createApp();

async function createPayee(userId) {
  return Payee.create({ user: userId, name: 'Electric Co', category: 'utility' });
}

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

describe('POST /api/bill-pay/payees', () => {
  it('creates a payee', async () => {
    const { user } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/bill-pay/payees')
      .set('Authorization', tokenFor(user))
      .send({ name: 'Gas Company', category: 'utility' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Gas Company');
  });

  it('rejects missing name', async () => {
    const { user } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/bill-pay/payees')
      .set('Authorization', tokenFor(user))
      .send({ category: 'utility' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/bill-pay/payees', () => {
  it('returns only the user\'s payees', async () => {
    const { user: u1 } = await createUserWithAccount();
    const { user: u2 } = await createUserWithAccount();
    await createPayee(u1._id);
    await createPayee(u1._id);
    await createPayee(u2._id);

    const res = await request(app)
      .get('/api/bill-pay/payees')
      .set('Authorization', tokenFor(u1));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('POST /api/bill-pay/payments — schedule future', () => {
  it('schedules a future payment', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await createPayee(user._id);

    const res = await request(app)
      .post('/api/bill-pay/payments')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        payeeId:       String(payee._id),
        amount:        150,
        scheduledDate: tomorrow(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.amount).toBe(150);
  });

  it('rejects if amount < 0.01', async () => {
    const { user, account } = await createUserWithAccount();
    const payee = await createPayee(user._id);

    const res = await request(app)
      .post('/api/bill-pay/payments')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        payeeId:       String(payee._id),
        amount:        0,
        scheduledDate: tomorrow(),
      });

    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const { user } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/bill-pay/payments')
      .set('Authorization', tokenFor(user))
      .send({ amount: 50 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/bill-pay/payments/:id/cancel', () => {
  it('cancels a pending payment', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await createPayee(user._id);

    // Schedule first
    const schedRes = await request(app)
      .post('/api/bill-pay/payments')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        payeeId:       String(payee._id),
        amount:        75,
        scheduledDate: tomorrow(),
      });

    const pmtId = schedRes.body.data._id;

    const cancelRes = await request(app)
      .post(`/api/bill-pay/payments/${pmtId}/cancel`)
      .set('Authorization', tokenFor(user))
      .send({});

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');
  });

  it('cannot cancel a non-pending payment', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await createPayee(user._id);

    const payment = await BillPayment.create({
      user:         user._id,
      fromAccount:  account._id,
      payee:        payee._id,
      amount:       50,
      scheduledDate: tomorrow(),
      status:       'completed',
    });

    const res = await request(app)
      .post(`/api/bill-pay/payments/${payment._id}/cancel`)
      .set('Authorization', tokenFor(user))
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/bill-pay/payments/upcoming', () => {
  it('returns upcoming pending payments', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await createPayee(user._id);

    await BillPayment.create({
      user: user._id, fromAccount: account._id, payee: payee._id,
      amount: 100, scheduledDate: tomorrow(), status: 'pending',
    });

    const res = await request(app)
      .get('/api/bill-pay/payments/upcoming')
      .set('Authorization', tokenFor(user));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('Recurring payment chain', () => {
  it('schedules a recurring payment with correct rule', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 5000, availableBalance: 5000 });
    const payee = await createPayee(user._id);

    const res = await request(app)
      .post('/api/bill-pay/payments')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        payeeId:       String(payee._id),
        amount:        50,
        scheduledDate: tomorrow(),
        isRecurring:   true,
        recurringRule: 'monthly',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isRecurring).toBe(true);
    expect(res.body.data.recurringRule).toBe('monthly');
  });
});
