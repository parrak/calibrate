import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'

import { OPTIONS as optionsHandler, POST as issueSession } from '../app/api/auth/session/route'

const createRequest = (init: RequestInit) => {
  return new NextRequest('http://localhost/api/auth/session', init)
}

describe('auth session endpoint', () => {
  const token = 'test-internal-token'
  beforeAll(() => {
    process.env.CONSOLE_INTERNAL_TOKEN = token
  })
  afterAll(() => {
    delete process.env.CONSOLE_INTERNAL_TOKEN
  })

  it('rejects missing header', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(401)
  })

  it('issues a token with valid header and body', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ userId: 'u1', roles: ['admin'] }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(typeof data.token).toBe('string')
    expect(data.context?.userId).toBe('u1')
    expect(data.context?.roles).toEqual(['admin'])
  })

  it('rejects invalid payloads', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ roles: ['admin'] }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.error).toBe('Invalid payload')
  })

  it('issues viewer role when none supplied', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ userId: 'u2' }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.context?.roles).toEqual(['viewer'])
    expect(body.context?.isAdmin).toBe(false)
  })

  it('normalizes duplicate roles', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ userId: 'u3', roles: ['admin', 'ADMIN', ' editor ', ''] }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.context?.roles).toEqual(['admin', 'editor'])
  })

  it('returns 500 when CONSOLE_INTERNAL_TOKEN is missing', async () => {
    delete process.env.CONSOLE_INTERNAL_TOKEN
    const req = createRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-console-auth': token },
      body: JSON.stringify({ userId: 'u4' }),
    })
    const res = await issueSession(req)
    expect(res.status).toBe(500)
    const body = await res.json() as any
    expect(body.error).toBe('Server misconfiguration')
    process.env.CONSOLE_INTERNAL_TOKEN = token
  })

  it('handles OPTIONS preflight', async () => {
    const res = await optionsHandler(createRequest({ method: 'OPTIONS' }))
    expect(res.status).toBe(200)
  })
})

