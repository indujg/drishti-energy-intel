'use client'

import { useEffect, useState, useRef } from 'react'
import { Shield, TrendingUp, AlertTriangle, Radio } from 'lucide-react'

const BASE_BRENT = 87.42
const CORRIDORS = [
  { name: 'Hormuz', risk: 78, color: '#ef4444', share: '40%' },
  { name: 'Red Sea', risk: 65, color: '#f97316', share: '15%' },
  { name: 'Cape',   risk: 12, color: '#22c55e', share: '18%' },
]

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
    <div className="min-h-screen bg-[#050914] flex flex-col p-4 max-w-sm mx-auto text-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl">
          🛢️
        </div>
        <div>
          <h1 className="text-lg font-black text-orange-400 tracking-widest">DRISHTI</h1>
          <p className="text-[10px] text-slate-600 font-mono">
            {time ? time.toUTCString().slice(0, 25) : '—'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-400">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Risk gauge */}
      <div className="bg-[#0a0e1a] border border-orange-500/25 rounded-2xl p-5 mb-4 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Overall Supply Risk</p>
        <div className="text-7xl font-black text-orange-400 tabular-nums mb-1">{overallRisk}</div>
        <div className="text-sm text-orange-300 font-semibold mb-4">🟠 ELEVATED</div>
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
          <div
            className="absolute top-0 bottom-0 right-0 bg-[#0a0e1a] rounded-full transition-all"
            style={{ width: `${100 - overallRisk}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-700">0 — NORMAL</span>
          <span className="text-[9px] text-slate-700">100 — CRITICAL</span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5">
          <TrendingUp className="w-4 h-4 text-orange-400 mb-1" />
          <p className="text-2xl font-black text-orange-400 tabular-nums">${brent.toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">Brent Crude / bbl</p>
          <p className={`text-[10px] font-bold mt-0.5 ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{pct}%
          </p>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5">
          <Shield className="w-4 h-4 text-yellow-400 mb-1" />
          <p className="text-2xl font-black text-yellow-400">9.5d</p>
          <p className="text-[9px] text-slate-500">SPR Days Cover</p>
          <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: '31.7%' }} />
          </div>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[9px] text-slate-500 mb-1 uppercase">Hormuz Risk</p>
          <p className="text-2xl font-black text-red-400">78<span className="text-sm text-slate-500">/100</span></p>
          <p className="text-[9px] text-slate-500 mt-0.5">40% India supply</p>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[9px] text-slate-500 mb-1 uppercase">Live Vessels</p>
          <p className="text-2xl font-black text-blue-400">{vesselCount}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">tankers tracked</p>
        </div>
      </div>

      {/* Corridor risk */}
      <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5 mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Corridor Risk</p>
        <div className="space-y-2.5">
          {CORRIDORS.map(c => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 w-16">{c.name}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.risk}%`, background: c.color }} />
              </div>
              <span className="text-[11px] font-bold w-6 text-right" style={{ color: c.color }}>{c.risk}</span>
              <span className="text-[9px] text-slate-600 w-8">{c.share}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence feed */}
      {news.length > 0 && (
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3.5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intelligence Feed</p>
          </div>
          <div className="space-y-2.5">
            {news.map(n => (
              <div key={n.id} className="border-l-2 border-red-500/40 pl-2.5">
                <p className="text-[11px] text-slate-300 leading-tight">{n.headline}</p>
                <p className="text-[9px] text-slate-600 mt-0.5">{n.source} · Risk {n.risk}/100</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <a
        href="https://drishti-intel.vercel.app"
        className="w-full py-3.5 bg-orange-500/15 border border-orange-500/35 rounded-xl text-center text-sm font-bold text-orange-400 hover:bg-orange-500/25 transition-colors"
      >
        Open Full War Room →
      </a>

      <p className="text-center text-[9px] text-slate-700 mt-4 font-mono">
        Accessed via NFC · DRISHTI v2.0 · MoPNG
      </p>
    </div>
  )
}
