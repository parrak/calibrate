import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  // Read the logo image from public folder
  const logoPath = join(process.cwd(), 'public', 'favicon.ico')
  let logoData: Buffer | null = null
  
  try {
    logoData = await readFile(logoPath)
  } catch (error) {
    // Fallback if file not found
    console.warn('Logo file not found, using fallback')
  }

  // Convert to base64 data URL
  const logoBase64 = logoData 
    ? `data:image/png;base64,${logoData.toString('base64')}`
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {logoBase64 ? (
          <img
            src={logoBase64}
            alt="Calibrate"
            width={180}
            height={180}
            style={{
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(90deg, #80D9D9 0%, #00A3A3 50%, #008080 100%)',
              borderRadius: 28,
            }}
          >
            <svg width="96" height="96" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="28" stroke="#001845" strokeWidth="3" fill="none" opacity="0.3"/>
              <path d="M32 4 L32 12" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
              <path d="M32 52 L32 60" stroke="#001845" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="32" r="20" fill="#001845" opacity="0.1"/>
              <path d="M32 16 L32 28" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
              <path d="M32 36 L32 48" stroke="#001845" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    ),
    size
  )
}

