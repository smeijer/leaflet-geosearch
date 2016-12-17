/* eslint-disable no-unused-vars, global-require, import/no-extraneous-dependencies */
const fs = require('fs');

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'production';

module.exports = wallaby => ({
  files: [
    'src/**/*.js',
    'test/**/*.js',
    '!src/**/__tests__/**/*.spec.js',
  ],
  tests: [
    'src/**/__tests__/**/*.spec.js',
  ],
  compilers: {
    '**/*.js': wallaby.compilers.babel(),
  },
  env: {
    type: 'node',
    params: {
      env: [
        'NODE_ENV=production',
      ].join(';'),
    },
  },
  debug: false,
  testFramework: 'ava',
  setup: () => {
    require('dotenv').config({
      path: `${wallaby.localProjectDir}/.env`,
    });

    require('./test/browserEnv');
  },
});
