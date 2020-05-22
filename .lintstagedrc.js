module.exports = {
  '**/*.ts': (files) => [
    `tsc --noEmit`,
    `eslint --quiet --fix ${files.join(' ')}`,
  ],
  '**/*.{json}': (files) => [`prettier --write ${files.join(' ')}`],
  '**/*.{md,mdx}': (files) => [`prettier --write ${files.join(' ')}`],
};
