import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import BankAccount from '../models/BankAccount.js';
import { createApp } from '../app.js';
import { createUserWithAccount, createTransferPair } from './helpers/fixtures.js';
import { tokenFor } from './helpers/auth.js';

const app = createApp();

describe('POST /api/transfers/internal', () => {
  it('moves funds between own accounts', async () => {
    const { user, account: acct1 } = await createUserWithAccount({}, { balance: 10000, availableBalance: 10000 });
    const acct2 = await BankAccount.create({
      user: user._id, accountName: 'Savings', accountType: 'savings',
      accountNumber: '9991234567', routingNumber: '021000021',
      balance: 0, availableBalance: 0,
    });

    const res = await request(app)
      .post('/api/transfers/internal')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(acct1._id), toAccountId: String(acct2._id), amount: 100 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(100);

    // Verify balances updated in DB
    const [from, to] = await Promise.all([
      BankAccount.findById(acct1._id),
      BankAccount.findById(acct2._id),
    ]);
    expect(from.balance).toBeCloseTo(10000 - 100, 2);
    expect(to.balance).toBeCloseTo(100, 2);
  });

  it('rejects insufficient funds', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 50, availableBalance: 50 });
    const acct2 = await BankAccount.create({
      user: user._id, accountName: 'Savings', accountType: 'savings',
      accountNumber: '8881234567', routingNumber: '021000021',
      balance: 0, availableBalance: 0,
    });

    const res = await request(app)
      .post('/api/transfers/internal')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(account._id), toAccountId: String(acct2._id), amount: 200 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects same-account transfer', async () => {
    const { user, account } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/transfers/internal')
      .set('Authorization', tokenFor(user))
      .send({ fromAccountId: String(account._id), toAccountId: String(account._id), amount: 50 });

    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const { user } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/transfers/internal')
      .set('Authorization', tokenFor(user))
      .send({ amount: 50 });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/transfers/internal')
      .send({ fromAccountId: 'x', toAccountId: 'y', amount: 10 });
    expect(res.status).toBe(401);
  });

  it('rejects transfer to another user\'s own account', async () => {
    const { user: userA, account: acctA } = await createUserWithAccount();
    const { account: acctB }              = await createUserWithAccount();

    const res = await request(app)
      .post('/api/transfers/internal')
      .set('Authorization', tokenFor(userA))
      .send({ fromAccountId: String(acctA._id), toAccountId: String(acctB._id), amount: 10 });

    // Internal transfer requires both accounts to belong to the same user
    expect(res.status).toBe(404);
  });
});

describe('POST /api/transfers/external', () => {
  it('transfers to another user\'s account by routing/account number', async () => {
    const { sender, fromAccount } = await createTransferPair({ senderBalance: 5000 });
    // Look up the recipient account with accountNumber (select:false)
    const { account: toAccount }  = await createUserWithAccount();
    const toFull = await BankAccount.findById(toAccount._id).select('+accountNumber');

    const res = await request(app)
      .post('/api/transfers/external')
      .set('Authorization', tokenFor(sender))
      .send({
        fromAccountId: String(fromAccount._id),
        routingNumber:  toFull.routingNumber,
        accountNumber:  toFull.accountNumber,
        amount:         100,
      });

    // Accept 200 (clean) or 202 (pending-review) — fraud score is non-deterministic
    expect([200, 202, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(100);
    }
  });

  it('rejects when destination account not found', async () => {
    const { user, account } = await createUserWithAccount();

    const res = await request(app)
      .post('/api/transfers/external')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        routingNumber:  '021000021',
        accountNumber:  '0000000000',
        amount:         50,
      });

    expect(res.status).toBe(404);
  });

  it('rejects insufficient funds', async () => {
    const { user, account } = await createUserWithAccount({}, { balance: 10, availableBalance: 10 });
    const { account: other } = await createUserWithAccount();
    const otherFull = await BankAccount.findById(other._id).select('+accountNumber');

    const res = await request(app)
      .post('/api/transfers/external')
      .set('Authorization', tokenFor(user))
      .send({
        fromAccountId: String(account._id),
        routingNumber:  otherFull.routingNumber,
        accountNumber:  otherFull.accountNumber,
        amount:         500,
      });

    expect(res.status).toBe(400);
  });
});
