import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';
import { createUser } from './helpers/fixtures.js';
import { tokenFor } from './helpers/auth.js';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Alice',
        lastName:  'Smith',
        email:     'alice@test.com',
        password:  'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.role).toBe('user');
  });

  it('rejects duplicate email', async () => {
    await createUser({ email: 'dup@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Bob',
        lastName:  'Jones',
        email:     'dup@test.com',
        password:  'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'no@fields.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    await createUser({ email: 'login@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await createUser({ email: 'wrongpw@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@test.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'only@email.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const user = await createUser({ email: 'me@test.com' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', tokenFor(user));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.com');
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally.invalid.token');
    expect(res.status).toBe(401);
  });
});
