# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and follows semantic versioning.

## [Unreleased]

### Added

- **Analytics: Anomaly Detection System** (Agent C - Claude Code)
  - Intelligent detection of unusual pricing patterns and business metrics
  - Four anomaly types:
    - Price spikes/drops: Detects sudden price changes exceeding threshold (default 20%)
    - Volume spikes: Identifies unusual increases in price change activity (default 200%)
    - Margin compression: Alerts on declining profit margins (default 10% drop)
    - Competitor divergence: Flags significant deviations from market pricing (default 15%)
  - Severity classification: Critical, High, Medium, Low
  - Automated recommendations for each detected anomaly
  - Statistical outlier detection using Z-score method
  - New API: `detectAnomalies(projectId, config)` in `@calibr/analytics`
  - Configurable thresholds for all detection algorithms

- **Analytics: Weekly Insights Digest** (Agent C - Claude Code)
  - Automated weekly summary generation with actionable insights
  - Executive summary with key metrics and top metric highlights
  - Intelligent insight generation across 5 categories:
    - Pricing insights: Price change patterns and trends
    - Volume insights: Activity level analysis
    - Margin insights: Profitability tracking and warnings
    - Performance insights: Approval rates and execution efficiency
    - Opportunity insights: Untapped optimization potential
  - Performance comparison vs previous period with trend analysis
  - Business recommendations based on detected patterns
  - Integrated anomaly detection in digest reports
  - New API: `generateWeeklyDigest(projectId, weekEndDate)` in `@calibr/analytics`
  - Ready for email/Slack notification integration

- **AI Engine: Enhanced Rationale Explainer** (Agent C - Claude Code)
  - Dramatically improved AI pricing suggestion explanations
  - Multi-layered explanation system:
    - One-line summary for quick understanding
    - Detailed explanation with full context
    - Key factors breakdown with weights and influence
    - Business impact analysis (revenue, demand, competitive position)
    - Step-by-step reasoning chain showing decision process
  - Visual indicators:
    - Price direction: Increase, Decrease, Maintain
    - Confidence level: Very High, High, Moderate, Low
    - Urgency: Immediate, Recommended, Optional
    - Risk level: Low, Medium, High
  - Actionable next steps with implementation guidance
  - Smart warnings for edge cases (large changes, low confidence, missing data)
  - New API: `explainSuggestion(suggestion, input)` in `@calibr/ai-engine`
  - Supports merchant-friendly language and clear formatting

### Changed

- **Light Theme Transition Across All Applications**
  - Migrated all apps from dark theme to Notion-style light theme with neutral surfaces, subtle borders, and teal accent
  - **Global Theme Tokens:**
    - Background: `#f9f9fb` (neutral light)
    - Surface: `#ffffff` (white cards/panels)
    - Border: `#e5e7eb` (subtle gray borders)
    - Foreground: `#1a1a1a` (dark text)
    - Muted: `#6b7280` (secondary text)
    - Brand: `#00a3a3` (teal accent)
    - Accent: `#2563eb` (blue accent for links)
  - **Console (console.calibr.lat):**
    - Updated layout, header, and all surfaces to light theme
    - Cards now feature white backgrounds with soft shadows and hover elevation
    - Primary buttons: teal brand with white text, proper hover states
  - **Marketing Site (calibr.lat):**
    - Hero, features, testimonials, and CTA sections updated to light theme
    - White header/footer with subtle borders
    - Enhanced readability with improved text contrast
  - **Docs Site (docs.calibr.lat):**
    - Body and prose styling updated for light theme
    - Added typography variables for documentation content
  - **Shared UI Components:**
    - Card: Rounded corners (xl), subtle shadows with hover transitions
    - Button: Brand buttons with 90% opacity → 100% on hover
    - Updated all color references to use CSS custom properties
  - **Tailwind Configuration:**
    - All configs now reference CSS variables for theme colors
    - Added `borderColor: { DEFAULT: 'var(--border)' }` for consistent borders
    - Radius tokens updated to use CSS variables
  - Dark theme preserved under `:root.dark` for future theme toggle feature
  - All apps pass TypeScript checks with no breaking changes

### Added
- Integrated request monitoring and performance tracking in the API via `@calibr/monitor`, including structured logging, response timing, and X-Request-ID propagation.
- Launched the console AI Pricing Assistant experience with chat history, AI explanations, and follow-up suggestions.
- Introduced a guided tour component to onboard first-time console users.
- Added marketing site growth features, including the `/early-access` page plus dynamic icons and Open Graph assets.
- Published shared UI theme tokens so apps consume a single set of color and radius definitions.
- Delivered the Amazon SP-API pricing feed flow with encrypted feed submission endpoints and supporting console UI.

### Changed
- Adopted a unified light-theme palette across the console, marketing site, and docs with shared CSS variables and Tailwind configuration updates.
- Refreshed the console navigation and dashboard cards to highlight key heartbeat metrics and AI insights.
- Updated public links to reference `https://console.calibr.lat` instead of the legacy `app.calibr.lat` hostname.

### Fixed
- Hardened `POST /api/auth/session` to normalize provided roles (including case-insensitive duplicates) and fall back to the least-privileged `viewer` role when none are supplied.
- Ensured console deployments on Vercel generate the Prisma client during the install step to eliminate `@prisma/client` resolution errors.
- Resolved overlay focus issues in the console so drawers dismiss cleanly and no longer block background interactions.
- Forwarded `POST /api/platforms/shopify/sync` to `/api/integrations/shopify/sync` to keep deprecated clients working during the transition.
- Hardened the price changes page with clearer auth messaging, color-coded status filters, and graceful pagination recovery.
- Corrected console dark theme color tokens to restore text contrast across inputs, hover states, and shared components.

## [1.1.0] - 2025-10-25

### Added
- Console UX: sidebar layout, breadcrumbs, loading skeletons, and accessibility improvements across project pages.
- Verification log documenting Vercel deploy steps and outputs (`.github/VERIFICATION.md`).

### Changed
- Site (calibrate-site): add Next.js webpack alias for `@/…`; skip CI typecheck/lint; move Tailwind/PostCSS and TypeScript packages to production dependencies; add per-app `vercel.json` to force Next.js framework and monorepo build commands.
- Docs: move Tailwind/PostCSS to production dependencies for CI builds.
- Agent docs: update README and `.github/copilot-instructions.md` with Vercel monorepo guidance (frozen lockfile, per-app vercel.json, Tailwind/TS requirements) and deploy steps.

### Fixed
- Stabilize Vercel monorepo deploys by committing updated root `pnpm-lock.yaml` after sub-app dependency changes.
- All custom domains 200: `calibr.lat`, `console.calibr.lat`, `docs.calibr.lat`.

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

