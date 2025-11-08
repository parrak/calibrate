# Stripe Integration Plan (Conditional, Post-Validation)

> This plan activates only if `/agents/docs/_EXECUTION_PACKET_V2/03_VALIDATION_PLAN.md` "Go" threshold is met.

## Objectives

1) OAuth (Connect Standard)  

2) Catalog sync (Products/Prices)  

3) Transactions ingest (PaymentIntents/Charges + BalanceTransactions → fees/net)  

4) Analytics overlay & source filters  

5) Optional catalog write (post-read maturity)

## Data Model Additions

- `StripeAccount(projectId, stripeAccountId, livemode, status, createdAt)`

- `ConnectorSyncState(projectId, source, cursor json)`

- `StripeWebhookEvent(id, type, payloadHash, processedAt, status)`

- `StripeProductMap(projectId, stripeProductId → Product.id)`

- `StripePriceMap(projectId, stripePriceId → Price.id)`

- `Transaction(projectId, source, externalId, amount, currency, status, feeAmount, netAmount, productId?, skuId?, createdAt)`

Reuse `Event`: `stripe.sync.started`, `stripe.webhook.received`, `transaction.created`.

## API Endpoints

**OAuth**

- `GET /api/integrations/stripe/oauth/start`

- `GET /api/integrations/stripe/oauth/callback`

- `POST /api/integrations/stripe/disconnect`

**Webhooks**

- `POST /api/integrations/stripe/webhook` (verify signing secret; idempotent by event id + payload hash)

**Sync Jobs**

- `POST /api/integrations/stripe/sync/catalog`

- `POST /api/integrations/stripe/sync/transactions?since=…`

**Optional Write**

- `POST /api/integrations/stripe/products`

- `POST /api/integrations/stripe/prices`

## Console UI

- **Settings → Connectors**: connect/disconnect, last sync, health

- **Transactions**: table with gross/fees/net, SKU mapping status

- **Analytics Overview**: adds Stripe totals and source filter chips

- **Catalog**: badges and mismatch hints

## Processing Rules

- Use `Stripe-Account` header per connected account

- Verified webhooks; idempotent handlers

- Backfills via `ConnectorSyncState.cursor` pagination

- Map Stripe Product/Price to internal entities first; then attach `Transaction` rows

## Security & Compliance

- PCI: **read-only**, never store card data

- Secrets: `STRIPE_CLIENT_ID`, `STRIPE_CLIENT_SECRET`, `STRIPE_WEBHOOK_SECRET`

- Feature flag: `STRIPE_CONNECT_ENABLED`

## Work Split

- **Platform**: OAuth config, secret mgmt, webhook signature verify, job queue, observability (`stripe.*` events)

- **Connectors**: OAuth routes, webhook handler, mappers + sync jobs, UI in Connectors/Transactions

- **Copilot & Analytics**: Merge `Transaction` into analytics, conversion curves, rationale cites Stripe

## Acceptance (Stripe MVP Done)

- Connect/disconnect works; catalog visible; transactions streaming

- Webhooks verified & idempotent; backfill handles ≥10k rows

- Analytics shows Stripe totals; source filters function

- Docs include **10-minute Stripe Quickstart**

