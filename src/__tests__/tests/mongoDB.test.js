require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

describe('MongoDB Connection', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the .env file.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }, 10000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 10000);

  test('should connect to MongoDB successfully', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 means connected
  }, 15000);

  test('should have a defined MONGODB_URI in .env', () => {
    expect(process.env.MONGODB_URI).toBeDefined();
    expect(process.env.MONGODB_URI).not.toBeNull();
    expect(process.env.MONGODB_URI).not.toBe('');
  }, 5000);
});
