import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET  = 'test-jwt-secret-do-not-use-in-prod';
  process.env.JWT_EXPIRE  = '1h';
  process.env.NODE_ENV    = 'test';

  // Store instance reference for teardown
  global.__MONGOD__ = mongod;
}
