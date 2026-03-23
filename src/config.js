'use strict';

const path = require('path');
const fs = require('fs');

function loadEnv() {
  const candidates = ['.env.local', '.env'];
  for (const name of candidates) {
    const full = path.join(process.cwd(), name);
    if (fs.existsSync(full)) {
      require('dotenv').config({ path: full });
      return;
    }
  }
  require('dotenv').config();
}

loadEnv();

module.exports = {
  port: Number(process.env.TRELLO_PORT) || 3080,
  targetLabel: (process.env.TARGET_LABEL || 'critical').toLowerCase(),
  taskFile: path.join(process.cwd(), 'TRELLO_TASKS.md'),
  triggerEvent: 'addLabelToCard',
};
