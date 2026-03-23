'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

function copyTemplate(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(dest)) {
    console.log(`  skip  ${path.relative(process.cwd(), dest)} (already exists)`);
    return false;
  }
  fs.copyFileSync(src, dest);
  console.log(`  create  ${path.relative(process.cwd(), dest)}`);
  return true;
}

module.exports = function init() {
  const cwd = process.cwd();
  console.log('');
  console.log('Initializing cursor-trello-agent...');
  console.log('');

  copyTemplate(
    path.join(TEMPLATES_DIR, 'trello-tasks.mdc'),
    path.join(cwd, '.cursor', 'rules', 'trello-tasks.mdc'),
  );

  copyTemplate(
    path.join(TEMPLATES_DIR, 'env.example'),
    path.join(cwd, '.env.cursor-trello-agent'),
  );

  const taskFile = path.join(cwd, 'TRELLO_TASKS.md');
  if (!fs.existsSync(taskFile)) {
    fs.writeFileSync(
      taskFile,
      '# Trello Task Queue\n\nTasks are added automatically by cursor-trello-agent.\n\n---\n',
    );
    console.log(`  create  TRELLO_TASKS.md`);
  } else {
    console.log(`  skip  TRELLO_TASKS.md (already exists)`);
  }

  console.log('');
  console.log('Next steps:');
  console.log('  1. Set NGROK_AUTHTOKEN in .env.local (or .env.cursor-trello-agent)');
  console.log('  2. Register a Trello webhook pointing to your tunnel URL');
  console.log('  3. Run: cursor-trello-agent start');
  console.log('');
};
