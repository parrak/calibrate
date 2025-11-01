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
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
  list: async (projectSlug: string) => {
    // API returns shape: { items: [...] }
    const res = await fetchApi<{ items?: any[] }>(`/api/v1/price-changes?project=${projectSlug}`)
    return Array.isArray(res?.items) ? res.items : []
  },

  approve: async (id: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/approve`, {
      method: 'POST',
    })
  },

  reject: async (id: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/reject`, {
      method: 'POST',
    })
  },

  apply: async (id: string) => {
    return fetchApi(`/api/v1/price-changes/${id}/apply`, {
      method: 'POST',
    })
  },
}

// Catalog API
export const catalogApi = {
  getProduct: async (productCode: string) => {
    return fetchApi<any>(`/api/v1/catalog?productCode=${productCode}`)
  },

  listProducts: async (projectSlug: string) => {
    // API expects `project` and returns { products: [{ product: {code,name}, skus: [...] }, ...] }
    const res = await fetchApi<{ products?: Array<{ product: { code: string; name: string }; skus: any[] }> }>(
      `/api/v1/catalog?project=${projectSlug}`
    )
    const products = Array.isArray(res?.products) ? res.products : []
    // Normalize to [{ code, name, skus }]
    return products.map((p) => ({ code: p.product.code, name: p.product.name, skus: p.skus }))
  },
}

// Competitors API
export const competitorsApi = {
  list: async (projectSlug: string) => {
    return fetchApi<any[]>(`/api/v1/competitors?projectSlug=${projectSlug}`)
  },

  get: async (id: string) => {
    return fetchApi<any>(`/api/v1/competitors/${id}`)
  },

  getProducts: async (id: string) => {
    return fetchApi<any[]>(`/api/v1/competitors/${id}/products`)
  },

  monitor: async (id: string) => {
    return fetchApi<any>(`/api/v1/competitors/monitor`, {
      method: 'POST',
      body: JSON.stringify({ competitorId: id }),
    })
  },

  getRules: async (projectSlug: string) => {
    return fetchApi<any[]>(`/api/v1/competitors/rules?projectSlug=${projectSlug}`)
  },
}

// Platforms API
export const platformsApi = {
  list: async () => {
    return fetchApi<{ platforms: any[]; count: number }>('/api/platforms')
  },

  getStatus: async (platform: string, projectSlug: string) => {
    return fetchApi<{
      platform: string
      integration: any | null
      isConnected: boolean
    }>(`/api/platforms/${platform}?project=${projectSlug}`)
  },

  connect: async (platform: string, projectSlug: string, platformName: string, credentials: any) => {
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
        errors: any
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
