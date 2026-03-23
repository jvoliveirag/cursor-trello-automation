'use strict';

const fastify = require('fastify')({ logger: true });
const fs = require('fs');
const config = require('./config');
const { triggerCursorAgent } = require('./trigger');

fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_req, body, done) => {
    if (!body || body.length === 0) return done(null, {});
    try {
      done(null, JSON.parse(body));
    } catch {
      done(null, {});
    }
  },
);

fastify.route({
  method: ['GET', 'HEAD'],
  url: '/',
  handler: async (_request, reply) => reply.status(200).send(),
});

function shouldTrigger(action) {
  if (!action || action.type !== config.triggerEvent) return false;
  const labelName = action.data?.label?.name?.toLowerCase() || '';
  return labelName.includes(config.targetLabel);
}

function buildTaskEntry(action) {
  const card = action.data.card || {};
  const label = action.data.label || { name: config.targetLabel };
  const now = new Date().toISOString();

  return [
    '## PENDING',
    `- **cardId**: ${card.id || 'unknown'}`,
    `- **cardName**: ${card.name || 'Unknown'}`,
    `- **cardDesc**: ${card.desc || ''}`,
    `- **boardId**: ${card.boardId || 'unknown'}`,
    `- **boardName**: ${card.boardName || 'unknown'}`,
    `- **label**: ${label.name}`,
    `- **event**: ${action.type}`,
    `- **triggered**: ${now}`,
    '',
    '---',
    '',
  ].join('\n');
}

function ensureTaskFile() {
  if (!fs.existsSync(config.taskFile)) {
    fs.writeFileSync(
      config.taskFile,
      '# Trello Task Queue\n\nTasks are added automatically by cursor-trello-agent.\n\n---\n',
    );
  }
}

fastify.post('/', async (request, reply) => {
  const body = request.body || {};
  const { action } = body;

  if (action) {
    console.log(`[trello] ${action.type} card="${action.data?.card?.name || 'N/A'}"`);
  }

  if (shouldTrigger(action)) {
    ensureTaskFile();
    const entry = buildTaskEntry(action);

    let existing = '';
    try {
      existing = fs.readFileSync(config.taskFile, 'utf-8');
    } catch {}

    const cardId = action.data.card?.id;
    const isDuplicate = cardId
      ? existing.includes(`cardId**: ${cardId}`)
      : existing.includes(`cardName**: ${action.data.card.name}`);

    if (isDuplicate) {
      console.log(`[trello] Card "${action.data.card.name}" already queued — skipping`);
    } else {
      fs.appendFileSync(config.taskFile, entry);
      console.log(`[trello] Card "${action.data.card.name}" added to task queue`);
      triggerCursorAgent(action.data.card.name);
    }
  }

  return reply.status(200).send({ received: true });
});

async function start() {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    console.log('');
    console.log('cursor-trello-agent running');
    console.log(`  Local:   http://localhost:${config.port}`);
    console.log(`  Label:   "${config.targetLabel}"`);
    console.log(`  Event:   ${config.triggerEvent}`);
    console.log(`  Output:  ${config.taskFile}`);

    try {
      const ngrok = require('@ngrok/ngrok');
      const listener = await ngrok.forward({
        addr: config.port,
        authtoken_from_env: true,
      });
      console.log(`  Tunnel:  ${listener.url()}`);
      console.log('');
      console.log('Use the tunnel URL as the Trello webhook callbackURL');
    } catch (err) {
      console.log('');
      console.log(`  Tunnel:  not available (${err.message})`);
      console.log('  Expose port manually with ngrok, cloudflared, or similar');
    }

    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
