import crypto from 'crypto'
import { NextRequest } from 'next/server'

export async function verifyHmac(
  request: NextRequest,
  secret?: string,
  toleranceSec = 300
): Promise<{ valid: boolean; projectId?: string }> {
  try {
    const sig = request.headers.get('X-Calibr-Signature')
    const projectId = request.headers.get('X-Calibr-Project')

    if (!sig) {
      return { valid: false }
    }

    const webhookSecret = secret || process.env.WEBHOOK_SECRET || ''
    const rawBody = await request.text()

    const parts = Object.fromEntries(
      sig.split(',').map(p => p.split('='))
    )
    const ts = Number(parts['t'])
    const v1 = parts['v1']

    if (!ts || !v1) return { valid: false }

    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - ts) > toleranceSec) return { valid: false }

    const digest = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${ts}.${rawBody}`)
      .digest('hex')

    const valid = crypto.timingSafeEqual(
      Buffer.from(v1),
      Buffer.from(digest)
    )

    return { valid, projectId: projectId || undefined }
  } catch (error) {
    return { valid: false }
  }
}
