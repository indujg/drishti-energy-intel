import { Telegraf } from 'telegraf'
import { MOCK_NEWS, INDIA_IMPORT_STATS, SIMULATION_SCENARIOS } from '../lib/mock-data'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const riskLabel = (score: number) =>
  score >= 70 ? '🔴 CRITICAL' : score >= 45 ? '🟠 HIGH' : '🟡 ELEVATED'

bot.command('start', ctx => {
  ctx.reply(
    `🛢️ *DRISHTI — India Energy Security Intelligence*\n\n` +
    `Real-time oil supply chain monitoring for India.\n\n` +
    `Commands:\n` +
    `/risk — Current supply risk assessment\n` +
    `/vessels — Active tanker count\n` +
    `/spr — Strategic Petroleum Reserve status\n` +
    `/simulate <scenario> — Run crisis simulation\n` +
    `/news — Latest geopolitical intelligence\n` +
    `/price — Current Brent crude price`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('risk', ctx => {
  ctx.reply(
    `*🌐 Supply Corridor Risk Assessment*\n\n` +
    `*Strait of Hormuz:* 🔴 78/100\n` +
    `_20M bbl/day · US-Iran tensions elevated_\n\n` +
    `*Red Sea (Bab-el-Mandeb):* 🟠 65/100\n` +
    `_8M bbl/day · Houthi drone threat active_\n\n` +
    `*Cape of Good Hope:* 🟢 12/100\n` +
    `_4M bbl/day · Operational_\n\n` +
    `*Overall India Supply Risk:* 🟠 58/100\n` +
    `_${INDIA_IMPORT_STATS.dailyImports}M bbl/day imports · ${INDIA_IMPORT_STATS.sprDays} days SPR cover_`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('vessels', ctx => {
  ctx.reply(
    `*🚢 Active Vessel Tracking*\n\n` +
    `Total tracked: *12 vessels*\n` +
    `⚠️ In risk zones: *7 vessels*\n` +
    `🔴 Hormuz corridor: *4 VLCCs*\n` +
    `🟠 Red Sea corridor: *3 vessels*\n` +
    `🟢 Cape route: *2 vessels*\n` +
    `🔵 Safe waters: *3 vessels*\n\n` +
    `Total cargo: ~47M barrels en route to India`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('spr', ctx => {
  const { sprDays, sprCapacity, sprCurrent, dailyImports } = INDIA_IMPORT_STATS
  ctx.reply(
    `*🏭 Strategic Petroleum Reserve*\n\n` +
    `Current cover: *${sprDays} days*\n` +
    `SPR volume: *${sprCurrent}M / ${sprCapacity}M barrels*\n` +
    `Daily demand: *${dailyImports}M barrels/day*\n\n` +
    `⚠️ *ALERT:* Below 10-day threshold\n` +
    `Recommendation: Authorize 2M bbl drawdown\n` +
    `+ Begin emergency procurement from West Africa`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('simulate', ctx => {
  const args = ctx.message.text.split(' ').slice(1).join('_').toLowerCase()
  const scenario = SIMULATION_SCENARIOS[args as keyof typeof SIMULATION_SCENARIOS]
    ?? SIMULATION_SCENARIOS.hormuz_closure

  ctx.reply(
    `*${scenario.icon} SIMULATION: ${scenario.name.toUpperCase()}*\n\n` +
    `📊 *Impact Analysis:*\n` +
    `• Brent crude: *+${scenario.impacts.priceChange}%*\n` +
    `• Transit delay: *+${scenario.impacts.transitDelayDays} days*\n` +
    `• Supply disruption: *${scenario.impacts.affectedVolume}%*\n` +
    `• GDP impact: *${scenario.impacts.gdpImpact}%*\n` +
    `• Power sector stress: *+${scenario.impacts.powerSectorStress}%*\n\n` +
    `🔄 *Alternative Routes:*\n` +
    scenario.alternatives.map(a =>
      `• ${a.route}: ${a.viability}% viable · ${a.extraCost} · ${a.capacity} capacity`
    ).join('\n') +
    `\n\n📱 View full simulation: https://drishti.vercel.app`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('news', ctx => {
  const top3 = MOCK_NEWS.slice(0, 3)
  ctx.reply(
    `*📰 Geopolitical Intelligence Feed*\n\n` +
    top3.map(n =>
      `${riskLabel(n.risk)} *[${n.corridor}]*\n${n.headline}\n_${n.source} · ${n.time}_`
    ).join('\n\n'),
    { parse_mode: 'Markdown' }
  )
})

bot.command('price', ctx => {
  const price = INDIA_IMPORT_STATS.brentPrice
  ctx.reply(
    `*💹 Brent Crude Spot Price*\n\n` +
    `Current: *$${price}/bbl*\n` +
    `24h Change: *+$${INDIA_IMPORT_STATS.priceChange24h} (+2.7%)*\n` +
    `India import cost (today): *~$${(price * INDIA_IMPORT_STATS.dailyImports * 1e6 / 1e9).toFixed(1)}B*\n\n` +
    `_Updated: ${new Date().toLocaleTimeString()}_`,
    { parse_mode: 'Markdown' }
  )
})

export async function sendCrisisAlert(scenario: string, riskScore: number) {
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) return
  await bot.telegram.sendMessage(
    chatId,
    `🚨 *DRISHTI CRISIS ALERT*\n\n` +
    `Scenario: *${scenario}*\n` +
    `Risk Level: *${riskScore}/100*\n` +
    `Time: ${new Date().toUTCString()}\n\n` +
    `Immediate action required. View war room for full analysis.`,
    { parse_mode: 'Markdown' }
  )
}

if (require.main === module) {
  bot.launch()
  console.log('🤖 DRISHTI Telegram bot running...')
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

export default bot
