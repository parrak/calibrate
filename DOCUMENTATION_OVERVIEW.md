# Calibrate Documentation Structure - Comprehensive Overview

## Executive Summary

The Calibrate codebase contains **multiple documentation systems** organized for different audiences and purposes:

1. **User-Facing Console Documentation** - Interactive guides for platform users
2. **API Documentation** - OpenAPI specification and Swagger UI
3. **Developer & Internal Documentation** - Setup guides, bug fixes, deployment information
4. **Strategic/Planning Documentation** - Architecture, planning, and onboarding materials
5. **Agent Learning Documentation** - Consolidated bug fixes and troubleshooting

Total documented files: ~52 markdown files + interactive documentation pages

---

## 1. USER-FACING DOCUMENTATION (apps/docs)

**Location:** `/home/user/calibrate/apps/docs/`
**Live URL:** https://docs.calibr.lat
**Technology:** Next.js 15 with React, TypeScript
**Deployment:** Vercel (auto-deploy on main branch)

### Documentation Topics (13 console guides)

#### Core Workflow
- **Getting Started** - Account creation, onboarding, project setup, dashboard overview
- **Product Catalog** - Browse products, search, filter, view pricing information
- **Price Changes** - Review workflow, approval process, state management, sync status
- **Pricing Rules** - Create automated rules with product selectors, price transforms, schedules

#### Feature Documentation
- **Platform Integrations** - Connect Shopify and Amazon, manage credentials, troubleshooting
  - Shopify: Full bidirectional OAuth-based integration
  - Amazon: Read-only SP-API integration
- **Competitor Monitoring** - Track competitor prices, create monitoring rules
- **Analytics** - Pricing trends, performance insights, historical data
- **AI Assistant** - Query pricing data using natural language

#### Reference & Support
- **Roles & Permissions** - User roles, access control, team management
- **Best Practices** - Workflow tips, pricing strategy, batch testing, constraint management
- **Troubleshooting** - Common issues and solutions
- **API Reference** - API endpoints used by the console

### Documentation Structure
```
apps/docs/
├── app/
│   ├── console/
│   │   ├── page.tsx (Console home with navigation)
│   │   ├── getting-started/page.tsx
│   │   ├── catalog/page.tsx
│   │   ├── price-changes/page.tsx
│   │   ├── pricing-rules/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── competitors/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── ai-assistant/page.tsx
│   │   ├── roles-permissions/page.tsx
│   │   ├── best-practices/page.tsx
│   │   ├── troubleshooting/page.tsx
│   │   └── api-reference/page.tsx
│   └── page.tsx (Home page)
├── api/
│   └── openapi.yaml
└── index.html (Swagger UI)
```

### Key Features
- Responsive design with Tailwind CSS
- Component-based architecture
- Internal linking between guides
- Code examples and screenshots
- Best practice recommendations
- Troubleshooting cards with common issues

---

## 2. API DOCUMENTATION

**Location:** `/home/user/calibrate/docs/` and `/home/user/calibrate/apps/docs/api/`

### OpenAPI Specification
- **File:** `api/openapi.yaml`
- **Version:** 3.0.3
- **Server URLs:**
  - Production: https://api.calibr.lat
  - Development: http://localhost:3000

### API Endpoints Categories
- **Health** - System health monitoring and metrics
- **Webhooks** - Price suggestion webhook endpoints
- **Price Changes** - Price change management and approval
- **Catalog** - Product catalog and pricing data
- **Analytics** - Metrics and analytics endpoints
- **Admin** - Administrative dashboard endpoints

### API Features Documented
- HMAC signature verification for webhooks
- Rate limiting (1000 req/15min general, 60 req/min webhooks)
- Project-based access control
- Multi-tenant architecture
- Response formats and error handling
- Pagination for list endpoints

### Swagger UI
- **File:** `index.html`
- **Access:** https://docs.calibr.lat
- Interactive API testing interface
- Request/response examples
- Schema definitions

---

## 3. DEVELOPER & INTERNAL DOCUMENTATION

### Location: `/home/user/calibrate/docs/`

Total: **52 markdown files** organized in subdirectories

#### 3.1 Learning & Debugging Guides (`/learnings/`)
- 22 detailed technical documents

**Topics Covered:**
- **OAuth & Authentication:**
  - OAUTH_LOCAL_TEST_SUCCESS.md
  - OAUTH_TEST_RESULTS.md
  - SETUP_SHOPIFY_CREDENTIALS.md

