# Example: Successful Deadline Tracking

## Scenario

A team is tracking three tasks, all progressing well and on schedule.

## Task Data

```json
{
  "tasks": [
    {
      "name": "API Integration",
      "deadline": "2026-03-15",
      "progress": 80,
      "created": "2026-02-01T00:00:00Z",
      "completed": false
    },
    {
      "name": "Documentation",
      "deadline": "2026-03-20",
      "progress": 60,
      "created": "2026-02-10T00:00:00Z",
      "completed": false
    },
    {
      "name": "Testing",
      "deadline": "2026-04-01",
      "progress": 100,
      "created": "2026-02-01T00:00:00Z",
      "completed": true
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
Completed:      1/3
Avg progress:   80%
At risk:        0
Overdue:        0
Overall status: ON TRACK

--- Tasks ---
[OK] API Integration
     Progress: [################----] 80%
     Deadline: 2026-03-15 (16 days left)
     Risk:     LOW

[OK] Documentation
     Progress: [############--------] 60%
     Deadline: 2026-03-20 (21 days left)
     Risk:     LOW

[OK] Testing
     Progress: [####################] 100%
     Deadline: 2026-04-01 (33 days left)
     Risk:     NONE
```

## Key Takeaway

When all tasks are progressing at or ahead of schedule, the report shows "ON TRACK" and all risk levels are LOW or NONE.
