// Jest setup file for VS Code extension testing

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set up global test utilities
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Set test timeout
jest.setTimeout(10000);
