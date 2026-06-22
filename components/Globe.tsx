'use client'

import { useRef, useEffect, useMemo, useState } from 'react'

type TrailPoint = [number, number]
interface Trail { path: TrailPoint[]; color: string }

// Offset pointing "backwards" along each zone's typical approach vector
const ZONE_BACK: Record<string, TrailPoint> = {
  hormuz: [0.22,  -0.30],
  redsea: [-0.20, -0.28],
  cape:   [-0.18, -0.26],
  safe:   [-0.10, -0.14],
}
import GlobeGL from 'react-globe.gl'

interface Vessel {
  id: string; name: string; lat: number; lng: number
  speed: number; type: string; cargo: string
  origin: string; destination: string; eta: string; riskZone: string
}

interface SimulationState {
  active: boolean; scenarioId: string | null; rerouting: boolean
}

interface GlobeProps {
  vessels: Vessel[]
  simulation: SimulationState
  onVesselClick: (v: Vessel) => void
}

const RISK_COLORS: Record<string, string> = {
  hormuz: '#ef4444',
  redsea: '#f97316',
  cape: '#22c55e',
  safe: '#3b82f6',
}

const ARCS = [
  { startLat: 26.5, startLng: 56.3, endLat: 22.7, endLng: 69.8, color: '#ef4444', label: 'Hormuz → Vadinar' },
  { startLat: 12.5, startLng: 44.8, endLat: 22.7, endLng: 69.8, color: '#f97316', label: 'Red Sea → India' },
  { startLat: -34.2, startLng: 18.4, endLat: 22.7, endLng: 69.8, color: '#22c55e', label: 'Cape → India' },
  { startLat: 26.5, startLng: 56.3, endLat: 19.1, endLng: 72.8, color: '#ef4444', label: 'Hormuz → Mumbai' },
  { startLat: 26.5, startLng: 56.3, endLat: 17.4, endLng: 83.3, color: '#ef4444', label: 'Hormuz → Vizag' },
]

const PORTS = [
  { lat: 19.1, lng: 72.8, label: 'Mumbai' },
  { lat: 22.7, lng: 69.8, label: 'Vadinar' },
  { lat: 9.9,  lng: 76.3, label: 'Kochi' },
  { lat: 17.4, lng: 83.3, label: 'Visakhapatnam' },
  { lat: 20.3, lng: 86.6, label: 'Paradip' },
]

export default function Globe({ vessels, simulation, onVesselClick }: GlobeProps) {
  const globeEl = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [trails, setTrails] = useState<Trail[]>([])
  const histRef = useRef<Map<string, TrailPoint[]>>(new Map())
  const seeded = useRef(false)

  // Measure container so globe fills it exactly
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setDims({ w: el.offsetWidth, h: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Initial camera position
  useEffect(() => {
    if (!globeEl.current) return
    globeEl.current.pointOfView({ lat: 20, lng: 65, altitude: 2.2 }, 0)
  }, [])

  // Animate camera on crisis
  useEffect(() => {
    if (!globeEl.current) return
    if (!simulation.active) {
      globeEl.current.pointOfView({ lat: 20, lng: 65, altitude: 2.2 }, 1500)
      return
    }
    const views: Record<string, { lat: number; lng: number; altitude: number }> = {
      hormuz_closure: { lat: 26, lng: 57, altitude: 2.0 },
      redsea_shutdown: { lat: 12, lng: 44, altitude: 2.2 },
      opec_cut:        { lat: 24, lng: 46, altitude: 2.5 },
      combined_crisis: { lat: 18, lng: 55, altitude: 3.0 },
    }
    const v = simulation.scenarioId ? views[simulation.scenarioId] : null
    if (v) globeEl.current.pointOfView(v, 2000)
  }, [simulation.active, simulation.scenarioId])

  // Build vessel trail history
  useEffect(() => {
    if (!vessels.length) return

    if (!seeded.current) {
      seeded.current = true
      vessels.forEach(v => {
        const [dlat, dlng] = ZONE_BACK[v.riskZone] ?? [-0.1, -0.14]
        histRef.current.set(v.id, [
          [v.lat + dlat * 4, v.lng + dlng * 4],
          [v.lat + dlat * 3, v.lng + dlng * 3],
          [v.lat + dlat * 2, v.lng + dlng * 2],
          [v.lat + dlat,     v.lng + dlng],
          [v.lat, v.lng],
        ])
      })
    } else {
      vessels.forEach(v => {
        const hist = histRef.current.get(v.id) ?? [[v.lat, v.lng] as TrailPoint]
        const last = hist[hist.length - 1]
        if (Math.abs(last[0] - v.lat) > 0.04 || Math.abs(last[1] - v.lng) > 0.04) {
          hist.push([v.lat, v.lng])
          if (hist.length > 8) hist.shift()
          histRef.current.set(v.id, hist)
        }
      })
    }

    setTrails(
      vessels
        .map(v => {
          const hist = histRef.current.get(v.id)
          if (!hist || hist.length < 2) return null
          return { path: [...hist] as TrailPoint[], color: RISK_COLORS[v.riskZone] ?? '#3b82f6' }
        })
        .filter((x): x is Trail => x !== null)
    )
  }, [vessels])

  const points = useMemo(() => vessels.map(v => ({
    lat: v.lat,
    lng: v.lng,
    size: v.type === 'VLCC' || v.type === 'ULCC' ? 0.7 : 0.5,
    color: simulation.active && (v.riskZone === 'hormuz' || v.riskZone === 'redsea')
      ? '#ef4444'
      : RISK_COLORS[v.riskZone] ?? '#3b82f6',
    vessel: v,
  })), [vessels, simulation.active])

  return (
    <div ref={containerRef} className="w-full h-full">
      <GlobeGL
        ref={globeEl}
        width={dims.w}
        height={dims.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
        // Shipping route arcs
        arcsData={ARCS}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={1.5}
        arcAltitudeAutoScale={0.3}
        // Vessel movement trails
        pathsData={trails}
        pathPoints="path"
        pathColor={(t: any) => t.color}
        pathDashLength={0.4}
        pathDashGap={0.15}
        pathDashAnimateTime={2800}
        pathStroke={0.7}
        // India port rings
        ringsData={PORTS}
        ringColor={() => '#f97316'}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        // Vessel points
        pointsData={points}
        pointAltitude="size"
        pointColor="color"
        pointRadius={0.4}
        onPointClick={(p: any) => onVesselClick(p.vessel)}
        pointLabel={(p: any) => `
          <div style="background:#0f172a;border:1px solid #334155;padding:8px;border-radius:6px;font-size:12px;color:#e2e8f0;min-width:160px">
            <b style="color:#f97316">${p.vessel.name}</b><br/>
            ${p.vessel.type} · ${p.vessel.cargo}<br/>
            <span style="color:#94a3b8">From:</span> ${p.vessel.origin}<br/>
            <span style="color:#94a3b8">To:</span> ${p.vessel.destination}<br/>
            <span style="color:#94a3b8">ETA:</span> ${p.vessel.eta}
          </div>`}
      />
    </div>
  )
}
