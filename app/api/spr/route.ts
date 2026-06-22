import { NextResponse } from 'next/server'
import { analyzeSPRStrategy } from '@/lib/claude'

export async function POST(req: Request) {
  const { crisisType, daysOfCover, dailyDemand } = await req.json()
  const result = await analyzeSPRStrategy(crisisType, daysOfCover, dailyDemand)
  return NextResponse.json(result)
}
