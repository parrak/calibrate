import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST as issueSession } from '../app/api/auth/session/route'

describe('auth session endpoint', () => {
  const token = 'test-internal-token'
  beforeAll(() => {
    process.env.CONSOLE_INTERNAL_TOKEN = token
  })
  afterAll(() => {
    delete process.env.CONSOLE_INTERNAL_TOKEN
  })

  it('rejects missing header', async () => {
    const req = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    }) as any
    const res = await issueSession(req)
    expect(res.status).toBe(401)
  })

  it('issues a token with valid header and body', async () => {
    const req = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ userId: 'u1', roles: ['admin'] }),
    }) as any
    const res = await issueSession(req)
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(typeof data.token).toBe('string')
    expect(data.context?.userId).toBe('u1')
  })
})

