# CALIBRATE — Architecture Reference

**For agent use.** This file defines the technical contracts agents build against.

---

## 1. SYSTEM LAYERS

```
┌─────────────────────────────────────────────────────────┐
│                      INTERFACES                          │
│   Console (Web)  │  API (REST)  │  Slack (Bot)  │ MCP*  │
└────────┬─────────┴──────┬───────┴───────┬───────┴───────┘
         │                │               │
┌────────▼────────────────▼───────────────▼───────────────┐
│                   MUTATION ENGINE                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Mutation     │ │  Policy      │ │  Approval        │ │
│  │  Manager      │ │  Engine      │ │  Router          │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────────┘ │
└─────────┼────────────────┼────────────────┼─────────────┘
          │                │                │
┌─────────▼────────────────▼────────────────▼─────────────┐
│                  DOMAIN HANDLERS                         │
│  ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐ │
│  │Discount │ │ Plan Price │ │ Pricing   │ │ [Future] │ │
│  │ Handler │ │  Handler   │ │(existing) │ │          │ │
│  └─────────┘ └────────────┘ └───────────┘ └──────────┘ │
└─────────┬───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                   EVIDENCE LAYER                         │
│  ┌───────────┐ ┌───────────────┐ ┌────────────────────┐ │
│  │ Explain   │ │ Audit Event   │ │ Outcome            │ │
│  │ Trace     │ │ Log (append)  │ │ Tracker            │ │
│  └───────────┘ └───────────────┘ └────────────────────┘ │
└─────────┬───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                    DATA LAYER                             │
│  PostgreSQL + Prisma │ RLS per tenant │ Event-sourced    │
└──────────────────────────────────────────────────────────┘

* MCP deferred until 10+ paying customers
```

---

## 2. MUTATION LIFECYCLE

```
PROPOSED → SIMULATING → EVALUATED → AWAITING_APPROVAL → APPROVED → EXECUTING → APPLIED → OBSERVING → COMPLETED
                                         │                                         │
                                    REJECTED                                  ROLLED_BACK
                                         │
                                      EXPIRED
```

Every transition emits an `AuditEvent`. No transitions skip steps.

---

## 3. DATABASE SCHEMA

### 3.1 Enums

```prisma
enum MutationStatus {
  PROPOSED
  SIMULATING
  EVALUATED
  AWAITING_APPROVAL
  APPROVED
  REJECTED
  EXECUTING
  APPLIED
  OBSERVING
  COMPLETED
  ROLLED_BACK
  EXPIRED
  FAILED
}

enum MutationDomain {
  DISCOUNT
  PLAN_PRICE
  PRICING        // existing, backward-compat
}

enum PolicyAction {
  ALLOW
  WARN
  REQUIRE_APPROVAL
  BLOCK
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum OutcomeStatus {
  AWAITING
  TRACKING
  COMPLETE
  REVIEWED
}
```

### 3.2 Core Tables

