import { Buffer } from 'node:buffer'

export interface ShopifyOAuthState {
  projectSlug: string
  host?: string | null
  returnTo?: string | null
}

export function encodeOAuthState(state: ShopifyOAuthState): string {
  const payload = JSON.stringify(state)
  return Buffer.from(payload, 'utf8').toString('base64url')
}

export function decodeOAuthState(value: string | null): ShopifyOAuthState | null {
  if (!value) return null
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const parsed = JSON.parse(decoded) as ShopifyOAuthState
    if (parsed && typeof parsed.projectSlug === 'string' && parsed.projectSlug.length > 0) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}
