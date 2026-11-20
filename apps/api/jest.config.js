module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
