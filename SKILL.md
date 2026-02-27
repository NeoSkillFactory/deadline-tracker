---
name: deadline-tracker
description: Automatically tracks and reports task progress to ensure OpenClaw meets deadlines and maintains accountability.
version: 1.0.0
triggers:
  - "Track my task progress"
  - "Show me deadline status"
  - "Report on task completion"
  - "Monitor my project deadlines"
  - "Check if we're on schedule"
---

# Deadline Tracker Skill

## Overview

The Deadline Tracker skill monitors task deadlines and progress, generates accountability reports, and alerts users when deadlines are at risk. It integrates with OpenClaw agent workflows and provides a clean CLI interface.

## Architecture

```
skill/
├── scripts/
│   ├── tracker.js          # Core tracking module
│   ├── reporter.js         # Report generation module
│   └── cli.js              # Command-line interface
├── references/
│   ├── README.md           # Setup and usage guide
│   └── examples/
│       ├── success.md      # Successful usage scenario
│       └── deadline-risks.md # Alert scenario demonstration
├── SKILL.md                # This file
└── package.json            # Dependencies and metadata
```

## Component Roles

- **tracker.js** — Core engine that calculates progress percentages, determines risk levels (high/medium/low), and manages task state.
- **reporter.js** — Generates formatted progress reports in markdown, plain text, and JSON formats with color-coded risk levels.
- **cli.js** — Command-line interface that parses arguments and routes requests to tracker/reporter.

## Data Flow

```
User CLI command
  → cli.js parses request
  → calls tracker.js with task data
  → tracker.js validates and calculates status
  → reporter.js generates output format
  → results returned to CLI or OpenClaw session
```

## Usage

### CLI Commands

```bash
# Show status of all tracked tasks
node scripts/cli.js status

# Show status from a tasks file
node scripts/cli.js status --file tasks.json

# Generate a full progress report
node scripts/cli.js report

# Generate report in JSON format
node scripts/cli.js report --format json

# Add a new task
node scripts/cli.js add --name "Feature X" --deadline "2026-03-15"

# Mark a task as complete
node scripts/cli.js complete --name "Feature X"
```

### Integration with OpenClaw Agents

Agents can invoke the tracker programmatically:

```javascript
const { Tracker } = require('./scripts/tracker');
const { Reporter } = require('./scripts/reporter');

const tracker = new Tracker();
tracker.addTask({ name: 'Deploy v2', deadline: '2026-03-01', progress: 75 });
const status = tracker.getStatus();
const report = Reporter.generateText(status);
```

## Error Codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Invalid arguments |
| 2    | File not found |
| 3    | Invalid task data |
| 4    | Internal error |

## Best Practices

- Store task data in a `tasks.json` file for persistence across runs.
- Use `--format json` for programmatic consumption of reports.
- Schedule periodic status checks via cron or agent loops.
- Review risk alerts promptly — tasks flagged "high" need immediate attention.
