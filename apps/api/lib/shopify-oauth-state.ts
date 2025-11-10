import { Buffer } from 'node:buffer'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export interface ShopifyOAuthState {
  projectSlug: string
  host?: string | null
  returnTo?: string | null
}

const STATE_VERSION = 'v1'
const STATE_TTL_SECONDS = 60 * 10 // 10 minutes
const FUTURE_SKEW_SECONDS = 60 // allow slight clock drift

interface SignedStatePayload {
  version: typeof STATE_VERSION
  nonce: string
  issuedAt: number
  projectSlug: string
  host: string | null
  returnTo: string | null
}

interface SignedStateEnvelope {
  payload: SignedStatePayload
  signature: string
}

function getStateSecret(): string {
  const secret = process.env.SHOPIFY_OAUTH_STATE_SECRET || process.env.SHOPIFY_API_SECRET
  if (!secret) {
    throw new Error('SHOPIFY_OAUTH_STATE_SECRET or SHOPIFY_API_SECRET must be configured to encode Shopify OAuth state')
  }
  return secret
}

export function encodeOAuthState(state: ShopifyOAuthState): string {
  const secret = getStateSecret()

  const payload: SignedStatePayload = {
    version: STATE_VERSION,
    nonce: randomBytes(16).toString('hex'),
    issuedAt: Math.floor(Date.now() / 1000),
    projectSlug: state.projectSlug,
    host: state.host ?? null,
    returnTo: state.returnTo ?? null,
  }

  const payloadString = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(payloadString).digest('base64url')

  const envelope: SignedStateEnvelope = {
    payload,
    signature,
  }

  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url')
}

function safeTimingCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false
  }

  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function decodeOAuthState(value: string | null): ShopifyOAuthState | null {
  if (!value) return null

  const secret = process.env.SHOPIFY_OAUTH_STATE_SECRET || process.env.SHOPIFY_API_SECRET
  if (!secret) {
    return null
  }

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const envelope = JSON.parse(decoded) as Partial<SignedStateEnvelope>

    if (!envelope || typeof envelope !== 'object') {
      return null
    }

    const { payload, signature } = envelope

    if (!payload || typeof signature !== 'string') {
      return null
    }

    const payloadString = JSON.stringify(payload)
    const expectedSignature = createHmac('sha256', secret).update(payloadString).digest('base64url')

    const providedBuffer = Buffer.from(signature, 'base64url')
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url')

    if (!safeTimingCompare(providedBuffer, expectedBuffer)) {
      return null
    }

    if (payload.version !== STATE_VERSION) {
      return null
    }

    if (typeof payload.projectSlug !== 'string' || payload.projectSlug.length === 0) {
      return null
    }

    const now = Math.floor(Date.now() / 1000)

    if (payload.issuedAt > now + FUTURE_SKEW_SECONDS) {
      return null
    }

    if (now - payload.issuedAt > STATE_TTL_SECONDS) {
      return null
    }

    return {
      projectSlug: payload.projectSlug,
      host: payload.host ?? null,
      returnTo: payload.returnTo ?? null,
    }
  } catch {
    return null
  }
}
