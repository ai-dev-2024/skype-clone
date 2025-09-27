const path = require('path');
const { banner, runTask, hasEslintConfig } = require('./utils');

const WEB_DIR = path.resolve(__dirname, '..', '..', 'packages', 'web');

function main() {
  banner('Agent 2 - Web Frontend Automation');

  try {
    if (hasEslintConfig(WEB_DIR)) {
      runTask('Web Lint', 'npm', ['run', 'lint', '--workspace=@skype-clone/web']);
    } else {
      console.log('Skipping Web Lint (no ESLint configuration found).');
    }
    runTask('Web Build', 'npm', ['run', 'build', '--workspace=@skype-clone/web']);

    console.log('\n✅ Agent 2 completed all web tasks successfully.');
  } catch (error) {
    console.error(`\n❌ Agent 2 encountered an error: ${error.message}`);
    process.exit(1);
  }
}

main();
