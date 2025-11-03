'use client'
import { useState } from 'react'

const tabOrder = ['curl','node','python'] as const
const snippets: Record<typeof tabOrder[number], string> = {
  curl: `# header includes your project slug and signed HMAC
ts=$(date +%s)
body='{"idempotencyKey":"sample_1","skuCode":"PRO-M","currency":"USD","proposedAmount":5290,"source":"AI"}'
sig=$(printf "%s.%s" "$ts" "$body" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -sS -X POST "https://api.calibr.lat/api/v1/webhooks/price-suggestion" \\
  -H "Content-Type: application/json" \\
  -H "X-Calibr-Project: demo" \\
  -H "X-Calibr-Signature: t=$ts,v1=$sig" \\
  -d "$body"`,
  node: `import crypto from 'crypto'
const ts = Math.floor(Date.now()/1000)
const body = { idempotencyKey:'sample_1', skuCode:'PRO-M', currency:'USD', proposedAmount:5290, source:'AI' }
const raw = JSON.stringify(body)
const v1 = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET!).update(\`\${ts}.\${raw}\`).digest('hex')
await fetch('https://api.calibr.lat/api/v1/webhooks/price-suggestion', {
  method: 'POST',
  headers: {
    'Content-Type':'application/json',
    'X-Calibr-Project':'demo',
    'X-Calibr-Signature': \`t=\${ts},v1=\${v1}\`
  },
  body: raw
})`,
  python: `import hmac, hashlib, time, requests, json, os
ts = int(time.time())
body = {"idempotencyKey":"sample_1","skuCode":"PRO-M","currency":"USD","proposedAmount":5290,"source":"AI"}
raw = json.dumps(body)
sig = hmac.new(os.environ['WEBHOOK_SECRET'].encode(), f"{ts}.{raw}".encode(), hashlib.sha256).hexdigest()
r = requests.post("https://api.calibr.lat/api/v1/webhooks/price-suggestion",
  headers={"Content-Type":"application/json","X-Calibr-Project":"demo","X-Calibr-Signature": f"t={ts},v1={sig}"},
  data=raw)`,
}

export function CodeTabs() {
  const [tab, setTab] = useState<typeof tabOrder[number]>('curl')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleCopy = async () => {
    try {
      // Check if Clipboard API is available and we're in a secure context
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(snippets[tab])
        setCopyStatus('success')
        setTimeout(() => setCopyStatus('idle'), 2000)
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement('textarea')
        textArea.value = snippets[tab]
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand('copy')
          setCopyStatus('success')
          setTimeout(() => setCopyStatus('idle'), 2000)
        } catch {
          setCopyStatus('error')
          setTimeout(() => setCopyStatus('idle'), 2000)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  return (
    <div>
      <div className="flex gap-2 text-sm">
        {tabOrder.map(t => (
          <button
            key={t}
            onClick={()=>setTab(t)}
            className={`px-3 py-1 rounded ${tab===t ? 'bg-border text-fg' : 'text-mute hover:text-fg'}`}
            aria-pressed={tab===t}
          >
            {t}
          </button>
        ))}
        <button
          onClick={handleCopy}
          className="ml-auto text-sm text-mute hover:text-fg"
          aria-label="Copy code"
        >
          {copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy'}
        </button>
      </div>
      <pre className="mt-3 text-sm bg-black/50 border border-border rounded-lg p-3 overflow-auto">
        <code>{snippets[tab]}</code>
      </pre>
      <p className="text-xs text-mute mt-2">
        Use your project slug in <code>X-Calibr-Project</code> (e.g., <code>demo</code>).
        <a href="https://docs.calibr.lat" className="text-brand hover:underline ml-1">View full API docs →</a>
      </p>
    </div>
  )
}
