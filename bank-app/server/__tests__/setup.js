import mongoose from 'mongoose';

// Connect once before all tests in this file
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }
});

// Wipe all collections between tests for isolation
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests in this file
afterAll(async () => {
  await mongoose.disconnect();
});
