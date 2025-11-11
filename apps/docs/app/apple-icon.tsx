import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(90deg, #67C8FF 0%, #377BFF 50%, #0E3AFF 100%)',
          borderRadius: 28,
        }}
      >
        {/* Calibrate dial icon - simplified 3-segment dial */}
        <svg width="96" height="96" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" stroke="#001845" strokeWidth="3" fill="none" opacity="0.3"/>
          <path d="M32 4 L32 12" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 52 L32 60" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="32" r="20" fill="#001845" opacity="0.1"/>
          <path d="M32 16 L32 28" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
          <path d="M32 36 L32 48" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    size
  )
}

