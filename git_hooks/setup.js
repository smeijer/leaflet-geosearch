const fs = require('fs');
const path = require('path');

const hooks = [
  'applypatch-msg',
  'commit-msg',
  'post-commit',
  'post-receive',
  'post-update',
  'pre-applypatch',
  'pre-commit',
  'prepare-commit-msg',
  'pre-rebase',
  'update',
];

hooks.forEach((hook) => {
  const hookInSourceControl = path.resolve(__dirname, `${hook}.js`);

  if (fs.existsSync(hookInSourceControl)) {
    const hookInHiddenDirectory = path.resolve(__dirname, '../.git/hooks/', hook);

    if (fs.existsSync(hookInHiddenDirectory)) {
      fs.unlinkSync(hookInHiddenDirectory);
    }

    fs.linkSync(hookInSourceControl, hookInHiddenDirectory);
  }
});
