import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pollFeedUntilDone, downloadAndParseFeedResult } from '../src/pricing'

// Mock spapi client creation to supply a fake client for tests
vi.mock('../src/spapi-client', async () => {
  const mod = await vi.importActual<any>('../src/spapi-client')
  return {
    ...mod,
    createSpApiClient: vi.fn(() => ({
      callAPI: vi.fn(async (req: any) => {
        if (req.operation === 'getFeed') {
          // Return DONE immediately with a fake result document id
          return { processingStatus: 'DONE', resultFeedDocumentId: 'DOC123' }
        }
        if (req.operation === 'getFeedDocument') {
          return { url: 'https://example.com/result.xml' }
        }
        return {}
      }),
    })),
  }
})

describe('feed polling and parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('pollFeedUntilDone returns DONE with document id', async () => {
    const res = await pollFeedUntilDone('FEED123', { intervalMs: 1, timeoutMs: 1000 })
    expect(res.done).toBe(true)
    expect(res.status).toBe('DONE')
    expect(res.resultDocumentId).toBe('DOC123')
  })

  it('downloadAndParseFeedResult parses simple processing report', async () => {
    // Mock global fetch to return a simple processing report xml
    const xml = `<?xml version="1.0"?><AmazonEnvelope><MessageType>ProcessingReport</MessageType><Message><ProcessingReport><StatusCode>Complete</StatusCode><ProcessingSummary><MessagesProcessed>1</MessagesProcessed></ProcessingSummary><Result><ResultCode>Success</ResultCode></Result></ProcessingReport></Message></AmazonEnvelope>`
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from(xml, 'utf8'),
    } as any)

    const parsed = await downloadAndParseFeedResult('DOC123')
    expect(parsed.ok).toBe(true)
    expect(parsed.successCount).toBe(1)
    expect(parsed.errorCount || 0).toBe(0)
    expect(parsed.rawSnippet).toBeDefined()
    fetchMock.mockRestore()
  })
})

