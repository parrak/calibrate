# Quick Start - Calibrate Platform

## ?? Current Status (Phase 3: Platform Integrations)

**Status:** Production Ready - 95% Complete  
**Latest:** Shopify & Amazon connectors complete, UI integration management dashboard deployed

---

## ?? Architecture

**Monorepo:** `pnpm` + `turbo`  
**Apps:** `api`, `console`, `site`, `docs`  
**Packages:** `db`, `ui`, `platform-connector`, `shopify-connector`, `amazon-connector`

---

## ?? Key Commands

```bash
pnpm dev           # Start all apps
pnpm build         # Build all packages
pnpm test          # Run tests
pnpm lint          # Lint code
pnpm migrate       # Run DB migrations
pnpm seed          # Seed database
```

---

## ?? Current Features

? **Core Platform:** Webhook API, Policy Engine, Admin Console  
? **Competitor Monitoring:** Automated tracking, analytics, rules  
? **Platform Integrations:** Shopify OAuth/sync, Amazon SP-API  
? **Integration Management:** Dashboard at `/p/[slug]/integrations`

---

## Setup

1. Copy `.env.example` ? `.env`
2. Run `pnpm install`
3. Run `pnpm migrate && pnpm seed`
4. Run `pnpm dev`

See `README.md` for full setup instructions.

---

### OAuth Env Vars (summary)

Shopify
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES`, `SHOPIFY_WEBHOOK_SECRET`

Amazon SP-API (LWA)
- `AMAZON_SP_APP_ID`, `AMAZON_LWA_CLIENT_ID`, `AMAZON_LWA_CLIENT_SECRET`

Console/URLs
- `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_CONSOLE_URL`

---

## Essential Docs

- `README.md` - Full project documentation
- `CURRENT_STATUS.md` - Current system status
- `PHASE3_ROADMAP.md` - Phase 3 roadmap & architecture
- `AGENTS.md` - Repository rules for agents
- `agents/PROTOCOLS.md` - Agent collaboration protocols

---

**Need Help?** See documentation files or check existing implementations in `packages/*/README.md`



