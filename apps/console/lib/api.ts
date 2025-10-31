export async function apiFetch(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}${path}`, init)
  return res
}

export async function apiFetchWithAuth(
  path: string,
  getToken: () => Promise<string | undefined>,
  init: RequestInit = {},
) {
  const token = await getToken()
  const headers = new Headers(init.headers as HeadersInit)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return apiFetch(path, { ...init, headers })
}

