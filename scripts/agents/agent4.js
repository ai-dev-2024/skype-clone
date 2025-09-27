const { banner, runTask } = require('./utils');

function main() {
  banner('Agent 4 - Testing Automation');

  try {
    runTask('Backend Tests (coverage)', 'npm', ['run', 'test', '--workspace=@skype-clone/backend', '--', '--coverage', '--passWithNoTests']);
    runTask('Web Build Verification', 'npm', ['run', 'build', '--workspace=@skype-clone/web']);

    console.log('\n✅ Agent 4 completed all testing tasks successfully.');
  } catch (error) {
    console.error(`\n❌ Agent 4 encountered an error: ${error.message}`);
    process.exit(1);
  }
}

main();
