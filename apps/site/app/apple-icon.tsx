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
          backgroundImage: 'linear-gradient(135deg, #00E5A8 0%, #7C4DFF 100%)',
          borderRadius: 28,
        }}
      >
        <svg width="96" height="96" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill="#0B0F12">
            <path d="M41.5 22.5a2 2 0 0 1 0 3c-3.4 2.4-5.5 6.1-5.5 10.1s2.1 7.7 5.5 10.1a2 2 0 0 1-2.3 3.3C34 46.8 31 41.7 31 35.6s3-11.2 8.2-13.4a2 2 0 0 1 2.3.3z"/>
            <path d="M22 17a2 2 0 1 1 0-4h20a2 2 0 1 1 0 4H22z"/>
          </g>
        </svg>
      </div>
    ),
    size
  )
}
