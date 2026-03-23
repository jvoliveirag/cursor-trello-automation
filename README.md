# cursor-trello-agent

Bridge Trello webhooks to Cursor AI agent. When a card receives a specific label in Trello, this tool writes a structured task to your project and triggers Cursor to start an autonomous development workflow.

## How it works

```
Trello (label added to card)
  → Webhook POST → cursor-trello-agent (local server + ngrok tunnel)
  → Writes task to TRELLO_TASKS.md
  → Focuses Cursor window, opens Agent chat, sends "process trello tasks"
  → Cursor rule reads the task → Trello MCP fetches card details → Agent develops
```

## Install

```bash
# Global
npm install -g cursor-trello-agent

# Or per-project
npm install -D cursor-trello-agent

# Or run directly
npx cursor-trello-agent
```

## Setup

### 1. Initialize in your project

```bash
cursor-trello-agent init
```

This creates:
- `.cursor/rules/trello-tasks.mdc` — Cursor rule that auto-processes pending tasks
- `.env.cursor-trello-agent` — Example environment config
- `TRELLO_TASKS.md` — Task queue file

### 2. Configure environment

Set these in `.env.local`, `.env`, or your shell:

| Variable | Required | Default | Description |
|---|---|---|---|
| `NGROK_AUTHTOKEN` | Yes | — | Free token from [ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken) |
| `TRELLO_PORT` | No | `3080` | Local server port |
| `TARGET_LABEL` | No | `critical` | Trello label name that triggers the agent |

### 3. Register a Trello webhook

Start the server to get your public URL:

```bash
cursor-trello-agent start
```

Then register a webhook pointing to the displayed tunnel URL. You can do this via the Trello UI, Trello API or a Trello MCP tool.

### 4. Trigger

Add the configured label (default: `critical`) to any card in Trello. The agent handles the rest.

## Commands

| Command | Description |
|---|---|
| `cursor-trello-agent init` | Scaffold config files into the current project |
| `cursor-trello-agent start` | Start the webhook server with ngrok tunnel |
| `cursor-trello-agent help` | Show usage |

## Platform support

The Cursor trigger works on:
- **Windows** — PowerShell + SendKeys
- **macOS** — AppleScript + System Events
- **Linux** — xdotool / wmctrl

If the trigger can't find the Cursor window, the task is still written to `TRELLO_TASKS.md`. You can manually tell Cursor to "process trello tasks".

## Requirements

- Node.js >= 18
- [Cursor IDE](https://cursor.com) with Trello MCP configured
- A Trello board with webhook access
- ngrok account (free tier works)

## How the Cursor rule works

The `trello-tasks.mdc` rule is set to `alwaysApply: true`. Whenever you interact with Cursor, it checks `TRELLO_TASKS.md` for `## PENDING` blocks and immediately starts the development workflow:

1. Fetches full card details via Trello MCP
2. Assesses requirements from card description/checklists
3. Plans and implements changes
4. Validates (lint, type-check, build, tests)
5. Commits, pushes, and moves the card to "Ready"

## License

MIT
