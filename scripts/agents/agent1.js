const path = require('path');
const { banner, runTask, hasEslintConfig } = require('./utils');

const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'packages', 'backend');

function main() {
  banner('Agent 1 - Backend Automation');

  try {
    if (hasEslintConfig(BACKEND_DIR)) {
      runTask('Backend Lint', 'npm', ['run', 'lint', '--workspace=@skype-clone/backend']);
    } else {
      console.log('Skipping Backend Lint (no ESLint configuration found).');
    }
    runTask('Backend Tests', 'npm', ['run', 'test', '--workspace=@skype-clone/backend', '--', '--passWithNoTests']);
    runTask('Backend Build', 'npm', ['run', 'build', '--workspace=@skype-clone/backend']);

    console.log('\n✅ Agent 1 completed all backend tasks successfully.');
  } catch (error) {
    console.error(`\n❌ Agent 1 encountered an error: ${error.message}`);
    process.exit(1);
  }
}

main();
