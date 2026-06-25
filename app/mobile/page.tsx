'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Radio } from 'lucide-react'
import Image from 'next/image'

interface SimResult {
  scenario?: {
    name: string
    icon: string
    impacts: {
      priceChange: number
      affectedVolume: number
      transitDelayDays: number
      sprDaysRemaining: number
    }
  }
  procurement?: { summary: string }
}

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94, redsea_shutdown: 72, opec_cut: 65, combined_crisis: 99
}

const BASE_BRENT = 87.42

const SCENARIOS = [
  { id: 'hormuz_closure',  icon: '🔴', label: 'HORMUZ CLOSURE',   accent: '#ff3232' },
  { id: 'redsea_shutdown', icon: '🟠', label: 'RED SEA SHUTDOWN', accent: '#ffb800' },
  { id: 'opec_cut',        icon: '🟡', label: 'OPEC+ CUT',        accent: '#ffb800' },
  { id: 'combined_crisis', icon: '⚫', label: 'COMBINED CRISIS',  accent: '#b06cff' },
]

// ── Corner brackets ────────────────────────────────────────
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

// ── Segmented bar ──────────────────────────────────────────
function SegBar({ value, total = 16, color }: { value: number; total?: number; color: string }) {
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

export default function MobileWarRoom() {
  const [brent, setBrent] = useState(BASE_BRENT)
  const [vesselCount, setVesselCount] = useState(12)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [overallRisk, setOverallRisk] = useState(58)
  const [news, setNews] = useState<Array<{ id: number; headline: string; source: string; risk: number }>>([])
  const tRef = useRef(0)

  // Live Brent price
  useEffect(() => {
    const target = activeScenario && simResult?.scenario
      ? BASE_BRENT * (1 + simResult.scenario.impacts.priceChange / 100)
      : BASE_BRENT
    const id = setInterval(() => {
      tRef.current += 1
      setBrent(prev => +(prev + (target - prev) * (activeScenario ? 0.18 : 0.05) + (Math.random() - 0.5) * 0.45).toFixed(2))
    }, 1600)
    return () => clearInterval(id)
  }, [activeScenario, simResult])

  // Fetch live data
  useEffect(() => {
    fetch('/api/vessels').then(r => r.json()).then(d => setVesselCount(d.vessels?.length ?? 12)).catch(() => {})
    fetch('/api/news').then(r => r.json()).then(d => setNews((d.news ?? []).slice(0, 4))).catch(() => {})
  }, [])

  const triggerScenario = useCallback(async (scenarioId: string) => {
    if (loading) return
    setLoading(scenarioId)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      })
      const data = await res.json()
      setActiveScenario(scenarioId)
      setSimResult(data)
      setOverallRisk(RISK_MAP[scenarioId] ?? 50)
    } catch {
      setActiveScenario(scenarioId)
      setOverallRisk(RISK_MAP[scenarioId] ?? 50)
    } finally {
      setLoading(null)
    }
  }, [loading])

  const reset = useCallback(async () => {
    setActiveScenario(null)
    setSimResult(null)
    setOverallRisk(58)
    await fetch('/api/simulate', { method: 'DELETE' }).catch(() => {})
  }, [])

  const riskColor =
    overallRisk >= 80 ? '#ff3232' :
    overallRisk >= 60 ? '#ffb800' : '#ffb800'

  const riskLabel =
    overallRisk >= 80 ? 'CRITICAL' :
    overallRisk >= 60 ? 'HIGH' : 'ELEVATED'

  const brentColor = activeScenario ? '#ff3232' : '#00d4ff'
  const brentChange = brent - BASE_BRENT

  return (
    <div
      className="min-h-screen font-mono"
      style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: '#020e0eee', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="DRISHTI"
            width={100}
            height={50}
            style={{ objectFit: 'contain', mixBlendMode: 'lighten' }}
            priority
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div
            className="flex items-center gap-1.5"
            style={{
              border: `1px solid ${riskColor}44`,
              background: `${riskColor}0d`,
              padding: '3px 8px',
              fontSize: 9,
              letterSpacing: '0.15em',
            }}
          >
            <span
              className="blink"
              style={{ width: 5, height: 5, borderRadius: '50%', background: riskColor, display: 'inline-block' }}
            />
            <span style={{ color: riskColor, fontWeight: 700 }}>{riskLabel}</span>
            <span style={{ color: riskColor }}>{overallRisk}</span>
          </div>

          <div className="flex items-center gap-1" style={{ fontSize: 9, color: '#00ff87' }}>
            <Radio style={{ width: 9, height: 9 }} className="blink-slow" />
            <span style={{ letterSpacing: '0.1em' }}>LIVE</span>
          </div>

          <a
            href="https://drishti-intel.vercel.app"
            style={{ fontSize: 9, color: 'var(--c-muted)', letterSpacing: '0.1em', textDecoration: 'none' }}
          >
            DESKTOP →
          </a>
        </div>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── THREAT INDEX ───────────────────────────────── */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: `1px solid ${riskColor}44`, padding: '14px 16px' }}
        >
          <Corners color={riskColor} size={8} />
          <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            SYS: COMPOSITE THREAT INDEX
          </p>
          <div className="flex items-end gap-3 mb-2">
            <span
              className="font-mono font-bold tabular-nums"
              style={{ fontSize: 48, color: riskColor, textShadow: `0 0 16px ${riskColor}88`, lineHeight: 1 }}
            >
              {overallRisk}
            </span>
            <div style={{ paddingBottom: 6 }}>
              <p style={{ fontSize: 11, color: riskColor, fontWeight: 700, letterSpacing: '0.15em' }}>{riskLabel}</p>
              <p style={{ fontSize: 8, color: 'var(--c-muted)' }}>/ 100</p>
            </div>
          </div>
          <SegBar value={overallRisk} color={riskColor} />
        </div>

        {/* ── BRENT + SPR ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Brent */}
          <div
            className="relative font-mono"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
          >
            <Corners color={brentColor} size={7} />
            <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>DATA: BRENT/BBL</p>
            <p
              className="tabular-nums font-bold"
              style={{ fontSize: 22, color: brentColor, textShadow: `0 0 10px ${brentColor}88`, lineHeight: 1.1 }}
            >
              ${brent.toFixed(2)}
            </p>
            <p style={{ fontSize: 9, color: brentChange >= 0 ? '#ff3232' : '#00ff87', fontWeight: 700, marginTop: 4 }}>
              {brentChange >= 0 ? '▲' : '▼'} {brentChange >= 0 ? '+' : ''}{((brentChange / BASE_BRENT) * 100).toFixed(1)}%
            </p>
          </div>

          {/* SPR */}
          <div
            className="relative font-mono"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
          >
            <Corners color="#ffb800" size={7} />
            <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>SYS: SPR COVER</p>
            <p
              className="tabular-nums font-bold"
              style={{ fontSize: 22, color: '#ffb800', textShadow: '0 0 10px #ffb80088', lineHeight: 1.1 }}
            >
              {activeScenario && simResult?.scenario ? simResult.scenario.impacts.sprDaysRemaining : 9.5}D
            </p>
            <div style={{ marginTop: 6 }}>
              <SegBar
                value={((activeScenario && simResult?.scenario ? simResult.scenario.impacts.sprDaysRemaining : 9.5) / 30) * 100}
                color="#ffb800"
                total={12}
              />
            </div>
          </div>
        </div>

        {/* ── METRICS STRIP ──────────────────────────────── */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '10px 16px' }}
        >
          <Corners color="#00d4ff" size={7} />
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
            {[
              { val: vesselCount, label: 'VESSELS', color: '#00d4ff' },
              { val: 78,         label: 'HORMUZ',  color: '#ff3232' },
              { val: 65,         label: 'RED SEA', color: '#ffb800' },
              { val: 12,         label: 'CAPE',    color: '#00ff87' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 18, fontWeight: 700, color: item.color, textShadow: `0 0 8px ${item.color}66` }}>
                  {item.val}
                </p>
                <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{item.label}</p>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Radio style={{ width: 14, height: 14, color: '#00ff87' }} className="blink-slow" />
              <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>LIVE</p>
            </div>
          </div>
        </div>

        {/* ── CRISIS SCENARIO BUTTONS ────────────────────── */}
        <div
          className="relative font-mono"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
        >
          <Corners color="#ff3232" size={7} />
          <div className="flex items-center gap-2 mb-3">
            <span className="blink" style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3232', display: 'inline-block' }} />
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--c-text)' }}>SIGINT: CRISIS SIMULATION</p>
            {activeScenario && (
              <span
                className="ml-auto blink"
                style={{ fontSize: 8, color: '#ff3232', border: '1px solid #ff323244', padding: '2px 7px', letterSpacing: '0.15em' }}
              >
                ACTIVE
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SCENARIOS.map(s => {
              const isActive = activeScenario === s.id
              const isLoading = loading === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => triggerScenario(s.id)}
                  disabled={isLoading}
                  className="relative font-mono text-left cursor-pointer"
                  style={{
                    background: isActive ? `${s.accent}14` : 'transparent',
                    border: `1px solid ${isActive ? s.accent : 'var(--c-border)'}`,
                    padding: '10px 12px',
                    transition: 'all 0.2s',
                  }}
                >
                  <Corners color={isActive ? s.accent : 'var(--c-muted)'} size={6} thickness={1} />
                  {isLoading && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(2,12,12,0.7)' }}
                    >
                      <div
                        style={{
                          width: 14, height: 14,
                          border: `1px solid ${s.accent}`,
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, color: isActive ? s.accent : 'var(--c-muted)', letterSpacing: '0.1em' }}>
                    {s.label}
                  </p>
                </button>
              )
            })}
          </div>

          <button
            onClick={reset}
            className="font-mono cursor-pointer"
            style={{
              marginTop: 10,
              width: '100%',
              padding: '7px 0',
              fontSize: 9,
              letterSpacing: '0.15em',
              color: 'var(--c-muted)',
              background: 'transparent',
              border: '1px solid var(--c-border)',
              textTransform: 'uppercase',
            }}
          >
            [ RESET TO NOMINAL ]
          </button>
        </div>

        {/* ── CRISIS RESULT ──────────────────────────────── */}
        {activeScenario && simResult?.scenario && (
          <div
            className="relative font-mono"
            style={{ background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.35)', padding: '12px 14px' }}
          >
            <Corners color="#ff3232" size={8} />
            <div className="flex items-center gap-2 mb-2">
              <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3232', display: 'inline-block', boxShadow: '0 0 6px #ff3232' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#ff3232', letterSpacing: '0.2em' }}>SIMULATION ACTIVE</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text)', marginBottom: 10 }}>
              {simResult.scenario.icon} {simResult.scenario.name.toUpperCase()}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { val: `+${simResult.scenario.impacts.priceChange}%`, label: 'BRENT', color: '#ff3232' },
                { val: `${simResult.scenario.impacts.affectedVolume}%`, label: 'SUPPLY HIT', color: '#ffb800' },
                { val: `+${simResult.scenario.impacts.transitDelayDays}D`, label: 'DELAY', color: '#b06cff' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="relative text-center"
                  style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}33`, padding: '8px 4px' }}
                >
                  <Corners color={stat.color} size={5} thickness={1} />
                  <p style={{ fontSize: 18, fontWeight: 700, color: stat.color, textShadow: `0 0 8px ${stat.color}66` }}>
                    {stat.val}
                  </p>
                  <p style={{ fontSize: 7, color: 'var(--c-muted)', letterSpacing: '0.1em', marginTop: 2 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {simResult.procurement?.summary && (
              <p
                style={{
                  fontSize: 10,
                  color: '#b06cff',
                  background: 'rgba(176,108,255,0.08)',
                  border: '1px solid rgba(176,108,255,0.25)',
                  padding: '8px 10px',
                  lineHeight: 1.6,
                  letterSpacing: '0.04em',
                }}
              >
                ASSET: AI DIRECTIVE — {simResult.procurement.summary}
              </p>
            )}
          </div>
        )}

        {/* ── INTEL FEED ─────────────────────────────────── */}
        {news.length > 0 && (
          <div
            className="relative font-mono"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', padding: '12px 14px' }}
          >
            <Corners color="#00d4ff" size={7} />
            <div className="flex items-center gap-2 mb-3">
              <span className="blink-slow" style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }} />
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--c-text)' }}>SIGINT: INTELLIGENCE FEED</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {news.map(n => {
                const c = n.risk >= 70 ? '#ff3232' : n.risk >= 45 ? '#ffb800' : '#ffb800'
                return (
                  <div key={n.id} style={{ borderLeft: `2px solid ${c}55`, paddingLeft: 10 }}>
                    <p style={{ fontSize: 10, color: 'var(--c-text)', lineHeight: 1.5 }}>{n.headline}</p>
                    <p style={{ fontSize: 8, color: 'var(--c-muted)', marginTop: 2 }}>
                      {n.source.toUpperCase()} · RISK <span style={{ color: c }}>{n.risk}</span>/100
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── NAV LINKS ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 24 }}>
          <a
            href="https://drishti-intel.vercel.app"
            className="relative font-mono text-center"
            style={{
              display: 'block',
              padding: '12px 0',
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.3)',
              fontSize: 9,
              fontWeight: 700,
              color: '#00d4ff',
              letterSpacing: '0.15em',
              textDecoration: 'none',
            }}
          >
            <Corners color="#00d4ff" size={7} />
            🌍 FULL WAR ROOM
          </a>
          <a
            href="/nfc"
            className="relative font-mono text-center"
            style={{
              display: 'block',
              padding: '12px 0',
              background: 'var(--c-panel)',
              border: '1px solid var(--c-border)',
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--c-muted)',
              letterSpacing: '0.15em',
              textDecoration: 'none',
            }}
          >
            <Corners color="var(--c-muted)" size={7} />
            📱 NFC BRIEFING
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
