Amazon Connector (SP-API)

Overview
- Provides Amazon Selling Partner API integration with LWA auth.
- Supports catalog retrieval, competitive pricing, and price update feeds.

Setup
- Create an SP-API application and obtain LWA credentials.
- Configure environment variables:
  - AMAZON_CLIENT_ID
  - AMAZON_CLIENT_SECRET
  - AMAZON_REFRESH_TOKEN (after LWA consent)
  - AMAZON_SELLER_ID
  - AMAZON_MARKETPLACE_ID (e.g. ATVPDKIKX0DER)
  - AMAZON_REGION (na | eu | fe)
  - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  - AWS_SELLING_PARTNER_ROLE (if using role-based auth)

Usage
```ts
import { applyPriceChange } from '@calibr/amazon-connector'

await applyPriceChange({
  skuCode: 'SKU123',
  currency: 'USD',
  amount: 19.99,
})
```

Notes
- Without credentials, the connector runs in dry-run mode and returns a stubbed result.
- Once credentials are set, implement Feeds API submission in `src/pricing.ts`.

