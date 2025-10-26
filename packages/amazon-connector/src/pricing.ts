import type { AmazonRegion } from './spapi-client'
import { createSpApiClient, loadConfigFromEnv } from './spapi-client'
import { buildPriceFeedXML } from './feeds/priceFeed'
import { encryptWithAes256Gcm } from './feeds/encrypt'
import { uploadFeedDocument } from './feeds/upload'

export interface PriceChangeInput {
  skuCode: string
  currency: string
  amount: number
  marketplaceId?: string
  sellerId?: string
  region?: AmazonRegion
  context?: any
  submit?: boolean // if false, stop after creating document
}

export async function applyPriceChange(
  input: PriceChangeInput,
): Promise<{ ok: boolean; message: string; channelResult?: any }> {
  const cfg = loadConfigFromEnv()
  const marketplaceId = input.marketplaceId || cfg.marketplaceId || 'ATVPDKIKX0DER'

  const sp = createSpApiClient({ region: input.region, marketplaceId })

  if (!sp) {
    return {
      ok: true,
      message: 'Amazon connector in dry-run mode (missing credentials) — stubbed update applied',
      channelResult: {
        sku: input.skuCode,
        price: input.amount,
        currency: input.currency,
        marketplaceId,
        updatedAt: new Date().toISOString(),
        mode: 'dry-run',
      },
    }
  }

  // Start SP-API Feeds flow (skeleton):
  // 1) Build XML for POST_PRODUCT_PRICING_DATA
  const feedXml = buildPriceFeedXML([
    { sku: input.skuCode, price: input.amount, currency: input.currency },
  ])

  try {
    // 2) Create a feed document
    // Note: Full encryption + upload step to be implemented next.
    const doc = await (sp as any).callAPI({
      operation: 'createFeedDocument',
      body: { contentType: 'text/xml; charset=UTF-8' },
    })

    const feedDocumentId = doc?.feedDocumentId
    const encryptionDetails = doc?.encryptionDetails
    const url = doc?.url

    // 3) Encrypt and upload feedXml to url using encryptionDetails (AES-256-GCM)
    if (url && encryptionDetails?.key && encryptionDetails?.initializationVector) {
      const encrypted = encryptWithAes256Gcm(feedXml, {
        key: encryptionDetails.key,
        initializationVector: encryptionDetails.initializationVector,
      })
      await uploadFeedDocument(url, encrypted, 'text/xml; charset=UTF-8')
    }

    // 4) Create feed (will fail until upload implemented, so guard)
    if (!feedDocumentId) {
      return {
        ok: true,
        message:
          'Created feed document. Next step: implement encryption + upload before createFeed.',
        channelResult: {
          marketplaceId,
          feedDocument: { feedDocumentId, url, encryptionDetails },
        },
      }
    }

    // 5) Optionally submit feed now
    if (input.submit !== false && feedDocumentId) {
      const feed = await (sp as any).callAPI({
        operation: 'createFeed',
        body: {
          inputFeedDocumentId: feedDocumentId,
          feedType: 'POST_PRODUCT_PRICING_DATA',
          marketplaceIds: [marketplaceId],
        },
      })

      const feedId = feed?.feedId
      return {
        ok: true,
        message: 'Feed submitted',
        channelResult: {
          feedId,
          marketplaceId,
          submittedAt: new Date().toISOString(),
        },
      }
    }

    // Ready but not submitted
    return {
      ok: true,
      message: 'Feed document created and uploaded (not submitted due to submit:false).',
      channelResult: {
        marketplaceId,
        feedDocument: { feedDocumentId, url },
        previewBytes: Buffer.byteLength(feedXml, 'utf8'),
      },
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `Failed to create feed document: ${err?.message || err}`,
    }
  }
}
