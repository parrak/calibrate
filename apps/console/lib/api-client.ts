/**
 * API Client for Calibr Console
 * Communicates with the Calibr API backend
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
    return fetchApi<any[]>(`/api/v1/price-changes?project=${projectSlug}`)
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
    return fetchApi<any[]>(`/api/v1/catalog?projectSlug=${projectSlug}`)
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

// Health check
export const healthApi = {
  check: async () => {
    return fetchApi<{ status: string; timestamp: string; service: string }>('/api/health')
  },
}

export { ApiError }
