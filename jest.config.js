/* eslint-disable @typescript-eslint/no-var-requires */
const tsConfig = require('./tsconfig.json');

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
  setupFilesAfterEnv: ['./jest.extend.js'],
  globals: {
    'ts-jest': {
      tsConfig: {
        ...tsConfig.compilerOptions,
        noEmit: false,
        outDir: '.tsCache',
      },
    },
  },
};
