import type {
  PlatformConnector,
  ProductOperations,
  PricingOperations,
  AuthOperations,
  PlatformConfig,
  ProductLookupParams,
  Product,
  PriceUpdate,
  PriceUpdateResult,
  AuthCredentials,
  AuthStatus,
} from '@calibr/platform-connector'
import { createSpApiClient, loadConfigFromEnv } from './spapi-client'

export class AmazonConnector implements PlatformConnector {
  readonly key = 'amazon'

  constructor(private config?: PlatformConfig, private credentials?: AuthCredentials) {}

  products: ProductOperations = {
    getProductBySku: async (params: ProductLookupParams): Promise<Product | null> => {
      const sku = params.sku
      const cfg = loadConfigFromEnv()
      const marketplaceId = cfg.marketplaceId || 'ATVPDKIKX0DER'
      const sp = createSpApiClient()
      if (!sp) {
        return {
          id: `B${sku}`,
          sku,
          title: `Amazon Product ${sku}`,
          currency: 'USD',
          price: 0,
          marketplaceId,
          raw: { mode: 'dry-run' },
        }
      }
      // TODO: Use Catalog Items API to fetch product by SKU
      await new Promise((r) => setTimeout(r, 50))
      return {
        id: `B${sku}`,
        sku,
        title: `Amazon Product ${sku}`,
        currency: 'USD',
        price: 0,
        marketplaceId,
        raw: { mode: 'placeholder' },
      }
    },
  }

  pricing: PricingOperations = {
    applyPriceUpdate: async (update: PriceUpdate): Promise<PriceUpdateResult> => {
      // Delegate to local pricing util which handles dry-run vs real submission
      const { applyPriceChange } = await import('./pricing')
      const res = await applyPriceChange({
        skuCode: update.sku,
        currency: update.currency,
        amount: update.price,
      })
      return {
        ok: res.ok,
        message: res.message,
        platform: 'amazon',
        details: res.channelResult,
      }
    },
  }

  auth: AuthOperations = {
    getStatus: async (): Promise<AuthStatus> => {
      const cfg = loadConfigFromEnv()
      const hasLwa = Boolean(cfg.lwaClientId && cfg.lwaClientSecret && cfg.refreshToken)
      return {
        platform: 'amazon',
        connected: hasLwa,
        details: {
          marketplaceId: cfg.marketplaceId,
          region: cfg.region,
          mode: hasLwa ? 'live' : 'dry-run',
        },
      }
    },
    // Placeholder: full LWA auth flow handled via external route/UI
    connect: async (): Promise<AuthStatus> => this.auth.getStatus(),
    disconnect: async (): Promise<AuthStatus> => ({ platform: 'amazon', connected: false }),
  }
}
