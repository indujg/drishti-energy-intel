'use client'

import { useEffect, useState } from 'react'
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import { INDIA_IMPORT_STATS, MOCK_NEWS } from '@/lib/mock-data'

export default function NFCBriefing() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const topNews = MOCK_NEWS.slice(0, 3)
  const overallRisk = 58

  return (
    <div className="min-h-screen bg-[#050914] flex flex-col p-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl">
          🛢️
        </div>
        <div>
          <h1 className="text-lg font-black text-orange-400 tracking-widest">DRISHTI</h1>
          <p className="text-[10px] text-slate-600">{time.toUTCString().slice(0, 25)}</p>
        </div>
        <div className="ml-auto">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-[#0a0e1a] border border-orange-500/30 rounded-2xl p-5 mb-4 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Overall Supply Risk</p>
        <div className="text-7xl font-black text-orange-400 tabular-nums mb-1">{overallRisk}</div>
        <div className="text-sm text-orange-300 font-semibold">🟠 ELEVATED</div>
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full w-full" />
          <div className="relative h-3 mt-1">
            <div className="absolute w-0.5 h-3 bg-white top-0" style={{ left: `${overallRisk}%` }} />
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3">
          <TrendingUp className="w-4 h-4 text-orange-400 mb-1" />
          <p className="text-xl font-black text-orange-400">${INDIA_IMPORT_STATS.brentPrice}</p>
          <p className="text-[10px] text-slate-500">Brent Crude / bbl</p>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3">
          <Shield className="w-4 h-4 text-yellow-400 mb-1" />
          <p className="text-xl font-black text-yellow-400">{INDIA_IMPORT_STATS.sprDays}d</p>
          <p className="text-[10px] text-slate-500">SPR Days Cover</p>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-1">Hormuz Risk</p>
          <p className="text-xl font-black text-red-400">78<span className="text-sm text-slate-500">/100</span></p>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-1">Vessels Tracked</p>
          <p className="text-xl font-black text-blue-400">12</p>
        </div>
      </div>

      {/* Top Alerts */}
      <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Active Alerts</p>
        </div>
        <div className="space-y-2">
          {topNews.map(n => (
            <div key={n.id} className="border-l-2 border-red-500/50 pl-2">
              <p className="text-[11px] text-slate-300 leading-tight">{n.headline}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{n.source} · Risk {n.risk}/100</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <a
        href="/"
        className="w-full py-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-center text-sm font-semibold text-orange-400 hover:bg-orange-500/30 transition-colors"
      >
        Open Full War Room →
      </a>

      <p className="text-center text-[9px] text-slate-700 mt-4">
        Accessed via NFC · DRISHTI v1.0 · MoPNG
      </p>
    </div>
  )
}
