/** @type {import('jest').Config} */
export default {
  testEnvironment:    'node',
  transform:          {},
  globalSetup:        './__tests__/global.setup.js',
  globalTeardown:     './__tests__/global.teardown.js',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch:          ['**/__tests__/**/*.test.js'],
  testTimeout:        30000,
  forceExit:          true,
  detectOpenHandles:  true,
};
