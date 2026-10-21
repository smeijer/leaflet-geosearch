import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  {
    ignores: [
      'dist/',
      'lib/',
      'coverage/',
      '.docz/',
      '.tmp/',
      'website/',
      // the docz site, replaced in #450
      'docs/',
      'src/gatsby-theme-docz/',
    ],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
  },
  tseslint.configs.recommended,
  prettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // a warning, like in typescript-eslint 5
      '@typescript-eslint/no-unused-vars': 'warn',
      curly: ['error', 'all'],
    },
  },
);
