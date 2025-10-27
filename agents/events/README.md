Events are written under a date prefix folder per day as append-only JSONL files.

Path: events/YYYYMMDD/<agent>.jsonl

Example line:
{"type":"handoff","task_id":"2025-10-27T12-00-04Z-xyz","agent":"codex","message":"Schema and route done; need tests","refs":["apps/api/app/api/widgets/route.ts:1"],"ts":"2025-10-27T12:25:10Z"}

