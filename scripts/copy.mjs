// Cross-platform `mkdir -p $(dirname dest) && cp src dest` for npm scripts.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [src, dest] = process.argv.slice(2);

if (!src || !dest) {
  console.error('usage: node scripts/copy.mjs <src> <dest>');
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
