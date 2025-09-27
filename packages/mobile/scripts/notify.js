#!/usr/bin/env node

const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '') ?? '';
  const value = args[i + 1] ?? '';
  if (key) {
    params[key] = value;
  }
}

const app = params.app || 'mobile';
const mode = params.mode || 'unknown';

const messages = {
  dev: `The ${app} workspace is currently a placeholder. Implement the React Native client and update this script when ready.`,
  build: `Skipping ${app} build. Add build tooling when the React Native client is implemented.`,
  clean: `Nothing to clean for ${app} yet.`
};

const message = messages[mode] || `No action defined for mode "${mode}" in ${app} workspace.`;

console.log(message);
