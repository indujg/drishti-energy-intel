'use client'

import { useEffect, useState, useRef } from 'react'
import { Radio } from 'lucide-react'

const BASE_BRENT = 87.42
const CORRIDORS = [
  { name: 'HORMUZ', risk: 78, color: '#ff3232', share: '40%' },
  { name: 'RED SEA', risk: 65, color: '#ffb800', share: '15%' },
  { name: 'CAPE',   risk: 12, color: '#00ff87', share: '18%' },
]

// ── Corner brackets ─────────────────────────────────────
function Corners({ color = '#00d4ff', size = 8, thickness = 1.5 }: { color?: string; size?: number; thickness?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size, pointerEvents: 'none' }
  return (
    <>
      <div style={{ ...s, top: -1, left: -1, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
      <div style={{ ...s, top: -1, right: -1, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, left: -1, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, right: -1, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
    </>
  )
}

// ── Segmented bar ────────────────────────────────────────
function SegBar({ value, total = 14, color }: { value: number; total?: number; color: string }) {
  const filled = Math.round((value / 100) * total)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            background: i < filled ? color : '#153030',
            boxShadow: i < filled ? `0 0 3px ${color}66` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function NFCBriefing() {
  const [time, setTime] = useState<Date | null>(null)
  const [brent, setBrent] = useState(BASE_BRENT)
  const [vesselCount, setVesselCount] = useState(12)
  const [news, setNews] = useState<Array<{ id: number; headline: string; source: string; risk: number }>>([])
  const tRef = useRef(0)

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      tRef.current += 1
      setBrent(prev => +(prev + (Math.random() - 0.5) * 0.55 + (BASE_BRENT - prev) * 0.04).toFixed(2))
    }, 1800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/vessels')
      .then(r => r.json())
      .then(d => setVesselCount(d.vessels?.length ?? 12))
      .catch(() => {})
    fetch('/api/news')
      .then(r => r.json())
      .then(d => setNews((d.news ?? []).slice(0, 3)))
      .catch(() => {})
  }, [])

  const change = brent - BASE_BRENT
  const pct = ((change / BASE_BRENT) * 100).toFixed(2)
  const overallRisk = 58

  return (
    <div
      className="min-h-screen font-mono p-4 flex flex-col"
      style={{ background: 'var(--c-bg)', color: 'var(--c-text)', maxWidth: 400, margin: '0 auto' }}
    >
      {/* ── MISSION BRIEFING HEADER ─────────────────────── */}
      <div
        className="relative font-mono text-center mb-5"
        style={{ border: '1px solid #00d4ff44', padding: '10px 14px' }}
      >
        <Corners color="#00d4ff" size={10} thickness={2} />
        <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>
          [ MISSION BRIEFING ]
        </p>
        <h1
          className="font-bold"
          style={{ fontSize: 18, color: '#00d4ff', textShadow: '0 0 14px #00d4ff88', letterSpacing: '0.15em' }}
        >
          DRISHTI
        </h1>
        <p style={{ fontSize: 9, color: 'var(--c-muted)', letterSpacing: '0.2em', marginTop: 2 }}>
          ENERGY INTELLIGENCE SYSTEM
        </p>
      </div>

      {/* ── STATUS ROW ─────────────────────────────────── */}
      <div
        className="relative font-mono flex justify-between items-center mb-4"
        style={{ border: '1px solid var(--c-border)', padding: '8px 14px' }}
      >
        <Corners color="var(--c-muted)" size={7} thickness={1} />
        <div className="flex items-center gap-2">
          <Radio style={{ width: 10, height: 10, color: '#00ff87' }} className="blink-slow" />
          <span style={{ fontSize: 9, color: '#00ff87', letterSpacing: '0.15em' }}>SYS: ONLINE</span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--c-muted)', letterSpacing: '0.05em' }}>
          {time ? time.toUTCString().slice(0, 25) : '—'}
        </span>
      </div>

      {/* ── COMPOSITE THREAT INDEX ─────────────────────── */}
      <div
        className="relative font-mono mb-4 text-center"
        style={{ background: 'var(--c-panel)', border: '1px solid #ffb80044', padding: '16px 14px' }}
      >
        <Corners color="#ffb800" size={9} thickness={2} />
        <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.2em', marginBottom: 6 }}>
          SYS: COMPOSITE THREAT INDEX
        </p>
        <div
          className="font-bold tabular-nums"
          style={{ fontSize: 60, color: '#ffb800', textShadow: '0 0 20px #ffb80099', lineHeight: 1 }}
        >
          {overallRisk}
        </div>
        <p style={{ fontSize: 11, color: '#ffb800', fontWeight: 700, letterSpacing: '0.2em', margin: '6px 0 10px' }}>
          ELEVATED
        </p>
        <SegBar value={overallRisk} color="#ffb800" total={14} />
        <div className="flex justify-between mt-2">
          <span style={{ fontSize: 7, color: 'var(--c-xmuted)' }}>0 — NOMINAL</span>
          <span style={{ fontSize: 7, color: 'var(--c-xmuted)' }}>100 — CRITICAL</span>
        </div>
      </div>

      {/* ── KEY STATS 2x2 ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {/* Brent */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px' }}
        >
          <Corners color="#00d4ff" size={7} />
          <p style={{ fontSize: 7, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 3 }}>DATA: BRENT/BBL</p>
          <p
            className="font-bold tabular-nums"
            style={{ fontSize: 20, color: '#00d4ff', textShadow: '0 0 10px #00d4ff88', lineHeight: 1.1 }}
          >
            ${brent.toFixed(2)}
          </p>
          <p style={{ fontSize: 9, color: change >= 0 ? '#ff3232' : '#00ff87', fontWeight: 700, marginTop: 3 }}>
            {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{pct}%
          </p>
        </div>

        {/* SPR */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px' }}
        >
          <Corners color="#ffb800" size={7} />
          <p style={{ fontSize: 7, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 3 }}>SYS: SPR COVER</p>
          <p
            className="font-bold tabular-nums"
            style={{ fontSize: 20, color: '#ffb800', textShadow: '0 0 10px #ffb80088', lineHeight: 1.1 }}
          >
            9.5D
          </p>
          <div style={{ marginTop: 5 }}>
            <SegBar value={32} color="#ffb800" total={10} />
          </div>
        </div>

        {/* Hormuz */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px' }}
        >
          <Corners color="#ff3232" size={7} />
          <p style={{ fontSize: 7, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 3 }}>SIGINT: HORMUZ</p>
          <p
            className="font-bold tabular-nums"
            style={{ fontSize: 20, color: '#ff3232', textShadow: '0 0 10px #ff323288', lineHeight: 1.1 }}
          >
            78<span style={{ fontSize: 10, color: 'var(--c-muted)' }}>/100</span>
          </p>
          <p style={{ fontSize: 7, color: 'var(--c-muted)', marginTop: 3, letterSpacing: '0.08em' }}>40% INDIA SUPPLY</p>
        </div>

        {/* Vessels */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px' }}
        >
          <Corners color="#00d4ff" size={7} />
          <p style={{ fontSize: 7, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 3 }}>ASSET: VESSELS</p>
          <p
            className="font-bold tabular-nums"
            style={{ fontSize: 20, color: '#00d4ff', textShadow: '0 0 10px #00d4ff88', lineHeight: 1.1 }}
          >
            {vesselCount}
          </p>
          <p style={{ fontSize: 7, color: 'var(--c-muted)', marginTop: 3, letterSpacing: '0.08em' }}>TANKERS TRACKED</p>
        </div>
      </div>

      {/* ── CORRIDOR RISK ──────────────────────────────── */}
      <div
        className="relative font-mono mb-4"
        style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
      >
        <Corners color="var(--c-muted)" size={7} />
        <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.2em', marginBottom: 10 }}>
          SIGINT: CORRIDOR RISK INDEX
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORRIDORS.map(c => (
            <div key={c.name}>
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 9, color: 'var(--c-text)', letterSpacing: '0.1em' }}>{c.name}</span>
                <div className="flex gap-3">
                  <span style={{ fontSize: 9, fontWeight: 700, color: c.color }}>{c.risk}</span>
                  <span style={{ fontSize: 8, color: 'var(--c-muted)' }}>{c.share}</span>
                </div>
              </div>
              <SegBar value={c.risk} color={c.color} total={14} />
            </div>
          ))}
        </div>
      </div>

      {/* ── INTEL FEED ─────────────────────────────────── */}
      {news.length > 0 && (
        <div
          className="relative font-mono mb-4"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
        >
          <Corners color="#ff3232" size={7} />
          <div className="flex items-center gap-2 mb-3">
            <span className="blink" style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3232', display: 'inline-block' }} />
            <p style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--c-text)' }}>SIGINT: INTEL FEED</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {news.map(n => {
              const c = n.risk >= 70 ? '#ff3232' : '#ffb800'
              return (
                <div key={n.id} style={{ borderLeft: `2px solid ${c}55`, paddingLeft: 10 }}>
                  <p style={{ fontSize: 10, color: 'var(--c-text)', lineHeight: 1.5 }}>{n.headline}</p>
                  <p style={{ fontSize: 7, color: 'var(--c-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
                    {n.source.toUpperCase()} · RISK <span style={{ color: c }}>{n.risk}</span>/100
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────── */}
      <a
        href="https://drishti-intel.vercel.app"
        className="relative font-mono text-center"
        style={{
          display: 'block',
          padding: '14px 0',
          background: 'rgba(0,212,255,0.07)',
          border: '1px solid rgba(0,212,255,0.35)',
          fontSize: 10,
          fontWeight: 700,
          color: '#00d4ff',
          letterSpacing: '0.2em',
          textDecoration: 'none',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        <Corners color="#00d4ff" size={9} thickness={2} />
        [ OPEN FULL WAR ROOM ] →
      </a>

      <p style={{ textAlign: 'center', fontSize: 8, color: 'var(--c-xmuted)', letterSpacing: '0.1em' }}>
        ACCESSED VIA NFC · DRISHTI v2.0 · MOPNG
      </p>
    </div>
  )
}
