import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Global test setup
let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Stop the in-memory MongoDB server
  await mongoServer.stop();
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-purposes-only-32-chars';
