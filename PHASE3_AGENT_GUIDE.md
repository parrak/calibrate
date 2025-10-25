# Phase 3: Agent Quick Start Guide

**Purpose:** Fast onboarding for the three agents working on Phase 3
**Read Time:** 5 minutes
**Phase Duration:** 2-3 weeks

---

## 🎯 Your Mission

You are one of three agents working in parallel to build **Platform Integrations** for the Calibrate smart pricing platform. Your job is to build your assigned connector package **independently** while coordinating async with the other two agents.

---

## 👥 Team Structure

```
Phase 3 Team (3 Agents, Parallel Development)
├── Agent A → Shopify Connector
├── Agent B → Amazon Connector
└── Agent C → Platform Abstraction
```

**Key Point:** You can work completely independently. No blocking dependencies between agents during development.

---

## 📦 Agent A: Shopify Connector

### Your Package
`packages/shopify-connector`

### Your Branch
`feature/phase3-shopify-connector`

### Your Mission
Build a complete Shopify Admin API integration that allows Calibrate to:
- Authenticate with Shopify stores via OAuth
- Read product and variant data
- Update prices via GraphQL mutations
- Subscribe to webhooks for inventory changes

### Quick Start

1. **Create your branch:**
```bash
git checkout master
git pull origin master
git checkout -b feature/phase3-shopify-connector
```

2. **Read your detailed spec:**
   - Open [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md)
   - Go to "Workstream A: Shopify Connector" section
   - Review all deliverables and technical requirements

3. **Set up your package:**
```bash
mkdir -p packages/shopify-connector/src
mkdir -p packages/shopify-connector/tests
cd packages/shopify-connector
pnpm init
```

4. **Key interfaces to implement** (will be defined by Agent C on Day 1-2):
   - `PlatformConnector` interface
   - `ProductOperations` interface
   - `PricingOperations` interface
   - `AuthOperations` interface

5. **Daily coordination:**
   - Update [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md) at end of each day
   - Check what Agent C posts about interfaces
   - Answer questions from Agent B or C

### Your Deliverables

**Code:**
- [ ] Shopify OAuth client
- [ ] Product read/write operations
- [ ] GraphQL price update mutations
- [ ] Webhook signature verification
- [ ] Full test coverage

**Database:**
- [ ] `ShopifyIntegration` model
- [ ] `ShopifyWebhookSubscription` model
- [ ] Migration files

**API Routes:**
- [ ] `/api/integrations/shopify/oauth`
- [ ] `/api/integrations/shopify/webhooks`
- [ ] `/api/integrations/shopify/sync`

**UI:**
- [ ] Integration settings page
- [ ] OAuth flow components
- [ ] Sync status display

**Docs:**
- [ ] `packages/shopify-connector/README.md`
- [ ] Setup and configuration guide

### Success Criteria
✅ Can connect to a Shopify dev store
✅ Can read products via Admin API
✅ Can update prices via GraphQL
✅ Webhooks are received and verified
✅ All tests pass

