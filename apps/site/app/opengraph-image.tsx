import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#0B0F12',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(800px 500px at 15% 10%, rgba(124,77,255,0.25), transparent), radial-gradient(800px 500px at 85% 90%, rgba(0,229,168,0.25), transparent)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 24,
              background: 'linear-gradient(135deg, #00E5A8 0%, #7C4DFF 100%)',
            }}
          >
            <svg width="54" height="54" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#0B0F12">
                <path d="M41.5 22.5a2 2 0 0 1 0 3c-3.4 2.4-5.5 6.1-5.5 10.1s2.1 7.7 5.5 10.1a2 2 0 0 1-2.3 3.3C34 46.8 31 41.7 31 35.6s3-11.2 8.2-13.4a2 2 0 0 1 2.3.3z"/>
                <path d="M22 17a2 2 0 1 1 0-4h20a2 2 0 1 1 0 4H22z"/>
              </g>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 60, color: 'white', fontWeight: 800 }}>Calibr</div>
            <div style={{ fontSize: 28, color: '#96A2AE', marginTop: 6 }}>Real-time pricing precision</div>
          </div>
        </div>
        <div style={{ height: 36 }} />
        <div style={{ fontSize: 28, color: '#C6D0DA', maxWidth: 900, lineHeight: 1.4 }}>
          The intelligent pricing engine with guardrails, human review, and instant rollback.
        </div>
      </div>
    ),
    size
  )
}


