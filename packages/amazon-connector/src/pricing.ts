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

export interface FeedPollOptions {
  intervalMs?: number
  timeoutMs?: number
}

export interface FeedStatusResult {
  status: string
  feedId?: string
  resultDocumentId?: string
  done: boolean
}

export interface FeedParseSummary {
  ok: boolean
  totalResults?: number
  successCount?: number
  errorCount?: number
  warnings?: number
  rawSnippet?: string
  details?: Array<{ code: string; message?: string; sku?: string }>
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

// Poll feed status until DONE/ERROR or timeout
export async function pollFeedUntilDone(
  feedId: string,
  options: FeedPollOptions = {},
): Promise<FeedStatusResult> {
  const sp = createSpApiClient()
  if (!sp) {
    return { status: 'DRY_RUN', done: true }
  }
  const base = options.intervalMs ?? 1000
  const timeout = options.timeoutMs ?? 90_000
  const start = Date.now()
  let attempt = 0
  while (Date.now() - start < timeout) {
    const res = await (sp as any).callAPI({ operation: 'getFeed', path: { feedId } })
    const status = res?.processingStatus
    if (status === 'DONE' || status === 'CANCELLED' || status === 'FATAL') {
      return {
        status,
        feedId,
        resultDocumentId: res?.resultFeedDocumentId,
        done: true,
      }
    }
    // Exponential backoff with jitter
    const delay = Math.min(base * Math.pow(2, attempt++), 10_000)
    const jitter = Math.floor(Math.random() * 250)
    await new Promise((r) => setTimeout(r, delay + jitter))
  }
  return { status: 'TIMEOUT', feedId, done: false }
}

// Download and parse feed result document, returning a summary
export async function downloadAndParseFeedResult(
  feedDocumentId: string,
): Promise<FeedParseSummary> {
  const sp = createSpApiClient()
  if (!sp) {
    return { ok: true, rawSnippet: 'dry-run' }
  }
  const doc = await (sp as any).callAPI({
    operation: 'getFeedDocument',
    path: { feedDocumentId },
  })
  const url: string | undefined = doc?.url
  const compression: string | undefined = doc?.compressionAlgorithm
  if (!url) {
    return { ok: false }
  }
  const res = await fetch(url)
  if (!res.ok) {
    return { ok: false }
  }
  let body = await res.arrayBuffer()
  // Handle gzip if indicated
  if (compression && String(compression).toUpperCase().includes('GZIP')) {
    const zlib = await import('node:zlib')
    body = zlib.gunzipSync(Buffer.from(body)).buffer
  }
  const text = Buffer.from(body).toString('utf8')
  // Naive XML summary parsing (ProcessingReport)
  const successCount = (text.match(/<ResultCode>Success<\/ResultCode>/g) || []).length
  const errorCount = (text.match(/<ResultCode>Error<\/ResultCode>/g) || []).length
  const warningCount = (text.match(/<ResultCode>Warning<\/ResultCode>/g) || []).length
  const total = successCount + errorCount + warningCount
  const details: Array<{ code: string; message?: string; sku?: string }> = []
  const resultRegex = /<Result>([\s\S]*?)<\/Result>/g
  let m: RegExpExecArray | null
  while ((m = resultRegex.exec(text))) {
    const block = m[1]
    const codeMatch = block.match(/<ResultCode>(.*?)<\/ResultCode>/)
    const msgMatch = block.match(/<ResultMessage>([\s\S]*?)<\/ResultMessage>/)
    const skuMatch = block.match(/<SKU>(.*?)<\/SKU>/)
    if (codeMatch) {
      details.push({ code: codeMatch[1], message: msgMatch?.[1], sku: skuMatch?.[1] })
    }
  }
  return {
    ok: errorCount === 0,
    totalResults: total || undefined,
    successCount: successCount || undefined,
    errorCount: errorCount || undefined,
    warnings: warningCount || undefined,
    rawSnippet: text.slice(0, 300),
    details: details.length ? details : undefined,
  }
}
