'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import CrisisPanel from '@/components/CrisisPanel'
import RiskFeed from '@/components/RiskFeed'
import SPRCountdown from '@/components/SPRCountdown'
import ProcurementPanel from '@/components/ProcurementPanel'
import VesselTable from '@/components/VesselTable'
import PriceChart from '@/components/PriceChart'
import CrisisAlertModal from '@/components/CrisisAlertModal'
import { Shield, Activity, Wifi, Radio, Play } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

interface Vessel {
  id: string; name: string; lat: number; lng: number
  speed: number; type: string; cargo: string
  origin: string; destination: string; eta: string; riskZone: string
}

interface SimulationResult {
  scenario?: {
    name: string
    icon: string
    impacts: {
      priceChange: number; transitDelayDays: number
      affectedVolume: number; sprDaysRemaining: number
      gdpImpact: number; powerSectorStress: number
    }
    alternatives: Array<{ route: string; viability: number; extraDays: number; extraCost: string; capacity: string }>
  }
  procurement?: {
    summary: string
    recommendations: Array<{ supplier: string; volume: string; route: string; cost: string; timeline: string; confidence: number }>
  }
}

interface PendingAlert {
  scenarioId: string
  data: SimulationResult
}

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94, redsea_shutdown: 72, opec_cut: 65, combined_crisis: 99
}

const DEMO_SEQUENCE = ['hormuz_closure', 'combined_crisis'] as const

