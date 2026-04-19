import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Prism — Product Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: 'white',
          }}>P</div>
          <span style={{ fontSize: 56, fontWeight: 700, color: 'white', letterSpacing: -2 }}>Prism</span>
        </div>
        <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center', maxWidth: 700 }}>
          Product intelligence, from launch to legacy
        </p>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
          17,000+ products · Signal scoring · Market analytics
        </p>
      </div>
    ),
    { ...size }
  )
}
