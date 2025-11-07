## Source of Truth

**Whenever direction is unclear, READ:**

- `/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md`
- `/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md`
- `/agents/docs/_EXECUTION_PACKET_V2/02_TEAM_ASSIGNMENTS.md`

These supersede older strategy/execution docs (e.g., legacy `AGENT_WORKFLOW.md`).

---

Agents Collaboration Protocol

This folder provides a lightweight, file-backed protocol for coordinating multiple AI coding agents (e.g., Codex CLI, Claude, Cursor) working in this repo.

Why files? All agents can read/write the repo. JSONL append-only logs are simple, merge-resistant, and easy to parse.

Folders
- tasks/: inbox and tracking for work items
- events/: append-only activity logs per agent per day
- locks/: optional per-task lock files
- plans/: short, human-readable plans per agent
- context/: shared notes and summaries
- learnings/: consolidated bug fixes, setup guides, troubleshooting, and deployment notes
- history/: key completion summaries and milestones

Files
- tasks/inbox.jsonl: one JSON per line - unclaimed tasks
- tasks/done.jsonl: one JSON per line - completed tasks
- tasks/in_progress/: <id>.json - exactly one owner working a task
- events/YYYYMMDD/<agent>.jsonl: one JSON per line - events
- locks/<task-id>.lock: JSON with owner and since timestamp

Task object (JSON)
- id: string (ULID or timestamp-id)
- title: short summary
- status: "inbox" | "claimed" | "blocked" | "done"
- owner: "codex" | "claude" | "cursor" | null
- definition_of_done: plain text acceptance criteria
- context_refs: array of file paths with optional line numbers (e.g., "apps/api/app/api/widgets/route.ts:1")
- inputs: arbitrary notes and constraints (object)
- outputs: results, file refs changed, commit/pr ids (array or object)
- next_steps: array of follow-up suggestions (objects with title, refs)
- created_at, updated_at: ISO strings

Event object (JSON)
- type: "claimed" | "progress" | "handoff" | "done" | "blocked"
- task_id: string
- agent: "codex" | "claude" | "cursor"
- message: short text
- refs: array of file refs with optional line numbers
- ts: ISO timestamp

Conventions
- Append-only writes for JSONL files (inbox, done, events).
- For in-progress, use one JSON file per task in tasks/in_progress/.
- Acquire a task by creating a lock file at locks/<id>.lock; release on completion or when returning to inbox.
- Atomic writes: write to a temp file then rename.
- Always include precise file references (path:line) in tasks and events when possible.

CLI helper
- See bin/agents-cli.mjs for simple operations: list, claim, handoff, complete, log-event.

Learnings & Documentation
- Bug fixes: `learnings/bug-fixes/` - Critical bug fixes and resolutions
- Setup guides: `learnings/setup-guides/` - Configuration and setup instructions
- Deployment: `learnings/deployment/` - Deployment-related learnings
- Troubleshooting: `learnings/troubleshooting/` - Common issues and solutions
- History: `history/` - Key completion summaries and milestones

Example: add a task
  node agents/bin/agents-cli.mjs new-task \
    --title "Add input validation to POST /widgets" \
    --dod "Reject invalid payloads; tests pass" \
    --refs apps/api/app/api/widgets/route.ts:1 \
    --inputs '{"schema":"zod object {name:string, size:number>0}"}'

Example: claim a task as codex
  node agents/bin/agents-cli.mjs claim --id <task-id> --agent codex

Example: handoff with next steps
  node agents/bin/agents-cli.mjs handoff \
    --id <task-id> --agent codex \
    --to claude \
    --message "Schema and route done; need tests" \
    --next '[{"title":"Write Vitest for invalid cases","refs":["apps/api/app/api/widgets/route.ts:1"]}]'

