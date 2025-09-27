const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const ESLINT_CONFIG_FILES = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs'
];

function banner(title) {
  const line = '='.repeat(title.length + 8);
  console.log(`\n${line}\n=== ${title} ===\n${line}`);
}

function runTask(label, command, args = []) {
  const joinedArgs = args.join(' ');
  console.log(`\n[${label}] $ ${command}${joinedArgs ? ` ${joinedArgs}` : ''}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function hasEslintConfig(workspacePath) {
  return ESLINT_CONFIG_FILES.some((file) => existsSync(path.join(workspacePath, file)));
}

module.exports = {
  banner,
  runTask,
  hasEslintConfig
};
