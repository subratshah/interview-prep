#!/usr/bin/env node
/**
 * Expands <!-- @include path/from/repo/root.html --> in the page template into
 * file contents (recursive). Writes index.html at the repository root.
 *
 * Usage:
 *   node scripts/compose-html.mjs        # write index.html
 *   node scripts/compose-html.mjs --check  # exit 1 if index.html is stale
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'index.template.html');
const outputPath = path.join(root, 'index.html');

const INCLUDE_RE = /<!--\s*@include\s+(\S+)\s*-->/g;

function readCompose(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return text.replace(INCLUDE_RE, (_, rel) => {
    const includedPath = path.normalize(path.join(root, rel));
    const relToRoot = path.relative(root, includedPath);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
      throw new Error(`Include escapes root: ${rel}`);
    }
    if (!fs.existsSync(includedPath)) {
      throw new Error(`Missing include: ${rel}`);
    }
    return readCompose(includedPath);
  });
}

const composed = readCompose(templatePath);
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const existing = fs.readFileSync(outputPath, 'utf8');
  if (existing !== composed) {
    console.error('index.html is out of date. Run: node scripts/compose-html.mjs');
    process.exit(1);
  }
  console.error('index.html matches template + components.');
  process.exit(0);
}

fs.writeFileSync(outputPath, composed, 'utf8');
console.error(`Wrote ${path.relative(root, outputPath)}`);
