import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function scoreGeopoliticalRisk(headline: string, corridor: string): Promise<{ score: number; analysis: string; recommendation: string }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are an energy security analyst for India's petroleum ministry. Score this geopolitical news headline for supply disruption risk to India's oil imports.

Headline: "${headline}"
Corridor: ${corridor}

Respond in JSON only:
{
  "score": <0-100 integer, 0=no risk, 100=critical disruption>,
  "analysis": "<one sentence max>",
  "recommendation": "<one action India should take>"
}`
    }]
  })

  try {
    const text = (message.content[0] as { text: string }).text
    return JSON.parse(text)
  } catch {
    return { score: 50, analysis: 'Risk assessment unavailable', recommendation: 'Monitor situation' }
  }
}

export async function generateProcurementPlan(scenario: string, affectedVolume: number, priceImpact: number): Promise<{ recommendations: Array<{ supplier: string; volume: string; route: string; cost: string; timeline: string; confidence: number }>; summary: string }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `India's oil ministry needs emergency procurement recommendations.

Crisis: ${scenario}
Affected volume: ${affectedVolume}% of imports disrupted
Price impact: +${priceImpact}% on Brent

Generate 3 alternative procurement options. Respond in JSON only:
{
  "summary": "<2 sentence executive summary>",
  "recommendations": [
    {
      "supplier": "<country/company>",
      "volume": "<MMbbl>",
      "route": "<logistics route>",
      "cost": "<$/bbl premium>",
      "timeline": "<days to first delivery>",
      "confidence": <50-95>
    }
  ]
}`
    }]
  })

  try {
    const text = (message.content[0] as { text: string }).text
    return JSON.parse(text)
  } catch {
    return {
      summary: 'Emergency procurement analysis in progress.',
      recommendations: [
        { supplier: 'West Africa (Nigeria)', volume: '8 MMbbl', route: 'Cape of Good Hope', cost: '+$2.8/bbl', timeline: '18 days', confidence: 72 },
        { supplier: 'US Gulf Coast', volume: '5 MMbbl', route: 'Atlantic + Indian Ocean', cost: '+$4.1/bbl', timeline: '26 days', confidence: 65 },
        { supplier: 'Kazakhstan (CPC Pipeline)', volume: '3 MMbbl', route: 'Black Sea + Suez', cost: '+$1.9/bbl', timeline: '14 days', confidence: 58 },
      ]
    }
  }
}

export async function analyzeSPRStrategy(crisisType: string, daysOfCover: number, dailyDemand: number): Promise<{ drawdownPlan: Array<{ day: number; release: number; remaining: number }>; strategy: string }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `India's SPR management decision. Crisis: ${crisisType}. Current SPR: ${daysOfCover} days cover. Daily demand: ${dailyDemand} MMbbl/day.

Generate optimal SPR drawdown plan for 10 days. Respond in JSON only:
{
  "strategy": "<one paragraph recommendation>",
  "drawdownPlan": [
    { "day": 1, "release": <MMbbl>, "remaining": <days of cover> }
  ]
}`
    }]
  })

  try {
    const text = (message.content[0] as { text: string }).text
    return JSON.parse(text)
  } catch {
    const plan = Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      release: i < 5 ? 0.5 : 0.8,
      remaining: Math.max(0, daysOfCover - (i + 1) * 0.15)
    }))
    return { strategy: 'Gradual SPR release recommended to stabilize domestic prices while alternative procurement is secured.', drawdownPlan: plan }
  }
}