- **Shopify Integration:**
  - SHOPIFY_APP_SETUP_GUIDE.md
  - SHOPIFY_CUSTOM_APP_LIMITATIONS.md
  - SHOPIFY_CUSTOM_APP_TROUBLESHOOTING.md
  - SHOPIFY_OAUTH_CORS_FIXES_OCT31.md
  - SHOPIFY_REDIRECT_URI_FIX.md
  - SHOPIFY_SECRET_ROTATION_GUIDE.md
  - SHOPIFY_DISTRIBUTION_MODEL_GUIDE.md
  - SHOPIFY_CONNECTOR_FIXES_NEEDED.md

- **CORS & Deployment:**
  - CORS_DEBUGGING_OCT27.md
  - CORS_FIX_SUMMARY.md
  - DEPLOYMENT_FIX_SUMMARY.md

- **Setup & Testing:**
  - SETUP_LOCAL_ENV.md
  - LOCAL_TESTING_GUIDE.md
  - TEST_REPORT.md
  - test-oauth-flow.md
  - PRODUCTION_DEPLOYMENT_GUIDE.md
  - RAILWAY_DEPLOYMENT_VERIFICATION.md
  - QUICK_FIX_SUMMARY.md

#### 3.2 Miscellaneous Documentation (`/misc/`)
- 22 strategic and reference documents

**Categories:**

**Architecture & Design:**
- ARCHITECTURE_DIAGRAM.md
- TECHNICAL_ASSESSMENT.md
- INTEGRATION_DASHBOARD_DESIGN.md

**Planning & Strategy:**
- CONNECTOR_SETUP_PLAN.md
- PLANNING_SUMMARY.md
- PROJECT_ONBOARDING_SPEC.md
- CREDENTIAL_ENCRYPTION_STRATEGY.md
- MONITORING_ALERTING_PLAN.md

**Environment & Deployment:**
- STAGING_ENVIRONMENT.md
- PRODUCTION_VERIFICATION.md
- ENCRYPTION_SETUP_GUIDE.md
- ENCRYPTION_DEPLOYMENT_CHECKLIST.md
- NEXTAUTH_FIX_DEPLOYMENT.md

**Onboarding:**
- QUICK_START.md
- ESSENTIAL_CONTEXT.md
- EXECUTIVE_SUMMARY.md
- QUICK_REFERENCE_NEXT_STEPS.md

**Other:**
- COMPETITOR_MONITORING.md
- REGRESSION_PREVENTION.md
- PHASE2_COMPLETE.md
- NOTES_AUTH_INTEGRATION.md

#### 3.3 Feature Documentation (Top-level)
- FIX_401_LOGIN.md
- M0.4_AMAZON_CONNECTOR_IMPLEMENTATION.md
- PRICE_CHANGES_API.md
- PRICING_RULES_IMPLEMENTATION.md

#### 3.4 Testing Documentation
- UI_TESTING_PLAN.md

#### 3.5 Verification
- AI_COPILOT_VERIFICATION.md

---

## 4. AGENT LEARNING DOCUMENTATION

**Location:** `/home/user/calibrate/agents/learnings/`

**Purpose:** Consolidated bug fixes, setup guides, and deployment information extracted from broader documentation

### Structure
```
agents/learnings/
├── README.md (Quick reference guide)
├── bug-fixes/
│   ├── shopify-connector-registration.md
│   ├── shopify-oauth-cors.md
│   ├── cors-configuration.md
│   └── nextjs-15-dynamic-params.md
├── setup-guides/
│   ├── environment-setup.md
│   └── shopify-integration.md
└── deployment/
    ├── production-guide.md
    └── vercel-preview-deployments.md
```

### Critical Bug Fixes Documented
1. **Shopify Connector Registration** - Import trigger for auto-registration
2. **Shopify OAuth & CORS Issues** - Multiple fixes from Oct 31, 2025
3. **CORS Configuration** - Middleware and fetch configuration
4. **Next.js 15 Dynamic Params** - Framework-specific fixes

### Setup Guides
- Environment variable configuration
- Shopify integration setup
- Local development environment

### Deployment Guides
- Production deployment checklist
- Railway deployment specifics
- Vercel preview deployments

---

## 5. MISCELLANEOUS DOCUMENTATION

