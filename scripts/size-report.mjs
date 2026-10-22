// Prints the raw and gzip size of the published bundles as a markdown table.
// In GitHub Actions the table also goes to the job summary.
// Run after `npm run build`.
import fs from 'node:fs';
import zlib from 'node:zlib';

const files = [
  'dist/geosearch.module.js',
  'dist/geosearch.js',
  'dist/geosearch.umd.js',
  'dist/providers.module.js',
  'dist/providers.js',
  'dist/geosearch.css',
];
const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

const lines = [
  '### Bundle size',
  '',
  '| File | Size | gzip |',
  '| --- | --- | --- |',
  ...files.map((file) => {
    const content = fs.readFileSync(file);
    return `| ${file} | ${kb(content.length)} | ${kb(zlib.gzipSync(content).length)} |`;
  }),
  '',
];

const markdown = lines.join('\n');
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
}