// ── Corner bracket helper ────────────────────────────────
function Corners({ color = '#00d4ff', size = 10, thickness = 2 }: { color?: string; size?: number; thickness?: number }) {
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

// ── Segmented bar ─────────────────────────────────────────
function SegBar({ value, total = 20, color }: { value: number; total?: number; color: string }) {
  const filled = Math.round((value / 100) * total)
  return (
    <div className="seg-bar">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="seg-bar-segment"
          style={{
            background: i < filled ? color : 'var(--c-xmuted)',
            boxShadow: i < filled ? `0 0 4px ${color}66` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Panel wrapper ─────────────────────────────────────────
function Panel({
  children, title, accentColor = '#00d4ff', className = '', style = {}
}: {
  children: React.ReactNode
  title?: string
  accentColor?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`panel font-mono ${className}`}
      style={{ borderRadius: 2, ...style }}
    >
      <Corners color={accentColor} />
      {title && (
        <div
          style={{
            borderBottom: `1px solid var(--c-border)`,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {title}
          </span>
          <div style={{ flex: 1, height: 1, background: `${accentColor}30` }} />
        </div>
      )}
      {children}
    </div>
  )
}

export default function WarRoom() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [overallRisk, setOverallRisk] = useState(42)
  const [activeTab, setActiveTab] = useState<'procurement' | 'vessels'>('procurement')
  const [liveViewers, setLiveViewers] = useState(1)
  const [rtConnected, setRtConnected] = useState(false)
  const [pendingAlert, setPendingAlert] = useState<PendingAlert | null>(null)
  const [demoRunning, setDemoRunning] = useState(false)
  const sbRef = useRef<SupabaseClient | null>(null)

  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/vessels')
      const data = await res.json()
      setVessels(data.vessels)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchVessels()
    const interval = setInterval(fetchVessels, 8000)
    return () => clearInterval(interval)
  }, [fetchVessels])

  const applySimulation = useCallback((scenarioId: string, data: SimulationResult) => {
    setActiveScenario(scenarioId)
    setSimulationResult(data)
    setOverallRisk(RISK_MAP[scenarioId] ?? 50)
    setPendingAlert(null)
  }, [])

  const clearSimulation = useCallback(() => {
    setActiveScenario(null)
    setSimulationResult(null)
    setOverallRisk(42)
    setPendingAlert(null)
  }, [])

  useEffect(() => {
    const sb = createSupabaseClient()
    if (!sb) return
    sbRef.current = sb

    const simChannel = sb
      .channel('simulation_results')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'simulation_results' },
        (payload) => {
          const row = payload.new as {
            scenario_id: string
            scenario_data: SimulationResult['scenario']
            procurement_data: SimulationResult['procurement']
            active: boolean
          }
          if (row.active) {
            const result: SimulationResult = { scenario: row.scenario_data, procurement: row.procurement_data }
            if (row.scenario_data) {
              setPendingAlert({ scenarioId: row.scenario_id, data: result })
            } else {
              applySimulation(row.scenario_id, result)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'simulation_results' },
        (payload) => {
          const row = payload.new as { active: boolean }
          if (!row.active) clearSimulation()
        }
      )
      .subscribe((status) => setRtConnected(status === 'SUBSCRIBED'))

    const presenceKey = Math.random().toString(36).slice(2)
    const presenceChannel = sb.channel('war_room', {
      config: { presence: { key: presenceKey } },
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setLiveViewers(Object.keys(presenceChannel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ joined_at: new Date().toISOString() })
        }
      })

    return () => {
      sb.removeChannel(simChannel)
      sb.removeChannel(presenceChannel)
    }
  }, [applySimulation, clearSimulation])

  const handleSimulate = useCallback(async (scenarioId: string, data: unknown) => {
    if (scenarioId === 'reset') {
      clearSimulation()
      await fetch('/api/simulate', { method: 'DELETE' }).catch(() => {})
      return
    }
    const result = data as SimulationResult
    if (result?.scenario) {
      setPendingAlert({ scenarioId, data: result })
    } else {
      applySimulation(scenarioId, result)
    }
  }, [applySimulation, clearSimulation])

  const runDemo = useCallback(async () => {
    if (demoRunning) return
    setDemoRunning(true)
    clearSimulation()
    await fetch('/api/simulate', { method: 'DELETE' }).catch(() => {})

    for (let i = 0; i < DEMO_SEQUENCE.length; i++) {
      const sid = DEMO_SEQUENCE[i]
      if (i > 0) await new Promise(r => setTimeout(r, 10000))
      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: sid }),
        })
        const data = await res.json()
        setPendingAlert({ scenarioId: sid, data })
      } catch { /* use mock fallback */ }
    }
    setDemoRunning(false)
  }, [demoRunning, clearSimulation])

  const riskColor =
    overallRisk >= 80 ? '#ff3232' :
    overallRisk >= 60 ? '#ffb800' :
    overallRisk >= 40 ? '#ffb800' : '#00ff87'

  const riskLabel =
    overallRisk >= 80 ? 'CRITICAL' :
    overallRisk >= 60 ? 'HIGH' :
    overallRisk >= 40 ? 'ELEVATED' : 'NOMINAL'

  return (
    <div
      className="h-screen flex flex-col font-mono overflow-hidden"
      style={{ background: 'var(--c-bg)' }}
    >
      <CrisisAlertModal
        scenario={pendingAlert?.data?.scenario ?? null}
        onDismiss={() => {
          if (pendingAlert) applySimulation(pendingAlert.scenarioId, pendingAlert.data)
        }}
      />

      {/* ── HEADER ─────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-4 px-4 py-2"
        style={{
          borderBottom: '1px solid var(--c-border)',
          background: '#020e0e',
          minHeight: 44,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            style={{
              width: 28, height: 28,
              border: '1px solid #00d4ff66',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, position: 'relative',
            }}
          >
            <Corners color="#00d4ff" size={6} thickness={1.5} />
            🛢️
          </div>
          <div>
            <h1
              className="font-mono font-bold tracking-widest"
              style={{ fontSize: 14, color: '#00d4ff', textShadow: '0 0 10px #00d4ff88', lineHeight: 1.1 }}
            >
              DRISHTI
            </h1>
            <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              दृष्टि · INDIA ENERGY INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Risk badge */}
        <div
          className="flex items-center gap-2 px-3 py-1 font-mono shrink-0"
          style={{
            border: `1px solid ${riskColor}44`,
            background: `${riskColor}0d`,
            fontSize: 10,
          }}
        >
          <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor, display: 'inline-block', boxShadow: `0 0 6px ${riskColor}` }} />
          <span style={{ color: riskColor, fontWeight: 700, letterSpacing: '0.15em' }}>{riskLabel}</span>
          <span style={{ color: 'var(--c-muted)', marginLeft: 2 }}>CTI:</span>
          <span style={{ color: riskColor, fontWeight: 700 }}>{overallRisk}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Demo button */}
        <button
          onClick={runDemo}
          disabled={demoRunning}
          className="font-mono flex items-center gap-1.5 cursor-pointer"
          style={{
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: `1px solid ${demoRunning ? '#0a3535' : '#00d4ff44'}`,
            background: demoRunning ? 'transparent' : '#00d4ff0d',
            color: demoRunning ? 'var(--c-muted)' : '#00d4ff',
            padding: '4px 10px',
            cursor: demoRunning ? 'not-allowed' : 'pointer',
            position: 'relative',
          }}
        >
          {!demoRunning && <Corners color="#00d4ff" size={6} thickness={1} />}
          <Play style={{ width: 10, height: 10 }} />
          {demoRunning ? 'DEMO RUNNING...' : '▶ DEMO MODE'}
        </button>

        {/* RT status */}
        {rtConnected && (
          <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 9, color: '#00ff87' }}>
            <Radio style={{ width: 10, height: 10 }} className="blink-slow" />
            <span style={{ letterSpacing: '0.15em' }}>LIVE SYNC</span>
            <span style={{ color: 'var(--c-muted)' }}>· {liveViewers}×</span>
          </div>
        )}

        {/* Vessel count */}
        <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 9, color: 'var(--c-muted)' }}>
          <Wifi style={{ width: 10, height: 10, color: '#00ff87' }} />
          <span>{vessels.length} VESSELS</span>
        </div>

        {/* AI */}
        <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 9, color: 'var(--c-muted)' }}>
          <Activity style={{ width: 10, height: 10, color: '#00d4ff' }} />
          <span>AI:ACTIVE</span>
        </div>

        {/* MoPNG */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono" style={{ fontSize: 9, color: 'var(--c-muted)' }}>
          <Shield style={{ width: 10, height: 10, color: '#ffb800' }} />
          <span>MOPNG</span>
        </div>

        {/* Clock */}
        <span className="hidden xl:block font-mono" style={{ fontSize: 8, color: 'var(--c-xmuted)', letterSpacing: '0.08em' }}>
          {new Date().toUTCString().slice(0, 25)}
        </span>
      </header>

      {/* ── MAIN LAYOUT ────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left column */}
        <div
          className="shrink-0 flex flex-col gap-3 p-3 overflow-y-auto scrollbar-thin"
          style={{ width: 280, borderRight: '1px solid var(--c-border)' }}
        >
          <PriceChart
            crisisActive={!!activeScenario}
            priceImpact={simulationResult?.scenario?.impacts.priceChange ?? 0}
          />
          <SPRCountdown
            crisisActive={!!activeScenario}
            priceImpact={simulationResult?.scenario?.impacts.priceChange ?? 0}
          />
          <CrisisPanel onSimulate={handleSimulate} activeScenario={activeScenario} />
        </div>

        {/* Globe center */}
        <div className="flex-1 relative min-w-0">
          <Globe
            vessels={vessels}
            simulation={{ active: !!activeScenario, scenarioId: activeScenario, rerouting: false }}
            onVesselClick={setSelectedVessel}
          />

          {/* Corridor risk badges */}
          <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
            {[
              { label: 'HORMUZ', risk: 78, color: '#ff3232' },
              { label: 'RED SEA', risk: 65, color: '#ffb800' },
              { label: 'CAPE',   risk: 12, color: '#00ff87' },
            ].map((r) => (
              <div
                key={r.label}
                className="font-mono flex items-center gap-2"
                style={{
                  background: '#020c0c',
                  border: `1px solid ${r.color}44`,
                  padding: '4px 10px',
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  position: 'relative',
                }}
              >
                <Corners color={r.color} size={5} thickness={1} />
                <span className="blink" style={{ width: 5, height: 5, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                <span style={{ color: 'var(--c-muted)' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 700 }}>{r.risk}</span>
              </div>
            ))}
          </div>

          {/* Vessel popup */}
          {selectedVessel && (
            <div
              className="absolute top-4 font-mono"
              style={{
                left: '50%', transform: 'translateX(-50%)',
                background: '#020c0c',
                border: '1px solid #00d4ff44',
                padding: 14,
                minWidth: 220,
                maxWidth: 280,
                zIndex: 10,
                position: 'absolute',
              }}
            >
              <Corners color="#00d4ff" size={8} />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em' }}>
                    ASSET: {selectedVessel.name}
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--c-muted)', marginTop: 2 }}>
                    {selectedVessel.type.toUpperCase()} · {selectedVessel.cargo.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVessel(null)}
                  style={{ color: 'var(--c-muted)', fontSize: 16, lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none', marginLeft: 10 }}
                >
                  ×
                </button>
              </div>
              <div className="space-y-1" style={{ fontSize: 10 }}>
                {[
                  ['FROM', selectedVessel.origin],
                  ['TO', selectedVessel.destination],
                  ['ETA', selectedVessel.eta],
                  ['SPEED', `${selectedVessel.speed.toFixed(1)} KTS`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span style={{ color: 'var(--c-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--c-text)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crisis active banner */}
          {activeScenario && simulationResult?.scenario && (
            <div
              className="absolute top-4 right-4 font-mono"
              style={{
                background: 'rgba(255,50,50,0.07)',
                border: '1px solid #ff323244',
                padding: '10px 14px',
                maxWidth: 260,
                zIndex: 10,
                position: 'absolute',
              }}
            >
              <Corners color="#ff3232" size={7} />
              <div className="flex items-center gap-2 mb-1">
                <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3232', display: 'inline-block', boxShadow: '0 0 6px #ff3232' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#ff3232', letterSpacing: '0.2em' }}>CRISIS SIM ACTIVE</span>
              </div>
              <p style={{ fontSize: 10, color: 'var(--c-text)', marginBottom: 4 }}>{simulationResult.scenario.name.toUpperCase()}</p>
              <p style={{ fontSize: 9, color: '#ff3232', fontWeight: 700 }}>
                BRENT +{simulationResult.scenario.impacts.priceChange}% · {simulationResult.scenario.impacts.affectedVolume}% SUPPLY
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: 320, borderLeft: '1px solid var(--c-border)' }}
        >
          {/* Tab row */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
            {(['procurement', 'vessels'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 font-mono cursor-pointer"
                style={{
                  padding: '8px 0',
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  background: activeTab === tab ? '#00d4ff0d' : 'transparent',
                  color: activeTab === tab ? '#00d4ff' : 'var(--c-muted)',
                  borderBottom: activeTab === tab ? '2px solid #00d4ff' : '2px solid transparent',
                  borderRight: 'none',
                  borderLeft: 'none',
                  borderTop: 'none',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'procurement' ? 'AI PROCUREMENT' : 'VESSELS'}
              </button>
            ))}
          </div>

          {/* Scrollable main */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 scrollbar-thin">
            {activeTab === 'procurement' ? (
              <ProcurementPanel simulationResult={simulationResult} activeScenario={activeScenario} />
            ) : (
              <VesselTable vessels={vessels} selectedVessel={selectedVessel} crisisActive={!!activeScenario} />
            )}
          </div>

          {/* Risk feed */}
          <div
            className="shrink-0 p-3 overflow-hidden"
            style={{ borderTop: '1px solid var(--c-border)', height: 256 }}
          >
            <RiskFeed />
          </div>
        </div>
      </div>
    </div>
  )
}
