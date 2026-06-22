'use client'

import { CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'

interface Recommendation {
  supplier: string; volume: string; route: string
  cost: string; timeline: string; confidence: number
}

interface SimulationResult {
  scenario?: {
    name: string
    impacts: {
      priceChange: number
      transitDelayDays: number
      affectedVolume: number
      sprDaysRemaining: number
      gdpImpact: number
      powerSectorStress: number
    }
    alternatives: Array<{ route: string; viability: number; extraDays: number; extraCost: string; capacity: string }>
  }
  procurement?: { summary: string; recommendations: Recommendation[] }
}

interface ProcurementPanelProps {
  simulationResult: SimulationResult | null
  activeScenario: string | null
}

export default function ProcurementPanel({ simulationResult, activeScenario }: ProcurementPanelProps) {
  if (!activeScenario || !simulationResult) {
    return (
      <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center h-40">
        <CheckCircle className="w-8 h-8 text-slate-700 mb-2" />
        <p className="text-slate-600 text-sm">No active crisis</p>
        <p className="text-slate-700 text-xs mt-1">Trigger a simulation above to see AI recommendations</p>
      </div>
    )
  }

  const { scenario, procurement } = simulationResult

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">AI Procurement Intelligence</h3>
        <span className="ml-auto text-[10px] text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
          {scenario?.name}
        </span>
      </div>

      {/* Impact Summary */}
      {scenario && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Price Impact', value: `+${scenario.impacts.priceChange}%`, color: 'text-red-400' },
            { label: 'Delay', value: scenario.impacts.transitDelayDays > 0 ? `+${scenario.impacts.transitDelayDays}d` : 'None', color: 'text-orange-400' },
            { label: 'GDP Hit', value: `${scenario.impacts.gdpImpact}%`, color: 'text-yellow-400' },
            { label: 'Vol. Affected', value: `${scenario.impacts.affectedVolume}%`, color: 'text-red-400' },
            { label: 'Power Stress', value: `+${scenario.impacts.powerSectorStress}%`, color: 'text-orange-400' },
            { label: 'SPR Left', value: `${scenario.impacts.sprDaysRemaining}d`, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900/60 rounded-lg p-2 text-center">
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {procurement?.summary && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-[11px] text-purple-300 leading-relaxed">{procurement.summary}</p>
        </div>
      )}

      {/* Alternative Routes */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Alternative Procurement Options
        </p>
        <div className="space-y-2">
          {(procurement?.recommendations ?? scenario?.alternatives?.map(a => ({
            supplier: a.route,
            volume: a.capacity,
            route: a.route,
            cost: a.extraCost,
            timeline: `${a.extraDays} days`,
            confidence: a.viability,
          })) ?? []).map((rec, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-200">{rec.supplier}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{rec.volume}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[9px] text-orange-400">
                      <TrendingUp className="w-2.5 h-2.5" />{rec.cost}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                      <Clock className="w-2.5 h-2.5" />{rec.timeline}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-400">{rec.confidence}%</p>
                  <p className="text-[9px] text-slate-600">viability</p>
                </div>
              </div>
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full"
                  style={{ width: `${rec.confidence}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
