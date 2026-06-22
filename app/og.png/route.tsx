import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#050914',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Grid dot background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
            display: 'flex',
          }}
        />
        {/* Orange glow center */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Live badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.35)',
            borderRadius: '100px',
            padding: '10px 24px',
            marginBottom: '44px',
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'flex' }} />
          <span style={{ color: '#94a3b8', fontSize: '15px', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            ET AI Hackathon 2026 · Problem Statement #2
          </span>
        </div>

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '16px' }}>
          <div
            style={{
              width: 90, height: 90, borderRadius: '22px',
              background: 'rgba(249,115,22,0.18)',
              border: '2px solid rgba(249,115,22,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '46px',
            }}
          >🛢️</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '78px', fontWeight: 900, color: '#f97316', letterSpacing: '0.08em', lineHeight: 1, fontFamily: 'monospace' }}>
              DRISHTI
            </span>
            <span style={{ fontSize: '17px', color: '#64748b', letterSpacing: '0.2em', marginTop: '6px', fontFamily: 'monospace' }}>
              दृष्टि · INDIA ENERGY SECURITY INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ color: '#94a3b8', fontSize: '20px', marginBottom: '52px', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
          AI-Powered Oil Supply Chain War Room
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '18px' }}>
          {[
            { value: '88%', label: 'Import Dependency', color: '#f97316' },
            { value: '40%', label: 'Via Hormuz', color: '#ef4444' },
            { value: '9.5d', label: 'SPR Cover', color: '#eab308' },
            { value: 'GPT-4o', label: 'AI Engine', color: '#a78bfa' },
            { value: 'Live', label: 'Multi-Browser', color: '#22c55e' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '18px 24px',
              }}
            >
              <span style={{ fontSize: '32px', fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</span>
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '6px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ marginTop: '44px', display: 'flex', alignItems: 'center', gap: '18px', color: '#334155', fontSize: '13px', fontFamily: 'monospace' }}>
          <span>🌍 3D Globe</span>
          <span>·</span>
          <span>📡 Real-Time Sync</span>
          <span>·</span>
          <span>🤖 AI Procurement</span>
          <span>·</span>
          <span>⚡ Crisis Sim</span>
          <span>·</span>
          <span>✈️ Telegram Bot</span>
          <span>·</span>
          <span>📱 NFC Card</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
