const { banner, runTask } = require('./utils');

function main() {
  banner('Agent 3 - DevOps Automation');

  try {
    runTask('Shared Build', 'npm', ['run', 'build', '--workspace=@skype-clone/shared']);
    runTask('Mobile Placeholder Build', 'npm', ['run', 'build', '--workspace=@skype-clone/mobile']);
    runTask('Desktop Placeholder Build', 'npm', ['run', 'build', '--workspace=@skype-clone/desktop']);
    runTask('All Workspaces Build', 'npm', ['run', 'build']);

    console.log('\n✅ Agent 3 completed all DevOps tasks successfully.');
  } catch (error) {
    console.error(`\n❌ Agent 3 encountered an error: ${error.message}`);
    process.exit(1);
  }
}

main();
