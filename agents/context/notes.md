# Shared Notes & Context

Quick reference for agents working on Calibrate.

## 📁 Documentation Structure

**All documentation is now consolidated in `agents/` folder:**

- **Learnings:** `agents/learnings/`
  - Bug fixes: `bug-fixes/` - Critical issues and resolutions
  - Setup guides: `setup-guides/` - Configuration instructions
  - Deployment: `deployment/` - Production deployment notes
  - Troubleshooting: `troubleshooting/` - Common issues

- **History:** `agents/history/` - Key completion summaries

- **Tasks:** `agents/tasks/` - Task management (inbox, in-progress, done)

- **Plans:** `agents/plans/` - Per-agent plans

## 🔧 Quick Reference

### Common Issues & Fixes

1. **Shopify Connector Not Showing**
   - Fix: Import Shopify connector in `apps/api/lib/platforms/register.ts`
   - See: `agents/learnings/bug-fixes/shopify-connector-registration.md`

2. **CORS Errors**
   - Fix: Add `withSecurity` middleware and OPTIONS handler
   - See: `agents/learnings/bug-fixes/cors-configuration.md`

3. **Next.js 15 Dynamic Params**
   - Fix: Await `context.params` instead of destructuring
   - See: `agents/learnings/bug-fixes/nextjs-15-dynamic-params.md`

4. **Shopify OAuth Issues**
   - See: `agents/learnings/bug-fixes/shopify-oauth-cors.md`

### Setup Guides

- Environment setup: `agents/learnings/setup-guides/environment-setup.md`
- Shopify integration: `agents/learnings/setup-guides/shopify-integration.md`
- Production deployment: `agents/learnings/deployment/production-guide.md`

## 📊 Current Status

See `agents/history/agent-completions.md` for recent completion summaries.

## 🎯 Agent Responsibilities

- **Agent A (Cursor):** Infrastructure, developer experience, CI/CD, deployment
- **Agent B (Codex):** Core product, pricing engine, connectors, API, Price Changes MVP
- **Agent C (Claude Code):** AI, analytics, forecasting, intelligent automation

See `AGENT_WORKFLOW.md` for full details.
