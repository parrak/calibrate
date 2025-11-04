# Essential Context for AI Agents

**Purpose:** Minimal context for agents to understand the Calibrate platform  
**Last Updated:** October 27, 2025

---

## 🎯 Project: Calibrate - Smart Pricing Platform

Monorepo with `pnpm` + `turbo` across `apps/*` and `packages/*`.

**Current Status:** Phase 3 Complete - 95% production ready

---

## 📦 Apps

| App | Purpose | Status |
|-----|---------|--------|
| `api` | Next.js API (Railway) | ✅ Production |
| `console` | Next.js Admin UI (Vercel) | ✅ Production |  
| `site` | Landing page (Vercel) | ✅ Production |
| `docs` | API docs (Vercel) | ✅ Production |

---

## 🎁 Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `db` | Prisma schema, migrations | ✅ Complete |
| `ui` | Shared UI components | ✅ Complete |
| `platform-connector` | Unified connector interfaces | ✅ Complete |
| `shopify-connector` | Shopify integration | ✅ Complete (0 TS errors) |
| `amazon-connector` | Amazon SP-API integration | ✅ Complete |

---

## ⚙️ Essential Commands

```bash
pnpm dev      # Start all apps
pnpm build     # Build all packages  
pnpm test      # Run tests
pnpm lint      # Lint code
pnpm migrate   # DB migrations
pnpm seed      # Seed database
```

---

## 🔑 Key Integrations

**Shopify Connector:**
- OAuth authentication
- Product catalog sync  
- Price updates via GraphQL
- Webhook subscriptions

**Amazon Connector:**
- SP-API integration
- Pricing feed submission with encryption
- Catalog sync
- Feed status tracking

**Integration Management:**
- Dashboard at `/p/[slug]/integrations`
- Platform connection management
- Sync status tracking

---

## 📊 Current Phase

**Phase 3: Platform Integrations - 95% Complete**

✅ Platform abstraction layer (100%)  
✅ Amazon connector (95%)  
✅ Shopify connector (95%)  
✅ Integration management UI (90%)  
✅ Environment documentation (100%)

**Remaining:** Final testing and production deployment

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma + PostgreSQL
- **Auth:** NextAuth.js
- **Deployment:** Vercel (frontend), Railway (API)
- **Monorepo:** pnpm workspaces + turbo

---

## 📝 Key Files

- `README.md` - Full documentation
- `CURRENT_STATUS.md` - Current system status  
- `PHASE3_ROADMAP.md` - Phase 3 roadmap
- `AGENTS.md` - Repository rules
- `agents/PROTOCOLS.md` - Agent protocols

---

## 🚀 Quick Start

```bash
# 1. Setup
cp .env.example .env
pnpm install

# 2. Database  
pnpm migrate
pnpm seed

# 3. Start
pnpm dev
```

**URLs:**
- API: http://localhost:3000
- Console: http://localhost:3001
- Site: http://localhost:3003

---

For detailed information, see `README.md` or package-specific README files.
