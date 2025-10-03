#!/usr/bin/env node
import { existsSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const directoriesToRemove = [
  '.next',
  '.turbo',
  '.vercel',
  '.netlify',
  '.artifacts',
  '.history',
  '.cache',
  '.temp',
  '.qoder',
  '.qodo',
  'tmp',
  'temp',
  'logs',
  'reports',
  'coverage',
  'storybook-static',
  'docs-build'
];

const nestedDirectoriesToRemove = [
  ['node_modules', '.cache']
];

const filesToRemove = [
  'tmp_graphql_resp.json',
  'tmp_graphql_resp2.json',
  'tmp_check_burn_info.mjs'
];

const prefixesToPurge = ['tmp_', 'temp_'];

const removed = [];

function safeRemove(targetPath) {
  if (!existsSync(targetPath)) return;
  rmSync(targetPath, { recursive: true, force: true });
  removed.push(targetPath.replace(`${projectRoot}${pathSeparator()}`, ''));
}

function pathSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}

directoriesToRemove.forEach((relativePath) => {
  safeRemove(join(projectRoot, relativePath));
});

nestedDirectoriesToRemove.forEach((segments) => {
  safeRemove(join(projectRoot, ...segments));
});

filesToRemove.forEach((relativePath) => {
  safeRemove(join(projectRoot, relativePath));
});

try {
  const entries = readdirSync(projectRoot);
  entries
    .filter((entry) => prefixesToPurge.some((prefix) => entry.startsWith(prefix)))
    .forEach((entry) => {
      safeRemove(join(projectRoot, entry));
    });
} catch (error) {
  console.warn('Unable to scan project root for temporary prefixes:', error);
}

if (removed.length > 0) {
  console.log(`🧹 Cleaned deploy workspace (removed ${removed.length} item(s)):`);
  removed.forEach((item) => console.log(`  • ${item}`));
} else {
  console.log('🧹 Deploy workspace already clean.');
}