### Resources
- [Shopify Admin API Docs](https://shopify.dev/docs/api/admin)
- [Shopify OAuth Guide](https://shopify.dev/docs/apps/auth/oauth)
- Your spec: PHASE3_ROADMAP.md → Workstream A

---

## 📦 Agent B: Amazon Connector

### Your Package
`packages/amazon-connector`

### Your Branch
`feature/phase3-amazon-connector`

### Your Mission
Build an Amazon SP-API integration that allows Calibrate to:
- Authenticate with Amazon Seller Central via LWA
- Read product catalog and pricing
- Submit price update feeds
- Retrieve competitive pricing data

### Quick Start

1. **Create your branch:**
```bash
git checkout master
git pull origin master
git checkout -b feature/phase3-amazon-connector
```

2. **Read your detailed spec:**
   - Open [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md)
   - Go to "Workstream B: Amazon Connector" section
   - Review all deliverables and technical requirements

3. **Set up your package:**
```bash
mkdir -p packages/amazon-connector/src
mkdir -p packages/amazon-connector/tests
cd packages/amazon-connector
pnpm init
```

4. **Key interfaces to implement** (will be defined by Agent C on Day 1-2):
   - `PlatformConnector` interface
   - `ProductOperations` interface
   - `PricingOperations` interface
   - `AuthOperations` interface

5. **Daily coordination:**
   - Update [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md) at end of each day
   - Check what Agent C posts about interfaces
   - Answer questions from Agent A or C

### Your Deliverables

**Code:**
- [ ] SP-API client with LWA auth
- [ ] Catalog Items API integration
- [ ] Product Pricing API integration
- [ ] Feeds API for price updates
- [ ] Competitive pricing data retrieval
- [ ] Full test coverage

**Database:**
- [ ] `AmazonIntegration` model
- [ ] `AmazonPriceFeed` model
- [ ] Migration files

**API Routes:**
- [ ] `/api/integrations/amazon/auth`
- [ ] `/api/integrations/amazon/catalog`
- [ ] `/api/integrations/amazon/pricing`

**UI:**
- [ ] Integration settings page
- [ ] LWA credential form
- [ ] Feed status monitor

**Docs:**
- [ ] `packages/amazon-connector/README.md`
- [ ] SP-API app registration guide

### Success Criteria
✅ LWA authentication works
✅ Can retrieve product catalog
✅ Can submit price update feeds
✅ Can poll feed processing status
✅ All tests pass

### Resources
- [Amazon SP-API Docs](https://developer-docs.amazon.com/sp-api/)
- [LWA Documentation](https://developer.amazon.com/docs/login-with-amazon/documentation-overview.html)
- Your spec: PHASE3_ROADMAP.md → Workstream B

---

## 📦 Agent C: Platform Abstraction

### Your Package
`packages/platform-connector`

### Your Branch
`feature/phase3-platform-abstraction`

### Your Mission
Build the foundation that Shopify and Amazon connectors will implement:
- Define standard interfaces for all platform connectors
- Create a registry for managing platform connections
- Build generic API routes
- Create reusable UI components

**IMPORTANT:** You are the architect. Agent A and B will implement your interfaces, so you must define them early (Day 1-3).

### Quick Start

1. **Create your branch:**
```bash
git checkout master
git pull origin master
git checkout -b feature/phase3-platform-abstraction
```

2. **Read your detailed spec:**
   - Open [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md)
   - Go to "Workstream C: Platform Abstraction Layer" section
   - Review all deliverables and technical requirements

3. **Set up your package:**
```bash
mkdir -p packages/platform-connector/src/{types,interfaces,registry,utils}
mkdir -p packages/platform-connector/tests
cd packages/platform-connector
pnpm init
```

4. **PRIORITY TASK (Day 1-2):**
   Define and publish interfaces so Agent A and B can start implementing:
   - `PlatformConnector` interface
   - `ProductOperations` interface
   - `PricingOperations` interface
   - `AuthOperations` interface

5. **Daily coordination:**
   - Update [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md) at end of each day
   - Post interface definitions for Agent A & B to review
   - Answer questions about interfaces and architecture

### Your Deliverables

**Code:**
- [ ] Base type definitions
- [ ] Platform connector interfaces
- [ ] Connector registry
- [ ] Connector factory
- [ ] Data normalization utilities
- [ ] Full test coverage

**Database:**
- [ ] `PlatformIntegration` model
- [ ] `PlatformSyncLog` model
- [ ] Migration files

**API Routes:**
- [ ] `/api/platforms` (list all)
- [ ] `/api/platforms/[platform]/connect`
- [ ] `/api/platforms/[platform]/status`
- [ ] `/api/platforms/[platform]/sync`

**UI:**
- [ ] `PlatformCard` component
- [ ] `PlatformList` component
- [ ] `ConnectionStatus` component
- [ ] Main integrations dashboard

**Docs:**
- [ ] `packages/platform-connector/README.md`
- [ ] Interface documentation
- [ ] "How to add a new platform" guide

### Success Criteria
✅ Clean, well-documented interfaces
✅ Registry can register/retrieve connectors
✅ Normalization utilities work
✅ Generic API routes handle all platforms
✅ UI components are platform-agnostic
✅ All tests pass

### Resources
- Design patterns: Factory, Strategy, Repository
- Your spec: PHASE3_ROADMAP.md → Workstream C

---

## 🔄 How We Work Together

### Week 1: Foundation

**Day 1-2: Interface Definition (CRITICAL)**
- **Agent C**: Define and propose interfaces
- **Agent A & B**: Review interfaces, provide feedback
- **All**: Discuss and agree on final interface design

**Day 3: Interface Lock-Down**
- **All agents**: Agree on final interfaces
- **Agent C**: Publish locked interfaces
- **Agent A & B**: Begin implementation against interfaces

**Day 4-5: Independent Development**
- **All agents**: Work independently on your packages
- **All agents**: Daily updates in PHASE3_DAILY_LOG.md

### Week 2: Implementation & Integration

**Day 6-10:**
- Continue independent development
- Begin integration testing
- Help each other with questions

**Day 10: Mid-phase checkpoint**
- All agents: Verify basic integration works
- Test that connectors implement interfaces correctly

### Week 3: Polish & Merge

**Day 11-14:**
- Bug fixes and polish
- Complete documentation
- Prepare for merge

**Day 15-17:**
- Merge all three workstreams
- Final integration testing
- Deploy to staging

---

## 📋 Daily Workflow

### Every Day:

1. **Start:** Pull latest from master
   ```bash
   git checkout master
   git pull origin master
   git checkout your-feature-branch
   git merge master  # Keep your branch up to date
   ```

2. **Work:** Build your assigned features
   - Write code
   - Write tests (aim for 95%+ coverage)
   - Run tests: `pnpm test`

3. **Coordinate:** Check PHASE3_DAILY_LOG.md
   - Read updates from other agents
   - Answer any questions directed at you
   - Note any blockers or interface changes

4. **End:** Update PHASE3_DAILY_LOG.md
   - Post what you completed
   - Post what's blocking you
   - Post your plan for tomorrow
   - Ask questions if needed

5. **Commit:** Save your progress
   ```bash
   git add .
   git commit -m "feat(phase3): [what you did]"
   git push origin your-feature-branch
   ```

---

## 🚫 Blockers & How to Handle Them

### If You're Blocked:

1. **Post immediately** in PHASE3_DAILY_LOG.md
2. **Tag the agent** who can unblock you
3. **Propose a workaround** you can do in the meantime
4. **Continue with other tasks** while waiting

### Common Blockers:

**"I need the interfaces from Agent C"**
- **Timeline:** Agent C will publish by Day 2-3
- **Workaround:** Set up package structure, write tests, read docs

**"I need to know how Agent A/B does X"**
- **Post question** in daily log
- **Check their code** if their branch is pushed
- **Propose your approach** and ask for validation

**"The interface doesn't support my use case"**
- **Post specific issue** with example
- **Propose interface change** with reasoning
- **Wait for agreement** from all three agents before changing

---

## ✅ Quality Checklist

Before merging your branch, ensure:

### Code Quality
- [ ] All tests pass: `pnpm test`
- [ ] 95%+ test coverage
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Code is well-commented

### Functionality
- [ ] Implements all required interfaces
- [ ] Handles errors gracefully
- [ ] Has proper loading states
- [ ] Has proper error messages

### Database
- [ ] Migration files created
- [ ] Seed data updated (if needed)
- [ ] No breaking changes to existing models

### Documentation
- [ ] README.md in your package
- [ ] API endpoints documented
- [ ] Setup/config guide written
- [ ] Code comments for complex logic

### Integration
- [ ] Works with platform abstraction layer
- [ ] API routes follow conventions
- [ ] UI follows design system
- [ ] Tested end-to-end

---

## 📞 Communication

### Where to Communicate

**Primary:** [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md)
- Daily updates
- Questions
- Blockers
- Decisions

**Code:** GitHub branches
- Push frequently
- Commit messages are clear
- Reference issues/tasks

### Response Time Expectations

- **Blocking question:** 4 hours
- **General question:** 24 hours
- **Interface change:** Must be discussed and agreed

### When to Escalate

If blocked for >24 hours:
1. Post clearly in daily log
2. Propose alternative approach
3. Tag the human project owner

---

## 🎯 Success Metrics

### Individual Success
- ✅ Your package is complete and tested
- ✅ Implements all required interfaces
- ✅ Documentation is comprehensive
- ✅ All quality checks pass

### Team Success
- ✅ All three packages integrate correctly
- ✅ End-to-end price update flow works
- ✅ UI shows all platforms
- ✅ Ready to merge to master

---

## 📚 Key Documents

**Read These First:**
1. [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md) - Complete roadmap and your detailed spec
2. [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md) - Daily coordination
3. [CURRENT_STATUS.md](CURRENT_STATUS.md) - Current system state

**Reference:**
- [README.md](README.md) - Project overview
- [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md) - What we just finished

**When You Need Help:**
- Your workstream section in PHASE3_ROADMAP.md
- Example: Phase 2 implementation (packages/competitor-monitoring)
- Ask questions in PHASE3_DAILY_LOG.md

---

## 🚀 Ready to Start?

### Pre-flight Checklist:

- [ ] Read PHASE3_ROADMAP.md (your workstream section)
- [ ] Read this guide completely
- [ ] Created your feature branch
- [ ] Set up your package directory
- [ ] Understand your deliverables
- [ ] Know where to post updates (PHASE3_DAILY_LOG.md)
- [ ] Installed dependencies: `pnpm install`
- [ ] Verified you can run tests: `pnpm test`

### Your First Tasks:

**Agent A & B:**
1. Set up package structure
2. Wait for Agent C's interface definitions (Day 1-2)
3. Review and provide feedback on interfaces
4. Start implementing once interfaces are locked

**Agent C:**
1. Define base interfaces (Priority!)
2. Post interfaces in PHASE3_DAILY_LOG.md
3. Get feedback from Agent A & B
4. Lock interfaces by Day 3
5. Continue with registry and API routes

---

## 🎉 Let's Build This!

You're part of a **parallel development experiment**. Each of you is building a critical piece of the platform independently. When all three pieces come together, Calibrate will be able to automate pricing across Shopify, Amazon, and any future platform.

**Remember:**
- Work independently
- Communicate daily
- Help each other
- Stay focused on your deliverables

**Good luck! 🚀**

---

**Questions?** Post in [PHASE3_DAILY_LOG.md](PHASE3_DAILY_LOG.md)
**Blocked?** Post immediately in daily log with details
**Need human help?** Tag the project owner in daily log

---

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
