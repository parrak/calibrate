# Stripe Integration

## Overview
The Stripe integration allows Calibrate to sync products, prices, and transactions from connected Stripe accounts. This enables unified analytics and pricing optimization across sales channels.

## Integration Model: Direct API Key
Calibrate currently uses a **Direct API Key** integration model (often referred to as a "Private App" or "Private Integration").
- **Mechanism**: Users provide a Stripe **Secret Key** (or Restricted Key) directly in the Calibrate UI.
- **Storage**: Keys are encrypted at rest using `@calibr/security`.
- **Usage**: Calibrate acts as an API client on behalf of the user to fetch data.

## Features
- **Secure Connection**: Encrypted storage of Stripe API Keys.
- **Product Sync**: Automatically import products from Stripe.
- **Price Sync**: Sync pricing data and map to Calibrate SKUs.
- **Transaction Sync**: Import charges and payments for revenue analytics.
- **Webhooks**: Real-time updates for product and price changes.

## Setup
1. **Environment Variables**:
   - `STRIPE_WEBHOOK_SECRET`: Secret for verifying webhook signatures.
   - `ENCRYPTION_KEY`: Used for encrypting stored API keys.

2. **User Configuration**:
   - Users navigate to **Integrations > Stripe**.
   - Click **Connect**.
   - Enter a **Restricted Key** with the following permissions:
     - `Products`: Read
     - `Prices`: Read
     - `Charges`: Read
     - `PaymentIntents`: Read

## Architecture
- **StripeService**: Handles API interactions. Instantiated dynamically with the decrypted user key.
- **StripeSync**: Manages data synchronization logic (Catalog, Transactions).
- **Webhooks**: Listens for `product.*`, `price.*`, and `charge.*` events.

## API Endpoints
- `POST /api/integrations/stripe/connect`: Submit API Key for validation and storage.
- `POST /api/integrations/stripe/disconnect`: Remove stored key.
- `POST /api/integrations/stripe/webhook`: Handle Stripe webhooks.
- `POST /api/integrations/stripe/sync/catalog`: Trigger manual catalog sync.
- `POST /api/integrations/stripe/sync/transactions`: Trigger manual transaction sync.
- `GET /api/projects/[slug]/transactions`: Fetch synced transactions.

## Data Model
- `StripeAccount`: Stores encrypted `secretKey` and account details.
- `StripeProductMap`: Maps Stripe Products to Calibrate Products.
- `StripePriceMap`: Maps Stripe Prices to Calibrate Prices.
- `Transaction`: Unified transaction record linked to Source (Stripe).

## Future Roadmap: Stripe App Transition
We plan to eventually transition this integration to a formal **Stripe App** (Backend-only or Full-stack).
- **Goal**: Distribute via Stripe App Marketplace and use the Stripe Apps permission model.
- **Changes Required**:
  1. Create `stripe-app.json` manifest.
  2. Implement Stripe Apps authentication (OAuth or App-specific tokens).
  3. Migrate existing API Key users to the new app installation flow.
  4. Potentially add UI extensions in the Stripe Dashboard.
