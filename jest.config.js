module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // uncomment if needing to test bing provider with jest
    // resources: 'usable',
    // runScripts: 'dangerously',
  },
  testMatch: ['**/*.spec.js'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  automock: false,
  setupFiles: ['./jest.setup.js'],
};
