# Status Broadcasting Guide

Purpose
- Provide a simple, consistent way for agents to publish progress and handoffs using Markdown files already in this repo.

Where to publish
- Daily progress: `PHASE3_DAILY_LOG.md` (append under today’s date)
- Rolling status: `CURRENT_STATUS.md` and `AGENT_STATUS.md` (keep top sections current)
- Milestone broadcasts: `AGENTS_BROADCAST_YYYY-MM-DD.md` (create a new file per milestone)
- Handoffs: `AGENT_*_HANDOFF.md` (acceptance criteria + exact file references)
- Optional low-level events: `agents/events/YYYYMMDD/<agent>.jsonl` (see `agents/README.md`)

Message structure
- What changed: concrete, scoped summary (1–3 bullets)
- Impact: what’s unblocked or verified (1–2 bullets)
- What’s next: the next executable steps (2–4 bullets)
- Blockers/Risks: known issues or decisions needed (0–3 bullets)
- Refs: exact file references like `apps/api/app/api/.../route.ts:1`

Templates

Daily log (append to `PHASE3_DAILY_LOG.md`)
- Date: YYYY-MM-DD — Agent X
  - What changed: …
  - Impact: …
  - What’s next: …
  - Blockers: …
  - Refs: `path/to/file.ts:1`, `another/file.md:10`

Milestone broadcast (`AGENTS_BROADCAST_YYYY-MM-DD.md`)
- Title: Agents Broadcast — <short title> (<YYYY-MM-DD>)
- Summary
  - …
- Changes
  - …
- Verification
  - Endpoints/paths tested and expected results
- Refs
  - `apps/...`:line, `packages/...`:line

Handoff (`AGENT_*_HANDOFF.md`)
- Context: what is complete and what remains
- Definition of done: clear acceptance criteria
- Next steps: ordered, testable actions
- Refs: exact files/lines to touch
- Owner: suggested agent and area

File references
- Always include path and line number when possible: `path/to/file.ts:line`
- One file per backtick block to keep links usable in IDEs

Optional JSONL events (fine-grained log)
- File: `agents/events/YYYYMMDD/<agent>.jsonl`
- Object shape:
  - `{ "type": "progress|handoff|done|blocked", "task_id": "<id>", "agent": "codex|claude|cursor", "message": "...", "refs": ["path:line"], "ts": "ISO-8601" }`

See also
- Hub: `AGENTS.md#status-broadcasting`
- Collaboration protocol: `agents/PROTOCOLS.md`
- JSONL usage and CLI helper: `agents/README.md`

