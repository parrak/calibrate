# Calibrate Release Notes — Winter 2025

**Release Period:** November 2025 - January 2025  
**Status:** Production Ready

---

## Overview

We're excited to announce major enhancements to Calibrate's AI-native pricing control plane. This release delivers comprehensive automation monitoring, safety guardrails, AI-powered simulations, and expanded platform integrations to help you manage pricing with confidence and precision.

**Highlights:**
- 🎯 **Automation Runner UI** — Monitor and manage all automated pricing executions in real-time
- 🛡️ **Safety Guardrails** — Protect your business with price floors, ceilings, and velocity limits
- 🤖 **Copilot Simulation API** — Test pricing strategies with AI-powered "what-if" analysis
- 💳 **Stripe Integration** — Unified analytics across all your sales channels
- 📊 **Competitor Monitoring** — Complete competitive intelligence system with real-time insights

---

## Major Features

### 🎯 Automation Runner UI (M1.7)

**Monitor every automated pricing decision with complete transparency.**

Take full control of your automated pricing rules with our new Automation Runs interface. Track execution status, retry failed updates, and access detailed audit trails — all from a single, intuitive dashboard.

**Key Capabilities:**

- **Real-Time Monitoring** — Watch your pricing rules execute with live progress indicators that update every 2 seconds
- **Smart Retry System** — Retry failed price updates without re-running entire rules, saving time and reducing errors
- **Complete Transparency** — View detailed explain traces showing exactly why each price was changed
- **Comprehensive Audit Trail** — Full history of every action taken, perfect for compliance and debugging

**What You Get:**

- **Runs Table** with status filters (Preview, Queued, Applying, Applied, Failed, Rolled Back)
- **Run Detail Drawer** with 4 tabs:
  - **Overview** — Status, timestamps, target counts, error messages
  - **Explain** — Transform JSON and explain trace for debugging
  - **Targets** — Complete list of product price changes with before/after snapshots
  - **Audit Trail** — Full history of actions taken
- **Progress Indicators** — Visual progress percentage and completion counts (e.g., "50% (10/20)")
- **Toast Notifications** — Automatic alerts when runs complete or fail

**New API Endpoints:**
- `GET /api/v1/runs` — List runs with filters and pagination
- `GET /api/v1/runs/:runId` — Get run details with targets and audit events
- `POST /api/v1/runs/:runId/retry-failed` — Retry failed targets
- `GET /api/v1/runs/:runId/progress` — Polling endpoint for progress updates