```prisma
model Mutation {
  id                String          @id @default(cuid())
  tenantId          String
  domain            MutationDomain
  type              String          // e.g. "discount_override", "plan_price_increase"
  status            MutationStatus  @default(PROPOSED)
  payload           Json            // domain-specific input
  simulationResult  Json?           // structural validation output
  policyResult      Json?           // aggregated policy evaluation
  rollbackPlan      Json?           // instructions to undo
  outcomeExpected   Json?           // what we think will happen
  outcomeActual     Json?           // what actually happened
  createdBy         String          // user, system, or agent ID
  appliedAt         DateTime?
  appliedBy         String?
  rolledBackAt      DateTime?
  rollbackReason    String?
  idempotencyKey    String?         @unique
  expiresAt         DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  items             MutationItem[]
  policyEvaluations PolicyEvaluation[]
  approvalSteps     ApprovalStep[]
  explainTraces     ExplainTrace[]
  auditEvents       AuditEvent[]
  outcomeMetrics    OutcomeMetric[]

  @@index([tenantId, status])
  @@index([tenantId, domain])
  @@index([tenantId, createdAt])
}

model MutationItem {
  id            String   @id @default(cuid())
  mutationId    String
  entityType    String   // "customer", "plan", "subscription"
  entityId      String   // external ID of the affected entity
  fieldName     String   // "discount_percent", "price", etc.
  beforeValue   Json?    // state before mutation
  afterValue    Json     // proposed state after mutation
  deltaValue    Json?    // computed change
  metadata      Json?    // domain-specific context
  createdAt     DateTime @default(now())

  mutation      Mutation @relation(fields: [mutationId], references: [id])

  @@index([mutationId])
}

model Policy {
  id          String       @id @default(cuid())
  tenantId    String
  domain      MutationDomain
  name        String       // "max_discount_auto_approve"
  description String?
  type        String       // "threshold", "role_gate", "time_window", "hard_block"
  config      Json         // { "threshold": 15, "action": "REQUIRE_APPROVAL", "approver_role": "finance" }
  priority    Int          @default(0) // higher = evaluated first
  active      Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  evaluations PolicyEvaluation[]

  @@index([tenantId, domain, active])
}

model PolicyEvaluation {
  id          String       @id @default(cuid())
  mutationId  String
  policyId    String
  action      PolicyAction // what the policy decided
  reason      String       // human-readable explanation
  inputs      Json?        // what data was evaluated
  createdAt   DateTime     @default(now())

  mutation    Mutation     @relation(fields: [mutationId], references: [id])
  policy      Policy       @relation(fields: [policyId], references: [id])

  @@index([mutationId])
}

model ApprovalStep {
  id          String         @id @default(cuid())
  mutationId  String
  stepOrder   Int            // 1, 2, 3...
  role        String         // "manager", "finance", "ceo"
  assignedTo  String?        // specific user ID, or null = any with role
  status      ApprovalStatus @default(PENDING)
  decidedBy   String?
  decidedAt   DateTime?
  decidedVia  String?        // "console", "slack", "api"
  reason      String?        // optional note from approver
  createdAt   DateTime       @default(now())

  mutation    Mutation       @relation(fields: [mutationId], references: [id])

  @@index([mutationId])
  @@unique([mutationId, stepOrder])
}

model ExplainTrace {
  id          String   @id @default(cuid())
  mutationId  String
  summary     String   // one-line: "22% discount requested. Policy allows 15% auto-approve."
  narrative   String   // full paragraph explanation
  factors     Json     // structured: [{ factor, weight, direction }]
  generatedAt DateTime @default(now())

  mutation    Mutation @relation(fields: [mutationId], references: [id])

  @@index([mutationId])
}

model AuditEvent {
  id          String   @id @default(cuid())
  tenantId    String
  mutationId  String?  // nullable for non-mutation events
  eventType   String   // "mutation.created", "mutation.approved", "policy.evaluated", etc.
  actor       String   // who triggered this
  actorType   String   // "user", "system", "agent", "slack"
  payload     Json     // event-specific data
  metadata    Json?    // IP, user agent, session ID
  createdAt   DateTime @default(now())

  mutation    Mutation? @relation(fields: [mutationId], references: [id])

  @@index([tenantId, createdAt])
  @@index([mutationId])
}

model OutcomeMetric {
  id              String        @id @default(cuid())
  mutationId      String
  metricName      String        // "deal_closed", "margin_actual", "retention_6mo", "expansion_seats"
  expectedValue   Json          // what simulation predicted
  actualValue     Json?         // what actually happened
  variance        Float?        // (actual - expected) / expected
  observedAt      DateTime?     // when actual was recorded
  observationStart DateTime
  observationEnd   DateTime
  status          OutcomeStatus @default(AWAITING)
  source          String?       // "stripe_webhook", "manual", "crm_sync"
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  mutation        Mutation      @relation(fields: [mutationId], references: [id])

  @@index([mutationId])
  @@index([status])
}
```

---

## 3.3 Domain Handler Interface

Every domain implements this interface:

