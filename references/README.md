# Deadline Tracker - Usage Guide

## Installation

```bash
cd skill/
npm install
```

## Quick Start

### Using Demo Data

```bash
# View status with built-in demo tasks
node scripts/cli.js status --demo

# Generate a markdown report
node scripts/cli.js report --format markdown --demo

# Generate a JSON report
node scripts/cli.js report --format json --demo
```

### Using Your Own Tasks

Create a `tasks.json` file:

```json
{
  "tasks": [
    {
      "name": "Feature Implementation",
      "deadline": "2026-03-15",
      "progress": 45,
      "created": "2026-02-01T00:00:00Z",
      "completed": false
    }
  ]
}
```

Then run:

```bash
node scripts/cli.js status --file tasks.json
```

### Adding Tasks via CLI

```bash
node scripts/cli.js add --name "New Feature" --deadline 2026-04-01 --progress 0
```

### Completing Tasks

```bash
node scripts/cli.js complete --name "New Feature"
```

## Output Formats

- **text** (default) — Color-coded terminal output with progress bars
- **markdown** — Markdown-formatted report suitable for documentation
- **json** — Machine-readable JSON output for programmatic use

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `--file <path>` | Path to tasks JSON file | `tasks.json` |
| `--format <fmt>` | Output format (text/markdown/json) | `text` |
| `--demo` | Use built-in demo data | `false` |
| `--no-color` | Disable ANSI color output | `false` |

## Risk Levels

Tasks are assigned risk levels based on time-vs-progress analysis:

- **LOW** — On track, progress matches or exceeds time spent
- **MEDIUM** — Slightly behind schedule, needs monitoring
- **HIGH** — Significantly behind schedule, needs immediate attention
- **OVERDUE** — Past the deadline and not yet complete

## Programmatic Usage

```javascript
const { Tracker } = require('./scripts/tracker');
const { Reporter } = require('./scripts/reporter');

const tracker = new Tracker('tasks.json');
const status = tracker.getStatus();
console.log(Reporter.generateJSON(status));
```
