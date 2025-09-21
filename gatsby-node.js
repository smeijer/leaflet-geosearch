/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs');

const statics = ['CNAME'];

function findRepoRoot(dir = process.cwd()) {
  const gitDir = path.join(dir, '.git');

  if (fs.existsSync(gitDir)) {
    return dir;
  }

  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    return null;
  }

  return findRepoRoot(parentDir);
}

const root = findRepoRoot();
const dist = path.join(root, '.docz/dist');

exports.onPostBuild = ({ reporter }) => {
  fs.mkdirSync(dist, { recursive: true });

  for (const file of statics) {
    const src = path.resolve(root, file);
    const dest = path.resolve(dist, file);

    if (!fs.existsSync(src)) {
      reporter.info(`File ${file} not found`);
      continue;
    }

    fs.copyFileSync(src, dest);
    reporter.info(`Copied ${src} → ${dest}`);
  }
};

exports.onCreateWebpackConfig = ({ actions, stage, loaders }) => {
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: [/node_modules\/leaflet/, /node_modules\\leaflet/],
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, '../docs'), 'node_modules'],
      alias: {
        'leaflet-geosearch': path.resolve(__dirname, '../dist/geosearch.js'),
      },
    },
  });
};
