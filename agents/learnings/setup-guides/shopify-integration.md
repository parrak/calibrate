# Shopify Integration Setup Guide

## Prerequisites

1. Shopify Partner account
2. Shopify app created in Partner Dashboard
3. API credentials (API Key, API Secret)

## Environment Variables

### API Service (`apps/api/.env.local`)

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_inventory,write_inventory
SHOPIFY_API_VERSION=2024-10
DATABASE_URL=postgresql://user:password@localhost:5432/calibr
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3001
```

### Console Service (`apps/console/.env.local`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/calibr
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## OAuth Redirect URI

In Shopify Partner Dashboard, set redirect URI to:
- Development: `http://localhost:3000/api/platforms/shopify/oauth/callback`
- Production: `https://api.calibr.lat/api/platforms/shopify/oauth/callback`

## Testing

1. Start API server: `cd apps/api && pnpm dev`
2. Start Console: `cd apps/console && pnpm dev`
3. Navigate to `/p/[slug]/integrations/shopify`
4. Click "Connect Shopify" button
5. Complete OAuth flow

## Common Issues

See `bug-fixes/shopify-oauth-cors.md` for OAuth and CORS troubleshooting.

