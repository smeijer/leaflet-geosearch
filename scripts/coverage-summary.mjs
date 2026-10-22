// Prints the coverage totals and the least covered files as a markdown
// table. In GitHub Actions the table also goes to the job summary.
// Run after `vitest run --coverage --coverage.reporter=json-summary`.
import fs from 'node:fs';
import path from 'node:path';

const summary = JSON.parse(
  fs.readFileSync('coverage/coverage-summary.json', 'utf8'),
);
const pct = (entry, key) => `${entry[key].pct.toFixed(1)}%`;
const keys = ['lines', 'branches', 'functions', 'statements'];

const rows = Object.entries(summary)
  .filter(([file]) => file !== 'total')
  .map(([file, entry]) => [path.relative(process.cwd(), file), entry])
  .sort((a, b) => a[1].lines.pct - b[1].lines.pct)
  .slice(0, 5);

const lines = [
  '### Coverage',
  '',
  '| | Lines | Branches | Functions | Statements |',
  '| --- | --- | --- | --- | --- |',
  `| **total** | ${keys.map((key) => pct(summary.total, key)).join(' | ')} |`,
  ...rows.map(
    ([file, entry]) =>
      `| ${file.split(path.sep).join('/')} | ${keys.map((key) => pct(entry, key)).join(' | ')} |`,
  ),
  '',
  'Least covered files first.',
  '',
];

const markdown = lines.join('\n');
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
}
