import { NextResponse } from 'next/server'
import { MOCK_VESSELS } from '@/lib/mock-data'

export async function GET() {
  // Try AISHub API first, fall back to mock data
  try {
    const apiKey = process.env.AISHUB_API_KEY
    if (apiKey) {
      const res = await fetch(
        `https://data.aishub.net/ws.php?username=${apiKey}&format=1&output=json&compress=0&latmin=0&latmax=30&lonmin=40&lonmax=75`,
        { next: { revalidate: 60 } }
      )
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ vessels: data, source: 'live' })
      }
    }
  } catch { /* fall through to mock */ }

  // Add slight random drift to mock positions to simulate movement
  const animated = MOCK_VESSELS.map(v => ({
    ...v,
    lat: v.lat + (Math.random() - 0.5) * 0.05,
    lng: v.lng + (Math.random() - 0.5) * 0.05,
    speed: v.speed + (Math.random() - 0.5) * 0.5,
  }))

  return NextResponse.json({ vessels: animated, source: 'mock' })
}
