export async function uploadFeedDocument(url: string, body: Buffer | Uint8Array, contentType = 'text/xml; charset=UTF-8') {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(body.byteLength),
    },
    body,
  })
  if (!res.ok) {
    const text = await safeText(res)
    throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text ? `- ${text}` : ''}`)
  }
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

