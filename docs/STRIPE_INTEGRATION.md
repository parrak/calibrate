# Stripe Integration

## Overview
The Stripe integration allows Calibrate to sync products, prices, and transactions from connected Stripe accounts. This enables unified analytics and pricing optimization across sales channels.

## Features
- **OAuth Connection**: Securely connect Stripe accounts via OAuth.
- **Product Sync**: Automatically import products from Stripe.
- **Price Sync**: Sync pricing data and map to Calibrate SKUs.
- **Transaction Sync**: Import charges and payments for revenue analytics.
- **Webhooks**: Real-time updates for product and price changes.

## Setup
1. **Environment Variables**:
   Ensure the following variables are set in `.env`:
   - `STRIPE_CLIENT_ID`
   - `STRIPE_CLIENT_SECRET`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_CONNECT_ENABLED=true`

2. **Stripe Dashboard**:
   - Enable Connect in your Stripe Dashboard.
   - Add the redirect URI: `https://<your-domain>/api/integrations/stripe/oauth/callback`

## Architecture
- **StripeService**: Handles API interactions using the `stripe` Node.js SDK.
- **StripeSync**: Manages data synchronization logic (Catalog, Transactions).
- **Webhooks**: Listens for `product.*`, `price.*`, and `charge.*` events.

## API Endpoints
- `GET /api/integrations/stripe/oauth/start`: Initiate OAuth flow.
- `GET /api/integrations/stripe/oauth/callback`: Handle OAuth redirect.
- `POST /api/integrations/stripe/disconnect`: Disconnect account.
- `POST /api/integrations/stripe/webhook`: Handle Stripe webhooks.
- `POST /api/integrations/stripe/sync/catalog`: Trigger manual catalog sync.
- `POST /api/integrations/stripe/sync/transactions`: Trigger manual transaction sync.

## Data Model
- `StripeAccount`: Stores OAuth tokens and account status.
- `StripeProductMap`: Maps Stripe Products to Calibrate Products.
- `StripePriceMap`: Maps Stripe Prices to Calibrate Prices.
- `Transaction`: Unified transaction record linked to Source (Stripe).