```typescript
interface DomainHandler {
  domain: MutationDomain;

  /** Validate the payload is well-formed for this domain */
  validatePayload(payload: unknown): ValidationResult;

  /** Run structural simulation (NOT predictive forecasting) */
  simulate(mutation: Mutation, items: MutationItem[]): Promise<SimulationResult>;

  /** Generate human-readable explanation */
  explain(mutation: Mutation, simulation: SimulationResult): ExplainTrace;

  /** Execute the mutation (write changes) */
  apply(mutation: Mutation): Promise<ApplyResult>;

  /** Undo the mutation */
  rollback(mutation: Mutation): Promise<RollbackResult>;

  /** Define what outcome metrics to track */
  getOutcomeMetrics(mutation: Mutation): OutcomeMetricDefinition[];
}
```

**Discount handler example** (simulate):
```typescript
// Structural simulation — not predictive
simulate(mutation, items) {
  const discount = mutation.payload as DiscountPayload;
  const currentARR = discount.deal_value;
  const discountedARR = currentARR * (1 - discount.discount_percent / 100);
  const revenueDelta = discountedARR - currentARR;
  const marginBefore = discount.margin_percent;
  const marginAfter = marginBefore - (discount.discount_percent * marginBefore / 100);

  return {
    revenueDelta,
    marginBefore,
    marginAfter,
    arrExposure: Math.abs(revenueDelta),
    guardrailFlags: this.checkGuardrails(discount, marginAfter),
  };
}
```

---

## 4. API ROUTES

All routes are tenant-scoped via auth token.

### 4.1 Mutations
```
POST   /api/v1/mutations                    — Create mutation
GET    /api/v1/mutations                    — List (filter: status, domain, createdBy)
GET    /api/v1/mutations/:id                — Detail (includes items, evals, approvals, audit)
POST   /api/v1/mutations/:id/simulate       — Run simulation
POST   /api/v1/mutations/:id/evaluate       — Run policy checks
POST   /api/v1/mutations/:id/approve        — Approve (current step)
POST   /api/v1/mutations/:id/reject         — Reject (with reason)
POST   /api/v1/mutations/:id/apply          — Execute mutation
POST   /api/v1/mutations/:id/rollback       — Undo mutation
GET    /api/v1/mutations/:id/explain        — Get explain trace
GET    /api/v1/mutations/:id/audit          — Get audit trail
```

### 4.2 Policies
```
GET    /api/v1/policies                     — List active policies
POST   /api/v1/policies                     — Create policy
PUT    /api/v1/policies/:id                 — Update policy
DELETE /api/v1/policies/:id                 — Deactivate policy
```

### 4.3 Outcomes
```
GET    /api/v1/outcomes                     — List outcomes (filter: status, mutationId)
POST   /api/v1/outcomes/:mutationId/record  — Record actual outcome data
GET    /api/v1/outcomes/:mutationId         — Get outcome detail
GET    /api/v1/outcomes/dashboard            — Aggregate: active, complete, variance stats
GET    /api/v1/outcomes/performance          — By approver/rep
```

### 4.4 Webhooks
```
POST   /api/v1/webhooks/slack/actions       — Slack interactive callback
POST   /api/v1/webhooks/outcomes            — External outcome data ingestion
```

---

## 5. NAMING CONVENTIONS

| Concept | DB column/table | API field | Console label | Notes |
|---------|----------------|-----------|---------------|-------|
| Governed action | `mutation` | `mutation` | "Change Request" | Internal = mutation, external-facing = "change request" |
| Revenue impact | `simulation_result` | `simulation` | "Impact Analysis" | |
| Guardrail check | `policy_evaluation` | `evaluation` | "Policy Check" | |
| Explain | `explain_trace` | `explain` | "Why" | |
| Outcome | `outcome_metric` | `outcome` | "Results" | |

---

## 6. TECH STACK (Unchanged)

- **Runtime**: Node.js + TypeScript
- **API**: Next.js API routes (apps/api on Railway)
- **Console**: Next.js (apps/console on Vercel)
- **Database**: PostgreSQL on Railway
- **ORM**: Prisma
- **Auth**: Scoped JWT + HMAC signatures
- **Monorepo**: Turborepo + pnpm
- **CI/CD**: GitHub Actions
- **Hosting**: Railway (API, DB), Vercel (Console, Docs)
