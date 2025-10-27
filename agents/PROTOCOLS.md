Agent Communication Protocols (Phase 3 and beyond)

Purpose
- Establish one way for agents to coordinate across code, chat, and issues so progress is easy to follow and handoffs are reliable.

Core Channels
- Daily log (required): PHASE3_DAILY_LOG.md
  - Format: One dated section per day, per agent. Keep it concise (what changed, what’s next, blockers).
  - Handoffs: Add a short Handoff section with clear acceptance criteria.
- GitHub issues (required for work items):
  - Use project-specific templates (e.g., Agent C Handoff). Title with prefix [Agent X].
  - Labels: phase3, agent-a|agent-b|agent-c, area:api|console|site|docs, type:bug|feat|docs.
  - Every substantive task gets an issue; cross-link PRs and docs.
- Slack updates (recommended):
  - Post a one-paragraph update at start/end of a work session. Include: what changed, risks, next steps.

Code and PR Standards
- Branch names: feature/<phase>-<area>-<short-title>, fix/<area>-<short-title>.
- PR titles: feat(api): ..., fix(console): ..., docs(...): ...
- PR body checklist (paste):
  - Summary, Scope, Testing (local + unit), Env/Config changes, Migration impact, Rollback plan.
  - Link: daily log entry + issue ID.

Docs and Artifacts
- Broadcasts: AGENTS_BROADCAST_YYYY-MM-DD.md for cross-team milestones; reference from daily log.
- Handoffs: AGENT_X_HANDOFF.md with acceptance criteria + file pointers.
- Changelog: CHANGELOG.md updated under [Unreleased].
- Status: CURRENT_STATUS.md recent changes section.

Configuration & Env Changes
- When adding/changing env vars:
  - Update .env.example (+ per-app .env.local.example if applicable).
  - Add a short note in PHASE3_DAILY_LOG.md and PR body.
  - For hosted envs: Vercel (UI), Railway (API). Ensure mirrored secrets where pairs are required (e.g., CONSOLE_INTERNAL_TOKEN).

Testing & Validation
- Unit tests: run affected workspaces with pnpm --filter <pkg> test:run.
- Smoke validation: list endpoints you hit (URL + expected status) in PR body.
- Don’t merge with red tests.

Deployment Rules
- UI (site, console, docs): Vercel
- API: Railway
- Never change hosting split without explicit approval; document deploy steps in apps/<app>/DEPLOYMENT.md or DEPLOYMENT_STATUS.md.

Decision Logging
- Non-trivial decisions → add a short entry in PHASE3_DAILY_LOG.md and reference from the PR (what/why/options).

How to Start/Stop Work
1) Create/assign a GitHub issue using the correct template & labels.
2) Add intent to PHASE3_DAILY_LOG.md with acceptance criteria.
3) Open a feature branch, implement, push PR.
4) Summarize in daily log + Slack; broadcast if cross-cutting.