📚 **[View Documentation](https://docs.calibr.lat)**

---

### 🛡️ Safety Guardrails (M1.6)

**Protect your business from pricing errors before they happen.**

Set intelligent boundaries on your automated pricing rules to prevent extreme changes, maintain profit margins, and control the pace of price adjustments.

**Key Capabilities:**

- **Price Floor Protection** — Never drop below your minimum acceptable price
- **Maximum Delta Limits** — Cap price increases and decreases by percentage
- **Velocity Controls** — Limit the number of price changes per day to avoid market disruption
- **Automatic Enforcement** — Guardrails are checked at rule execution time, blocking unsafe changes

**How It Works:**

Guardrails are defined at the project level and automatically enforced when pricing rules execute. If a proposed price change violates any guardrail policy, it's blocked and logged for review.

**Example Use Cases:**
- Prevent flash sales from dropping prices below cost
- Limit daily price changes to avoid customer confusion
- Cap promotional discounts at a maximum percentage
- Maintain minimum profit margins across all products

---

### 🤖 Copilot Simulation API (M1.9)

**Test pricing strategies with AI-powered simulations before going live.**

Our new Copilot Simulation API lets you run "what-if" scenarios on your pricing rules without affecting real products. Perfect for testing new strategies, training team members, or validating complex rule logic.

**Key Capabilities:**

- **AI-Powered Analysis** — Leverage GPT-4 to simulate pricing outcomes
- **Safe Testing Environment** — Run simulations without touching production data
- **Complete Audit Trail** — Every simulation is logged for compliance and review
- **Role-Based Access Control** — Restrict simulation access to EDITOR+ users

**What You Can Simulate:**
- Impact of new pricing rules before activation
- Effect of guardrail changes on existing rules
- Competitor-based pricing strategies
- Seasonal pricing adjustments

**API Endpoint:**
- `POST /api/v1/copilot/simulate` — Execute pricing simulations with full validation

**Security Features:**
- Zod schema validation for all payloads
- RBAC enforcement (EDITOR, ADMIN, OWNER roles)
- Comprehensive audit logging
- Isolated execution environment

---

### 💳 Stripe Integration

**Unify your pricing analytics across all sales channels.**

Connect your Stripe account to automatically sync products, prices, and transaction data into Calibrate. Get a complete view of your revenue and pricing performance across all channels.

**Key Capabilities:**

- **Automatic Product Sync** — Import all products from Stripe with one click
- **Price Synchronization** — Keep pricing data in sync across platforms
- **Transaction Analytics** — Import charges and payments for revenue insights
- **Real-Time Updates** — Webhook support for instant data synchronization
- **Secure Storage** — API keys encrypted at rest with enterprise-grade security

**Setup Process:**

1. Navigate to **Integrations > Stripe** in the console
2. Click **Connect** and enter your Stripe Restricted Key
3. Grant read permissions for Products, Prices, and Charges
4. Calibrate automatically syncs your data

**Supported Data:**
- Products and product metadata
- Prices and pricing tiers
- Charges and payment intents
- Subscription data (coming soon)

**API Endpoints:**
- `POST /api/integrations/stripe/connect` — Connect Stripe account
- `POST /api/integrations/stripe/sync/catalog` — Trigger manual catalog sync
- `POST /api/integrations/stripe/sync/transactions` — Sync transaction data
- `GET /api/projects/[slug]/transactions` — Fetch synced transactions

📚 **[View Integration Guide](docs/STRIPE_INTEGRATION.md)**

---

### 📊 Competitor Monitoring E2E (M0.6)

**Track competitor prices and automate your competitive strategy.**

Our complete competitor monitoring system gives you real-time insights into market pricing and enables automated rules based on competitive intelligence.

**Key Capabilities:**

- **Real-Time Price Tracking** — Monitor competitor prices across multiple channels
- **Market Position Insights** — See where you stand (lowest, highest, middle position)
- **Automated Pricing Rules** — Create rules that respond to competitor changes
- **Error Monitoring** — Alert system ensures <1% error rate with automatic notifications

**Three-Tab Interface:**

1. **Monitor Tab** — Add competitors, track products, start monitoring
2. **Analytics Tab** — Real-time price comparisons and market insights dashboard
3. **Rules Tab** — Create and manage automated pricing rules based on competitive data

**Alert Policies:**
- High error rate warning (>1% in 24h)
- Critical error rate alert (>5% in 24h)
- Consecutive failure detection (3+ failures)
- Stale data monitoring (>24h since last check)

**Analytics Features:**
- Per-SKU price comparisons with competitor breakdown
- Market position tracking with visual indicators
- Sale indicators and price spread analysis
- Historical trend analysis

**API Endpoints:**
- `GET /api/v1/competitors/analytics` — Get price comparisons and insights
- `POST /api/v1/competitors/monitor` — Start monitoring competitors
- `POST /api/v1/competitors/rules` — Create competitive pricing rules

---

## Improvements & Enhancements

### User Experience

- **Enhanced Status Indicators** — StatusPill component now supports all run statuses with WCAG AA compliant colors
- **Improved Error Handling** — Clear error messages with actionable retry options
- **Toast Notifications** — Real-time feedback for all major actions
- **Responsive Design** — Optimized for desktop and mobile devices

### Performance

- **Efficient Polling** — 2-second polling intervals for active runs with automatic cleanup
- **Optimized API Responses** — Cursor-based pagination for large datasets
- **Reduced Latency** — Faster data loading with improved caching

### Documentation

- **User Guides** — Comprehensive documentation for all new features
- **API Reference** — Complete endpoint documentation with examples
- **Best Practices** — Troubleshooting guides and recommended workflows

---

## Platform Updates

### Infrastructure

- **Railway API Deployment** — Production-ready API on Railway with PostgreSQL
- **Vercel Frontend** — Console, Site, and Docs deployed on Vercel
- **Custom Domains** — All services accessible via calibr.lat domains

### Security

- **Encrypted Key Storage** — All API keys encrypted at rest using AES-256-GCM
- **RBAC Enforcement** — Role-based access control across all endpoints
- **Audit Logging** — Complete audit trail for compliance

### Testing

- **Comprehensive Test Coverage** — 350+ automated tests across 14 packages
- **Type Safety** — 100% TypeScript type checking (13/13 packages)
- **CI/CD Pipeline** — Automated testing and deployment

---

## Getting Started

### New Users

1. **Sign Up** — Create your account at [console.calibr.lat](https://console.calibr.lat)
2. **Connect Platforms** — Link your Shopify, Stripe, or Amazon accounts
3. **Set Up Guardrails** — Define your safety policies
4. **Create Rules** — Build your first automated pricing rule
5. **Monitor Results** — Track executions in the Automation Runs dashboard

### Existing Users

All new features are automatically available in your account. Visit the **Automation Runs** page to start monitoring your pricing executions.

### Documentation

- **User Guides** — [docs.calibr.lat](https://docs.calibr.lat)
- **API Reference** — [docs.calibr.lat/api](https://docs.calibr.lat/api)
- **Integration Guides** — [docs.calibr.lat/console/integrations](https://docs.calibr.lat/console/integrations)

### Support

- **Email** — contact@calibr.lat
- **Documentation** — [docs.calibr.lat](https://docs.calibr.lat)
- **Status Page** — All services monitored 24/7

---

## What's Next

We're continuously improving Calibrate with new features and enhancements. Coming soon:

- **Inventory-Aware Pricing** — Dynamic pricing based on stock levels
- **A/B Testing Framework** — Experimentation mode for pricing strategies
- **Advanced Analytics** — Deeper insights into pricing performance
- **Additional Integrations** — More platform connectors

---

**Last Updated:** January 2025  
**Version:** v0.4.0-public-beta

For detailed technical changes, see [CHANGELOG.md](CHANGELOG.md)
