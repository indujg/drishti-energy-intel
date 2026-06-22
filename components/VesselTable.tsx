'use client'

import { Ship } from 'lucide-react'

interface Vessel {
  id: string; name: string; lat: number; lng: number
  speed: number; type: string; cargo: string
  origin: string; destination: string; eta: string; riskZone: string
}

const RISK_BADGE: Record<string, string> = {
  hormuz: 'bg-red-500/20 text-red-400 border-red-500/30',
  redsea: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cape: 'bg-green-500/20 text-green-400 border-green-500/30',
  safe: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

interface VesselTableProps {
  vessels: Vessel[]
  selectedVessel: Vessel | null
  crisisActive: boolean
}

export default function VesselTable({ vessels, selectedVessel, crisisActive }: VesselTableProps) {
  const sorted = [...vessels].sort((a, b) => {
    const riskOrder: Record<string, number> = { hormuz: 0, redsea: 1, cape: 2, safe: 3 }
    return (riskOrder[a.riskZone] ?? 4) - (riskOrder[b.riskZone] ?? 4)
  })

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ship className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Tracked Vessels</h3>
        <span className="ml-auto text-[10px] text-slate-500">{vessels.length} active</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] text-slate-600 uppercase tracking-wider border-b border-slate-800">
              <th className="text-left pb-2 pr-3">Vessel</th>
              <th className="text-left pb-2 pr-3">Type</th>
              <th className="text-left pb-2 pr-3">Route</th>
              <th className="text-right pb-2 pr-3">Speed</th>
              <th className="text-left pb-2">Zone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sorted.map(v => (
              <tr
                key={v.id}
                className={`transition-colors ${selectedVessel?.id === v.id ? 'bg-orange-500/5' : 'hover:bg-slate-800/30'}
                  ${crisisActive && (v.riskZone === 'hormuz' || v.riskZone === 'redsea') ? 'opacity-60' : ''}`}
              >
                <td className="py-1.5 pr-3">
                  <p className="font-medium text-slate-300 truncate max-w-[120px]">{v.name}</p>
                  <p className="text-[9px] text-slate-600 truncate max-w-[120px]">ETA: {v.eta}</p>
                </td>
                <td className="py-1.5 pr-3 text-slate-500">{v.type}</td>
                <td className="py-1.5 pr-3">
                  <p className="text-slate-400 truncate max-w-[100px]">{v.origin.split(',')[0]}</p>
                  <p className="text-[9px] text-slate-600">→ {v.destination.split(',')[0]}</p>
                </td>
                <td className="py-1.5 pr-3 text-right text-slate-400">{v.speed.toFixed(1)}kn</td>
                <td className="py-1.5">
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-medium ${RISK_BADGE[v.riskZone] ?? RISK_BADGE.safe}`}>
                    {v.riskZone === 'hormuz' ? 'HORMUZ' : v.riskZone === 'redsea' ? 'RED SEA' : v.riskZone === 'cape' ? 'CAPE' : 'SAFE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
