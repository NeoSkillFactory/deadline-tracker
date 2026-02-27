# Example: Deadline Risk Alerts

## Scenario

A project has tasks in various states — some on track, some at risk, and one overdue. The tracker identifies and highlights the problems.

## Task Data

```json
{
  "tasks": [
    {
      "name": "Backend Refactor",
      "deadline": "2026-02-25",
      "progress": 60,
      "created": "2026-01-15T00:00:00Z",
      "completed": false
    },
    {
      "name": "Frontend Polish",
      "deadline": "2026-03-01",
      "progress": 20,
      "created": "2026-02-01T00:00:00Z",
      "completed": false
    },
    {
      "name": "Database Migration",
      "deadline": "2026-03-10",
      "progress": 85,
      "created": "2026-02-01T00:00:00Z",
      "completed": false
    }
  ]
}
```

## CLI Interaction

```bash
$ node scripts/cli.js status --file tasks.json

=== Deadline Tracker Report ===
Generated: 2026-02-27T10:00:00.000Z

--- Summary ---
Total tasks:    3
Completed:      0/3
Avg progress:   55%
At risk:        2
Overdue:        1
Overall status: NEEDS ATTENTION

--- Tasks ---
[XX] Backend Refactor
     Progress: [############--------] 60%
     Deadline: 2026-02-25 (2 days overdue)
     Risk:     OVERDUE

[!!] Frontend Polish
     Progress: [####----------------] 20%
     Deadline: 2026-03-01 (2 days left)
     Risk:     HIGH

[OK] Database Migration
     Progress: [#################---] 85%
     Deadline: 2026-03-10 (11 days left)
     Risk:     LOW
```

## Risk Assessment

- **Backend Refactor** is OVERDUE — the deadline has passed but the task is only 60% complete. Immediate action required.
- **Frontend Polish** is HIGH risk — only 20% complete with 2 days remaining. Very unlikely to meet the deadline.
- **Database Migration** is LOW risk — 85% complete with 11 days remaining. On track.

## Recommended Actions

1. Escalate the Backend Refactor immediately
2. Re-evaluate the Frontend Polish deadline or add resources
3. Continue monitoring Database Migration as planned