### Calibr-Docs App (`/calibr-docs/`)
- Separate Next.js documentation project
- Single page: `src/app/docs/page.mdx`
- Appears to be in early development

### Root-Level Documentation Files
- **README.md** - Main project overview
- **CHANGELOG.md** - Version history and changes
- **TODO.md** - Outstanding tasks
- **AGENTS.md** - Agent notes and context
- **ENCRYPTION_DEPLOYMENT.md** - Encryption specific guide
- Various other implementation notes

---

## Documentation Organization Summary

### By Audience

**End Users (Pricing Managers):**
- apps/docs/app/console/* (User guides, how-to's, best practices)
- Accessible at https://docs.calibr.lat

**Developers/Integrators:**
- docs/learnings/* (Setup guides, debugging)
- docs/misc/* (Architecture, planning)
- agents/learnings/* (Bug fixes, troubleshooting)

**API Consumers:**
- docs/api/openapi.yaml (API specification)
- apps/docs/index.html (Interactive Swagger UI)
- apps/docs/app/console/api-reference/page.tsx

**Internal/Strategic:**
- docs/misc/* (Architecture, planning, strategy)
- Root-level markdown files (Project context)

### By Topic Coverage

**Core Features:**
- Pricing rules (automation, selectors, schedules)
- Price changes (workflow, approval, sync)
- Product catalog (browsing, search, filtering)
- Platform integrations (Shopify, Amazon)

**Supporting Features:**
- AI Assistant (natural language queries)
- Analytics (trends, insights)
- Competitor monitoring
- Roles & permissions

**Technical:**
- OAuth authentication
- CORS configuration
- Connector architecture
- Deployment (Railway, Vercel)
- Environment setup

**Operational:**
- Best practices for pricing management
- Troubleshooting common issues
- User onboarding
- Team management

---

## How-To Guides & Tutorials

### User-Facing Tutorials
1. **Getting Started** - Complete onboarding from signup to first price change
2. **Shopify Integration** - Step-by-step OAuth connection
3. **Amazon Integration** - SP-API credential setup
4. **Creating Pricing Rules** - Building automated pricing logic
5. **Managing Price Changes** - Review and approval workflow
6. **Batch Testing** - Safe approach to large catalog updates

### Developer Guides
1. **Environment Setup** - Local development configuration
2. **Shopify Integration Setup** - Connector implementation
3. **Production Deployment** - Railway/Vercel deployment
4. **CORS Configuration** - Proper middleware setup
5. **OAuth Testing** - Local OAuth flow testing

---

## Current Documentation Gaps & Opportunities

### Well-Documented Topics
- Shopify integration (multiple guides)
- CORS and OAuth issues
- API specification (OpenAPI)
- Basic feature usage (console guides)

### Areas With Less Documentation
- Amazon SP-API integration details
- Competitor monitoring implementation
- Analytics data structure
- AI Assistant capabilities & limitations
- Advanced pricing rule patterns
- Performance optimization tips
- Monitoring & alerting setup
- Data export/reporting features

### Improvement Opportunities
1. Video tutorials for common workflows
2. Interactive code examples
3. More Amazon integration guides
4. Advanced pricing strategy documentation
5. API client library documentation
6. Webhook event documentation
7. Error code reference guide
8. Migration guides

---

## Documentation Tools & Technologies

- **User Documentation:** Next.js 15, TypeScript, React, Tailwind CSS
- **API Documentation:** OpenAPI 3.0.3 specification, Swagger UI
- **Markdown:** Standard markdown files throughout
- **Deployment:** Vercel for user-facing docs, auto-deploy on main branch
- **Version Control:** Git-based, includes change history

---

## Key Files by Purpose

| Purpose | File Location |
|---------|---------------|
| User Getting Started | /apps/docs/app/console/getting-started/page.tsx |
| API Spec | /docs/api/openapi.yaml |
| API Reference Page | /apps/docs/app/console/api-reference/page.tsx |
| Setup Guides | /agents/learnings/setup-guides/*.md |
| Bug Fixes | /agents/learnings/bug-fixes/*.md |
| Architecture | /docs/misc/ARCHITECTURE_DIAGRAM.md |
| Best Practices | /apps/docs/app/console/best-practices/page.tsx |
| Deployment | /agents/learnings/deployment/*.md |
| Troubleshooting | /apps/docs/app/console/troubleshooting/page.tsx |
| Strategic Planning | /docs/misc/PLANNING_SUMMARY.md |

