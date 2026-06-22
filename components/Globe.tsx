'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Vessel {
  id: string; name: string; lat: number; lng: number
  speed: number; type: string; cargo: string
  origin: string; destination: string; eta: string; riskZone: string
}

interface SimulationState {
  active: boolean
  scenarioId: string | null
  rerouting: boolean
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

export default function Globe({ vessels, simulation, onVesselClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const initGlobe = useCallback(async () => {
    if (!containerRef.current || globeRef.current) return

    const GlobeGL = (await import('react-globe.gl')).default

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globe = (GlobeGL as any)()
    globe(containerRef.current)

    globe
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(containerRef.current.offsetWidth)
      .height(containerRef.current.offsetHeight)
      .pointOfView({ lat: 20, lng: 70, altitude: 2.0 })
      .atmosphereColor('#1e40af')
      .atmosphereAltitude(0.15)

    // Arcs for shipping routes
    const arcsData = [
      { startLat: 26.5, startLng: 56.3, endLat: 22.7, endLng: 69.8, color: '#ef4444', label: 'Hormuz Route' },
      { startLat: 12.5, startLng: 44.8, endLat: 22.7, endLng: 69.8, color: '#f97316', label: 'Red Sea Route' },
      { startLat: -34.2, startLng: 18.4, endLat: 22.7, endLng: 69.8, color: '#22c55e', label: 'Cape Route' },
      { startLat: 26.5, startLng: 56.3, endLat: 19.1, endLng: 72.8, color: '#ef4444', label: 'Hormuz → Mumbai' },
      { startLat: 26.5, startLng: 56.3, endLat: 17.4, endLng: 83.3, color: '#ef4444', label: 'Hormuz → Vizag' },
    ]

    globe
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .arcStroke(1.5)
      .arcAltitudeAutoScale(0.3)

    // India ports as rings
    const portsData = [
      { lat: 19.1, lng: 72.8, label: 'Mumbai', color: '#f97316' },
      { lat: 22.7, lng: 69.8, label: 'Vadinar', color: '#f97316' },
      { lat: 9.9, lng: 76.3, label: 'Kochi', color: '#f97316' },
      { lat: 17.4, lng: 83.3, label: 'Visakhapatnam', color: '#f97316' },
      { lat: 20.3, lng: 86.6, label: 'Paradip', color: '#f97316' },
    ]

    globe
      .ringsData(portsData)
      .ringColor(() => '#f97316')
      .ringMaxRadius(3)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1000)

    globeRef.current = globe
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    initGlobe()
    return () => {
      if (globeRef.current) {
        globeRef.current._destructor?.()
        globeRef.current = null
      }
    }
  }, [initGlobe])

  useEffect(() => {
    if (!globeRef.current || !isLoaded) return

    const points = vessels.map(v => ({
      lat: v.lat,
      lng: v.lng,
      size: v.type === 'VLCC' || v.type === 'ULCC' ? 0.8 : 0.5,
      color: simulation.active && (v.riskZone === 'hormuz' || v.riskZone === 'redsea')
        ? '#ef4444'
        : RISK_COLORS[v.riskZone] ?? '#3b82f6',
      vessel: v,
    }))

    globeRef.current
      .pointsData(points)
      .pointAltitude('size')
      .pointColor('color')
      .pointRadius(0.4)
      .onPointClick((p: { vessel: Vessel }) => onVesselClick(p.vessel))
      .pointLabel((p: { vessel: Vessel }) =>
        `<div style="background:#0f172a;border:1px solid #334155;padding:8px;border-radius:6px;font-size:12px;color:#e2e8f0">
          <b style="color:#f97316">${p.vessel.name}</b><br/>
          Type: ${p.vessel.type}<br/>
          From: ${p.vessel.origin}<br/>
          To: ${p.vessel.destination}<br/>
          ETA: ${p.vessel.eta}
        </div>`
      )
  }, [vessels, simulation, isLoaded, onVesselClick])

  // Animate rerouting on crisis
  useEffect(() => {
    if (!globeRef.current || !simulation.active) return
    if (simulation.scenarioId === 'hormuz_closure') {
      globeRef.current.pointOfView({ lat: 15, lng: 60, altitude: 2.5 }, 2000)
    } else if (simulation.scenarioId === 'redsea_shutdown') {
      globeRef.current.pointOfView({ lat: 10, lng: 45, altitude: 2.5 }, 2000)
    } else if (simulation.scenarioId === 'combined_crisis') {
      globeRef.current.pointOfView({ lat: 20, lng: 55, altitude: 3.5 }, 2000)
    }
  }, [simulation])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050914]">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading DRISHTI Globe...</p>
          </div>
        </div>
      )}
    </div>
  )
}
