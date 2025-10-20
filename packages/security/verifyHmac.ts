import crypto from 'crypto'

export function verifyHmac(
  rawBody: string, 
  header: string, 
  secret: string, 
  toleranceSec = 300
): boolean {
  const parts = Object.fromEntries(
    header.split(',').map(p => p.split('='))
  )
  const ts = Number(parts['t'])
  const v1 = parts['v1']
  
  if (!ts || !v1) return false
  
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > toleranceSec) return false
  
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(v1), 
    Buffer.from(digest)
  )
}
