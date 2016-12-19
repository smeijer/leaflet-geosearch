#! /usr/bin/env node
const npm = require('npm'); // eslint-disable-line import/no-extraneous-dependencies

const run = (script, ...scripts) => {
  if (!script) {
    return;
  }

  npm.commands['run-script']([script], (error) => {
    if (error) {
      process.exit(1);
    }

    run(...scripts);
  });
};

/* eslint-disable no-shadow */
npm.load((error) => {
  if (error) {
    throw error;
  }

  run('test', 'lint');
});
