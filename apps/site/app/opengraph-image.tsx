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
              'radial-gradient(circle at 15% 10%, rgba(55,123,255,0.25) 0%, transparent 60%), radial-gradient(circle at 85% 90%, rgba(14,58,255,0.25) 0%, transparent 60%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              background: 'linear-gradient(90deg, #67C8FF 0%, #377BFF 50%, #0E3AFF 100%)',
            }}
          >
            <svg width="54" height="54" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Calibrate dial icon */}
              <circle cx="32" cy="32" r="28" stroke="#001845" strokeWidth="3" fill="none" opacity="0.3"/>
              <path d="M32 4 L32 12" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
              <path d="M32 52 L32 60" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="32" r="20" fill="#001845" opacity="0.1"/>
              <path d="M32 16 L32 28" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
              <path d="M32 36 L32 48" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 60, color: 'white', fontWeight: 800 }}>Calibrate</div>
            <div style={{ fontSize: 28, color: '#96A2AE', marginTop: 6 }}>The AI-native pricing control plane</div>
          </div>
        </div>
        <div style={{ height: 36 }} />
        <div style={{ fontSize: 28, color: '#C6D0DA', maxWidth: 900, lineHeight: 1.4 }}>
          The AI-native pricing control plane for commerce. Automate safe price changes with AI guardrails, human oversight, and instant rollback.
        </div>
      </div>
    ),
    size
  )
}
