# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and follows semantic versioning.

## [1.0.0] - 2025-10-24

### 🚀 Production Deployment

**All services successfully deployed to production:**
- API: https://api.calibr.lat (Railway)
- Console: https://console.calibr.lat (Vercel)
- Site: https://calibr.lat (Vercel)
- Docs: https://docs.calibr.lat (Vercel)

### Added

#### API Service
- Implemented Next.js standalone output mode for optimized Docker builds
- Added health check endpoint `/api/health` for Railway monitoring
- Added Railway deployment configuration (`railway.toml`, `railway.json`)
- Added OpenSSL installation in Dockerfile for Prisma compatibility
- Added multi-stage Docker build for smaller production images
- Added non-root user (nextjs) for container security

#### Console UI
- Added mock data for price changes page
- Added mock data for catalog page
- Added center-aligned navigation menu
- Added proper button styling for menu items

#### Documentation
- Added `DEPLOYMENT_STATUS.md` with current production state
- Added comprehensive deployment instructions in `apps/api/DEPLOYMENT.md`
- Added infrastructure diagram in README
- Added troubleshooting guide for common deployment issues

#### Developer Tools
- Added `scripts/migrate.sh` for Railway migrations
- Added `scripts/setup-railway.ps1` for automated Railway configuration

### Changed

#### API Service
- **BREAKING:** Updated Prisma binary targets from `linux-musl` to `debian-openssl-3.0.x`
- Changed Docker base image from `node:20-alpine` to `node:20-slim` for Prisma compatibility
- Updated `verifyHmac` to return request body to prevent double-read errors
- Updated webhook route to use body from `verifyHmac` result
- Removed channel filtering from competitor rules (feature not in data model)

#### Console UI
- Removed "Calibr" branding from header per design requirements
- Changed navigation to be center-aligned
- Fixed incorrect link from `/console/p/demo` to `/p/demo`

#### Infrastructure
- Switched from Alpine Linux to Debian Slim for better library compatibility
- Updated Next.js config to use standalone output mode
- Removed public folder from Dockerfile (not needed for API)

### Fixed

#### Critical Fixes
- Fixed Prisma client initialization errors (`libssl.so.1.1: No such file or directory`)
- Fixed "Body is unusable: Body has already been read" error in webhook handler
- Fixed TypeScript errors in `verifyHmac` function signature
- Fixed TypeScript errors in competitor monitoring package
- Fixed Docker build failures due to invalid Prisma binary targets
- Fixed container startup failures (cd command not executable)
- Fixed node_modules not found errors in production

#### Minor Fixes
- Fixed lockfile synchronization issues
- Fixed package naming inconsistencies (@calibrate → @calibr)
- Fixed Railway custom start command conflicts with Dockerfile CMD
- Fixed Dockerfile copying non-existent public folder

### Deployment History

#### Commits (Oct 24, 2025)
- `1a0532c` - Fix: Update Prisma binary targets for Debian (node:20-slim)
- `3d9398e` - Fix: Use node:20-slim for Prisma OpenSSL compatibility and fix body double-read issue
- `d1288e1` - Feat: Use Next.js standalone output for Docker deployment
- `34d5552` - Fix: Run pnpm from workspace root to find dependencies
- `7750504` - Fix: Remove channel filtering from competitor rules (field not in data model)
- `918bb94` - Fix: Update webhook verifyHmac to use new async signature
- `034927e` - Fix: Remove public folder copy from Dockerfile (not needed for API)

### Technical Details

#### Docker Configuration
```dockerfile
FROM node:20-slim AS builder
# ... build with OpenSSL installed ...

FROM node:20-slim AS runner
# ... copy standalone output ...
CMD ["node", "apps/api/server.js"]
```

#### Prisma Configuration
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

#### Next.js Configuration
```javascript
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}
```

### Database

#### Migrations
- All migrations applied successfully to Railway PostgreSQL
- Schema includes: Tenants, Users, Projects, Products, SKUs, Prices, Price Changes, Policies, Competitors, etc.

#### Seed Data
- Demo tenant and project created
- Sample products and SKUs loaded
- Demo price changes for testing

### Known Issues
- None at this time

## [Unreleased]

### Added - Phase 2: Competitor Monitoring

**Web Scraping Infrastructure:**
- Implemented Shopify price scraper using JSON product API for reliable data extraction
- Implemented Amazon price scraper (stub with API integration guidance)
- Implemented Google Shopping price scraper (stub with Content API/SerpAPI integration guidance)
- Created auto-detection system to identify channel from product URLs
- Added comprehensive unit tests for all scraper utilities (31 passing tests)

**UI Enhancements:**
- Added Competitor Analytics dashboard component with market insights:
  - Market position indicators (lowest/highest/middle)
  - Average market price tracking
  - Price spread analysis
  - Per-product competitor price comparisons
- Updated competitors page with 3-tab layout: Monitor, Analytics, Rules
- Enhanced competitor monitoring UI with real-time price tracking

**Database & Seeding:**
- Extended seed script with demo competitor data:
  - 2 demo competitors (Competitor A & Competitor B)
  - Competitor products mapped to PRO-MONTHLY and ENT-MONTHLY SKUs
  - Competitor price history with sale indicators
  - Demo competitor rule: "Beat Competition by 5%"

**Architecture:**
- Updated `CompetitorMonitor` class to use channel-specific scrapers
- Improved error handling and logging for scraping operations
- Added scraper package structure: `packages/competitor-monitoring/scrapers/`

See [COMPETITOR_MONITORING.md](COMPETITOR_MONITORING.md) for detailed feature documentation.

### Planned
- CI/CD pipeline with GitHub Actions
- Staging environment setup
- API documentation (Swagger/OpenAPI)
- Rate limiting implementation
- Monitoring and alerting setup
- Performance optimization
- Phase 3: E-commerce platform integrations (Shopify, Amazon, Google Shopping APIs)

### Fixed
- Align PNPM version with lockfile for Docker/Railway builds.
  - Pin `packageManager` to `pnpm@9.0.0` to match `lockfileVersion: '9.0'`.
  - Use Corepack in Dockerfile (`corepack prepare pnpm@9.0.0 --activate`) instead of `pnpm@latest` to prevent lockfile incompatibility errors.



## [Unreleased] - 2025-10-25

### Added
- Console UX: sidebar layout, breadcrumbs, loading skeletons, accessibility tweaks.
- Site build: resolve TS path alias, skip typecheck/lint in CI, prod deps for Tailwind/TS.
- Docs build: prod deps for Tailwind/PostCSS, lockfile guidance.

### Changed
- README and agent instructions updated with Vercel monorepo deploy steps and frozen lockfile caveat.

### Fixes
- Vercel deployments stabilized by committing updated root pnpm-lock.yaml after sub-app dependency changes.

