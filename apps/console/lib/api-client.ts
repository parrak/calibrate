/**
 * API Client for Calibr Console
 * Communicates with the Calibr API backend
 *
 * 📚 API Documentation: https://docs.calibr.lat
 * 🔗 Base URL: https://api.calibr.lat
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.error || `API error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

// Price Changes API
export const priceChangesApi = {
  list: async (projectSlug: string, token?: string): Promise<Array<Record<string, unknown>>> => {
    // API returns shape: { items: [...] }
    const res = await fetchApi<{ items?: Array<Record<string, unknown>> }>(`/api/v1/price-changes?project=${projectSlug}`, {
      token,
    })
    return Array.isArray(res?.items) ? res.items : []
  },

  approve: async (id: string, token?: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/approve`, {
      method: 'POST',
      token,
    })
  },

  reject: async (id: string, token?: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/reject`, {
      method: 'POST',
      token,
    })
  },

  apply: async (id: string, token?: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/apply`, {
      method: 'POST',
      token,
    })
  },
}

// Catalog API
export const catalogApi = {
  getProduct: async (productCode: string) => {
    return fetchApi<Record<string, unknown>>(`/api/v1/catalog?productCode=${productCode}`)
  },

  listProducts: async (projectSlug: string): Promise<Array<Record<string, unknown>>> => {
    // API expects `project` and returns { products: [{ product: {code,name}, skus: [...] }, ...] }
    const res = await fetchApi<{ products?: Array<{ product: { code: string; name: string }; skus: Array<Record<string, unknown>> }> }>(
      `/api/v1/catalog?project=${projectSlug}`
    )
    const products = Array.isArray(res?.products) ? res.products : []
    // Normalize to [{ code, name, skus }]
    return products.map((p) => ({ code: p.product.code, name: p.product.name, skus: p.skus }))
  },
}

// Competitors API
export const competitorsApi = {
  list: async (projectSlug: string): Promise<Array<Record<string, unknown>>> => {
    const res = await fetchApi<{ competitors: Array<Record<string, unknown>> }>(`/api/v1/competitors?projectSlug=${projectSlug}`)
    return res.competitors || []
  },

  get: async (id: string) => {
    const res = await fetchApi<{ competitor: Record<string, unknown> }>(`/api/v1/competitors/${id}`)
    return res.competitor
  },

  getProducts: async (id: string) => {
    const res = await fetchApi<{ products: Array<Record<string, unknown>> }>(`/api/v1/competitors/${id}/products`)
    return res.products || []
  },

  monitor: async (id: string, projectSlug?: string): Promise<Record<string, unknown>> => {
    const body: Record<string, string> = {}
    if (id) {
      body.competitorId = id
    }
    if (projectSlug) {
      body.projectSlug = projectSlug
    }

    const res = await fetchApi<{ results: Array<Record<string, unknown>> }>(`/api/v1/competitors/monitor`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return { results: res.results || [] }
  },

  getRules: async (projectSlug: string): Promise<Array<Record<string, unknown>>> => {
    const res = await fetchApi<{ rules: Array<Record<string, unknown>> }>(`/api/v1/competitors/rules?projectSlug=${projectSlug}`)
    return res.rules || []
  },

  createRule: async (projectSlug: string, rule: { name: string; description?: string; rules: Record<string, unknown>; isActive?: boolean }): Promise<Record<string, unknown>> => {
    const res = await fetchApi<{ rule: Record<string, unknown> }>(`/api/v1/competitors/rules`, {
      method: 'POST',
      body: JSON.stringify({
        projectSlug,
        ...rule
      }),
    })
    return res.rule
  },
}

// Platforms API
export const platformsApi = {
  list: async (): Promise<{ platforms: Array<Record<string, unknown>>; count: number }> => {
    return fetchApi<{ platforms: Array<Record<string, unknown>>; count: number }>('/api/platforms')
  },

  getStatus: async (platform: string, projectSlug: string): Promise<{
    platform: string
    integration: Record<string, unknown> | null
    isConnected: boolean
  }> => {
    return fetchApi<{
      platform: string
      integration: Record<string, unknown> | null
      isConnected: boolean
    }>(`/api/platforms/${platform}?project=${projectSlug}`)
  },

  connect: async (platform: string, projectSlug: string, platformName: string, credentials: Record<string, unknown>) => {
    return fetchApi(`/api/platforms/${platform}`, {
      method: 'POST',
      body: JSON.stringify({ projectSlug, platformName, credentials }),
    })
  },

  disconnect: async (platform: string, projectSlug: string) => {
    return fetchApi(`/api/platforms/${platform}?project=${projectSlug}`, {
      method: 'DELETE',
    })
  },

  triggerSync: async (platform: string, projectSlug: string, syncType: string = 'full') => {
    return fetchApi(`/api/platforms/${platform}/sync`, {
      method: 'POST',
      body: JSON.stringify({ projectSlug, syncType }),
    })
  },

  getSyncStatus: async (platform: string, projectSlug: string, projectId?: string) => {
    const queryParam = projectId ? `projectId=${projectId}` : `projectSlug=${projectSlug}`
    return fetchApi<{
      success: boolean
      integration: {
        id: string
        platformName: string
        status: string
        syncStatus: string | null
        lastSyncAt: string | null
        syncError: string | null
      }
      syncLogs: Array<{
        id: string
        syncType: string
        status: string
        startedAt: string
        completedAt: string | null
        itemsProcessed: number | null
        itemsSuccessful: number | null
        itemsFailed: number | null
        errors: Record<string, unknown> | null
      }>
    }>(`/api/platforms/${platform}/sync/status?${queryParam}`)
  },
}

// Health check
export const healthApi = {
  check: async () => {
    return fetchApi<{ status: string; timestamp: string; service: string }>('/api/health')
  },
}

export { ApiError }
