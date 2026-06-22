import { NextResponse } from 'next/server'
import { SIMULATION_SCENARIOS } from '@/lib/mock-data'
import { generateProcurementPlan } from '@/lib/claude'

export async function POST(req: Request) {
  const { scenarioId } = await req.json()
  const scenario = SIMULATION_SCENARIOS[scenarioId as keyof typeof SIMULATION_SCENARIOS]

  if (!scenario) {
    return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 })
  }

  const procurement = await generateProcurementPlan(
    scenario.name,
    scenario.impacts.affectedVolume,
    scenario.impacts.priceChange
  )

  return NextResponse.json({
    scenario,
    procurement,
    timestamp: new Date().toISOString(),
  })
}
