// Jest setup file
// This file runs before all tests

// Increase timeout for integration tests
jest.setTimeout(15000);

// Full-world FIRMS CSV can be 100k+ rows; cap DB sync in tests unless overridden.
if (process.env.FIRMS_SYNC_MAX_RECORDS === undefined || process.env.FIRMS_SYNC_MAX_RECORDS === '') {
  process.env.FIRMS_SYNC_MAX_RECORDS = '800';
}

// Suppress console errors in tests (optional)
// Uncomment if you want to suppress console.error during tests
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
