import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import WireRecipient from '../models/WireRecipient.js';
import WireTransfer from '../models/WireTransfer.js';
import BankAccount from '../models/BankAccount.js';
import { createApp } from '../app.js';
import { createUserWithAccount, createAdmin } from './helpers/fixtures.js';
import { tokenFor } from './helpers/auth.js';

const app = createApp();

async function createRecipient(userId) {
  return WireRecipient.create({
    user:          userId,
    firstName:     'Jane',
    lastName:      'Doe',
    routingNumber: '021000021',
    accountNumberMasked: '••••5678',
  });
}

describe('POST /api/wire-transfers', () => {
  it('submits a wire and returns a result (clean, pending-review, or blocked)', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const recipient = await createRecipient(user._id);

    const res = await request(app)
      .post('/api/wire-transfers')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(account._id), recipientId: String(recipient._id), amount: 500 });

    expect([200, 202, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(500);
    }
  });

  it('rejects insufficient funds (amount + $30 fee)', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 50, availableBalance: 50 });
    const recipient = await createRecipient(user._id);

    const res = await request(app)
      .post('/api/wire-transfers')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(account._id), recipientId: String(recipient._id), amount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient funds/i);
  });

  it('rejects amount below $1', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const recipient = await createRecipient(user._id);

    const res = await request(app)
      .post('/api/wire-transfers')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(account._id), recipientId: String(recipient._id), amount: 0.5 });

    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const { user } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/wire-transfers')
      .set('Authorization', tokenFor(user))
      .send({ amount: 100 });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/wire-transfers')
      .send({ fromAccountId: 'x', recipientId: 'y', amount: 100 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/wire-transfers', () => {
  it('returns the user\'s wire transfers', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const recipient = await createRecipient(user._id);

    await WireTransfer.create({
      user:        user._id,
      fromAccount: account._id,
      recipient:   recipient._id,
      amount:      200,
      fee:         30,
      status:      'pending-review',
      submittedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/wire-transfers')
      .set('Authorization', tokenFor(user));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('Admin wire transfer operations', () => {
  it('admin can approve a pending-review wire', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const admin     = await createAdmin();
    const recipient = await createRecipient(user._id);

    const wire = await WireTransfer.create({
      user:        user._id,
      fromAccount: account._id,
      recipient:   recipient._id,
      amount:      300,
      fee:         30,
      status:      'pending-review',
      submittedAt: new Date(),
    });

    const res = await request(app)
      .post(`/api/admin/wire-transfers/${wire._id}/approve`)
      .set('Authorization', tokenFor(admin))
      .send({ notes: 'Verified by compliance' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processing');
  });

  it('admin can reject a pending-review wire', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const admin     = await createAdmin();
    const recipient = await createRecipient(user._id);

    const wire = await WireTransfer.create({
      user:        user._id,
      fromAccount: account._id,
      recipient:   recipient._id,
      amount:      300,
      fee:         30,
      status:      'pending-review',
      submittedAt: new Date(),
    });

    const res = await request(app)
      .post(`/api/admin/wire-transfers/${wire._id}/reject`)
      .set('Authorization', tokenFor(admin))
      .send({ reason: 'Suspicious activity' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  it('non-admin cannot approve a wire', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const recipient = await createRecipient(user._id);

    const wire = await WireTransfer.create({
      user:        user._id,
      fromAccount: account._id,
      recipient:   recipient._id,
      amount:      300,
      fee:         30,
      status:      'pending-review',
      submittedAt: new Date(),
    });

    const res = await request(app)
      .post(`/api/admin/wire-transfers/${wire._id}/approve`)
      .set('Authorization', tokenFor(user))
      .send({});

    expect(res.status).toBe(403);
  });
});
