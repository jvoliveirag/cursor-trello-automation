#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

const command = process.argv[2];

function printUsage() {
  console.log(`
cursor-trello-agent — Bridge Trello webhooks to Cursor AI agent

Usage:
  cursor-trello-agent init    Scaffold config files into the current project
  cursor-trello-agent start   Start the webhook server with tunnel
  cursor-trello-agent help    Show this message

Environment variables (set in .env or shell):
  NGROK_AUTHTOKEN   Required — ngrok auth token (https://dashboard.ngrok.com)
  TRELLO_PORT       Optional — server port (default: 3080)
  TARGET_LABEL      Optional — Trello label to watch (default: critical)
`);
}

switch (command) {
  case 'init':
    require('../src/init')();
    break;
  case 'start':
    require('../src/server');
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
