# AGENTS.md — Calibrate Agent Contributor Guide

**Last updated**: February 13, 2026

---

## ⚠️ READ FIRST

**There has been a strategic pivot.** Before doing ANY work, read:

→ `/agents/PIVOT.md`

This explains what changed, what's deprecated, and what's active.

---

## AGENT DIRECTORY

```
/agents/
├── PIVOT.md                    ← Start here. Strategic redirect.
├── QUEUE.md                    ← Master task queue. 75 tasks, prioritized.
├── ARCHITECTURE.md             ← Schema, interfaces, API routes, system diagram.
├── RISK.md                     ← Employment constraints, operational limits.
├── execution-packets/
│   ├── week-01-mutation-core.md    ← Current: Schema + types
│   ├── week-02-mutation-api.md     ← Next: API + policy engine
│   └── ...                         ← Created as prior weeks complete
└── completed/                  ← Moved here when done
```

---

## RULES FOR ALL AGENTS

### Code rules
1. TypeScript strict mode. No `any` unless explicitly unavoidable.
2. All new code has tests. Target: mutation lifecycle e2e tests.
3. Prisma for all DB access. No raw SQL unless performance-critical.
4. Every state transition emits an AuditEvent. No silent mutations.
5. RLS-scoped queries. Never return cross-tenant data.
6. Commit messages reference task IDs: `[CAL-001] Add Mutation table to Prisma schema`

### Process rules
1. Update task status in `QUEUE.md` when starting and completing.
2. Do not start a task whose dependencies are not `DONE`.
3. If blocked, mark `BLOCKED` with a note on what's needed.
4. Do not modify existing tests to make them pass. Flag regressions.
5. Ask for human review before any architectural decision not covered in ARCHITECTURE.md.

### Safety rules (employment constraint)
1. All work on personal devices/accounts.
2. Zero Stripe code, tools, data, or internal knowledge.
3. No work during Stripe business hours (Pacific time).
4. All design decisions explainable from first principles and public sources.
5. Commit timestamps matter — keep them to evenings/weekends.

---

## AGENT TOOL MAPPING

| Task type | Primary tool | Notes |
|-----------|-------------|-------|
| Schema / migrations | Claude Code | Direct Prisma manipulation |
| API routes | Claude Code | Next.js API patterns |
| Policy engine logic | Claude Code | Pure TypeScript |
| Console UI | Cursor | React components, Tailwind |
| Integration tests | Claude Code | Vitest or Jest |
| Documentation | Gemini or Claude Code | Markdown |
| Outreach / strategy | Not agent work | Founder only |

---

## CONTEXT DOCUMENTS

These provide strategic context but are NOT executable:

| Document | Purpose | Location |
|----------|---------|----------|
| Execution Thesis (Doc A) | Why agencies, why pricing, what ships in 6 weeks | `/mnt/user-data/outputs/calibrate-doc-a-execution-thesis.md` |
| Platform Vision (Doc B) | Long-term platform architecture, investor narrative | `/mnt/user-data/outputs/calibrate-doc-b-platform-vision.md` |
| Execution Package | 12-week roadmap, demo spec, system diagram, risk map | `/mnt/user-data/outputs/calibrate-execution-package.md` |
| Strategy v3 | Full 19-section strategy (deprecated framing, architecture still valid) | `/mnt/user-data/outputs/calibrate-strategy-v3.md` |

**Note**: These documents may reference the OLD Shopify/agency framing. The PIVOT.md in this directory supersedes all external-facing positioning in those docs. Architecture and data model guidance remains valid.
