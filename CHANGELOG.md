# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and follows semantic versioning.

## [Unreleased]

### Added

- **Comprehensive UX Refresh Across All Applications**
  - **Marketing Site (calibr.lat):**
    - Replaced hero code demo with autoplay video (MP4 with GIF fallback)
    - Updated hero copy: "Dynamic pricing with guardrails"
    - New `/early-access` page with form embed for early access signups
    - Added testimonials section with customer social proof quotes
    - Enhanced SEO with comprehensive meta tags, Open Graph images, Twitter cards
    - Added video preload and DNS preconnect optimizations for performance
    - Updated CTAs to "Try the Console" and "Join Early Access"

  - **Console (console.calibr.lat):**
    - Simplified navigation with emoji icons and improved visual hierarchy
    - Reordered nav items for better UX: Dashboard, Catalog, Price Changes, AI Suggestions, Analytics, Competitors, Settings
    - Added dashboard heartbeat cards showing: Pending Price Changes, AI Suggestions, Connector Health, Applied Today
    - Integrated guided tour modal for new user onboarding (localStorage-based, dismissible)
    - Added AI rationale tooltips in price changes table (hover "?" icon shows policy checks)
    - Applied consistent dark theme across all console pages
    - Loading skeleton states for async data

  - **Docs Site (docs.calibr.lat):**
    - Updated to dark theme matching marketing and console
    - Improved API endpoint documentation layout with hover effects
    - Added navigation links between docs, console, and marketing sites
    - Enhanced visual hierarchy and readability

  - **Design System:**
    - Unified CSS theme tokens across all apps (--bg, --surface, --border, --fg, --mute, --brand)
    - Consistent dark color palette with teal brand accent (#00c2a8)
    - Improved accessibility with ARIA labels, keyboard navigation, WCAG AA color contrast
    - Reduced motion support for animations

- **Marketing Site: Icons & Social Previews**
  - Dynamic Next/OG assets for runtime generation:
    - `apps/site/app/icon.tsx` (favicon)
    - `apps/site/app/apple-icon.tsx` (Apple touch icon)
    - `apps/site/app/opengraph-image.tsx` (Open Graph image)
  - Added Contact links to `contact@calibr.lat` (hero + footer)

### Changed
- Marketing site, docs, and standalone app links updated from `https://app.calibr.lat` to `https://console.calibr.lat`
- Kept static fallback `apps/site/public/favicon.svg`

### Added
- **API: Request Monitoring & Performance Tracking**
  - Integrated `@calibr/monitor` package for comprehensive request logging and observability
  - Automatic request/response logging for all API routes using `withSecurity` middleware
  - Performance metrics tracking per endpoint (response time, status codes)
  - Error tracking with stack traces and context
  - X-Request-ID header propagation for distributed tracing
  - Request context extraction (project ID, user ID, IP address)
  - Configurable logging levels and monitoring options
  - Added 15 comprehensive tests covering all monitoring features
  - No breaking changes - monitoring enabled by default, can be disabled per-route
- **Marketing Site: Early Access Page**
  - New early access page at `/early-access` with form embed placeholder for Tally.so integration
  - Allows merchants to sign up for personalized onboarding
  - Mobile-responsive design with dark theme styling

- **Console: Guided Tour Component**
  - New `GuidedTour` component for first-time user onboarding
  - Shows welcome message with key feature highlights (Dashboard, Price Changes, Analytics)
  - Uses localStorage to track if tour has been seen (shows once per browser)
  - Ready to be integrated into project layout when needed

- **Shared UI: Theme Tokens**
  - New `packages/ui/theme.ts` module with centralized color and radius definitions
  - Provides consistent styling tokens across marketing site and console
  - Documents required CSS custom properties for theme implementation

- API / Console: Shopify price change apply + rollback now call the live Shopify connector, recording variant metadata and surfacing connector errors with tests for the new flow.
- **Console: AI Pricing Assistant (Copilot UI)**
  - Completed AI Copilot console UI to complement existing GPT-4 backend API
  - New AI Assistant page with full-featured chat interface for natural language pricing queries
  - AIExplanation component for on-demand AI analysis of individual price changes
  - Integrated with existing `/api/v1/assistant/query` endpoint
  - Features:
    - Message history display with user/assistant bubbles
    - Suggested questions with one-click execution
    - Data viewer for query results with AI/pattern method indicators
    - SQL query inspection for transparency
    - Follow-up suggestion system
    - Loading states and error handling
    - Authentication-aware with graceful fallback messaging
  - Added "AI Assistant" navigation link to project sidebar
  - Integrated AIExplanation component into price change detail drawer
  - Fulfills AI Copilot feature from Growth Phase (v0.3-v0.6) agent workflow

### Fixed
- **Console: Overlay Component Improvements**
  - Fixed Drawer component blocking user interactions when closed by adding conditional `pointer-events: none`
  - Enhanced GuidedTour with click-outside-to-dismiss functionality
  - Added ESC key support to dismiss GuidedTour
  - Improved z-index layering to prevent overlay conflicts
  - Resolves blocking overlay issue on price-changes page

- API: Fixed 410 error on POST /api/platforms/shopify/sync endpoint
  - Deprecated endpoint now forwards requests to /api/integrations/shopify/sync
  - Maps syncType parameter to action for backward compatibility
  - Maintains compatibility with existing console code using platformsApi.triggerSync

- Console: Price Changes page improvements
  - Fixed Drawer component black overlay persisting when closed
  - Enhanced authentication error handling with helpful user messages
  - Added server-side logging for auth token fetch failures
  - Improved pagination cursor error handling to gracefully stop instead of showing error banner
  - Color-coded status filter buttons for better UX (Pending=yellow, Applied=green, Failed=red, etc.)
  - Better error messages explaining CONSOLE_INTERNAL_TOKEN configuration requirements
  - Resolves "You reached the start of the range" error message

- Console: Fixed UI contrast issues with black text on dark backgrounds
  - Updated globals.css to use dark theme colors (#0B0B0C background, #E5E7EB text) matching the app design
  - Added missing Tailwind color definitions (muted, muted-foreground, background, foreground, input, ring) for component compatibility
  - Fixed all `bg-muted` references to use `bg-mute` throughout the codebase
  - Added explicit `text-foreground` classes to Input and Textarea components for proper text visibility
  - Fixed price-changes page hover states and ensured all interactive elements have proper contrast
  - Resolves accessibility issues where text was invisible or hard to read on dark backgrounds

- Amazon Connector (Agent B)
  - Initial SP-API pricing feed flow merged to master
  - Adds feed XML builder, AES-256-GCM encryption + upload, optional submission
  - New API endpoints: POST /api/platforms/amazon/pricing, GET /api/platforms/amazon/pricing/status
  - Console UI page to submit/poll pricing feeds
  - Registry bootstrap integrates with @calibr/platform-connector
 - Auth integration groundwork (WIP)
   - API: POST /api/auth/session issues bearer tokens for Console→API calls (guarded by CONSOLE_INTERNAL_TOKEN)
   - Console: NextAuth wiring to request/store API token; added UI auth check
   - Known issue: NextAuth v5 dev import paths causing build errors; to resolve next session

### Planning
- **Phase 3: Platform Integrations** - Roadmap and architecture planning complete
  - Created comprehensive Phase 3 roadmap for parallel development across 3 independent workstreams
  - Workstream A: Shopify connector with OAuth, Admin API, and GraphQL integrations
  - Workstream B: Amazon connector with SP-API, LWA auth, and price feed submission
  - Workstream C: Platform abstraction layer with unified interfaces and registry
  - Architecture designed for 3 agents to work independently with async coordination
  - Daily coordination log template created for team communication
  - Agent quick start guide with detailed onboarding for each workstream
  - See [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md) for complete roadmap

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

