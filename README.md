# 🛢️ DRISHTI — दृष्टि
### India's AI-Powered Energy Supply Chain Intelligence Platform

> *"India had the data. It didn't have the intelligence layer. DRISHTI is that layer."*

**ET AI Hackathon 2026 · Problem Statement #2 · Supply Chain Intelligence / Energy Security**

---

## The Problem

India imports **88% of its crude oil**. Nearly **40-45% of that volume** transits through the Strait of Hormuz. India's SPR provides only **9.5 days** of cover.

When geopolitical shocks hit — like the 2025 US-Iran standoff (+8% Brent in one session) — India has no real-time intelligence layer. **DRISHTI compresses the response from days to minutes.**

---

## What We Built

### 🌍 Real-Time 3D War Room
- Live oil tanker tracking on a 3D globe (AIS data)
- Shipping route arcs: Hormuz, Red Sea, Cape of Good Hope
- Indian port rings with live arrival monitoring
- Click any tanker for full vessel intelligence

### 💥 One-Click Crisis Simulation

| Scenario | Price Impact | Transit Delay | Supply Hit |
|---|---|---|---|
| 🔴 Hormuz Closure | +24.8% | +21 days | 78% |
| 🟠 Red Sea Shutdown | +12.3% | +14 days | 32% |
| 🟡 OPEC+ Emergency Cut | +18.5% | Immediate | 45% |
| ⚫ Combined Crisis | +48.2% | +35 days | 92% |

### 🤖 Claude AI Procurement Intelligence
On crisis trigger, AI instantly:
1. Scores geopolitical risk per corridor (0-100)
2. Identifies 3 alternative procurement options
3. Ranks by cost, transit time, and viability
4. Generates optimal SPR drawdown schedule

### 📊 Live Intelligence Feeds
- Brent crude spot price (live simulation)
- SPR countdown (depletes in real-time during crisis)
- India supply mix by country
- Geopolitical risk feed (NewsAPI)

### ✈️ Telegram Bot
```
/risk     — Corridor risk scores
/vessels  — Active tanker tracking
/spr      — Reserve status + recommendation
/simulate — Full crisis simulation
/news     — Top intelligence items
/price    — Live Brent price
```

### 📡 NFC Card
Tap any NFC card → instant mobile briefing at `/nfc` — risk score, price, SPR, alerts.

---

## Architecture

```
┌──────────────┬──────────────────┬────────────────────┐
│ DATA SOURCES │   AI BRAIN       │   INTERFACES       │
│ AISHub API   │  Claude API      │  Web War Room      │
│ NewsAPI      │  Risk Scorer     │  (Next.js/globe.gl)│
│ Commodity    │  Procurement     │  Mobile PWA        │
│ Feed         │  Agent           │  Telegram Bot      │
│ OFAC List    │  SPR Optimizer   │  NFC Card          │
│              │  Supabase RT     │                    │
└──────────────┴──────────────────┴────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · Tailwind CSS · TypeScript |
| Globe | react-globe.gl · Three.js |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Database | Supabase (real-time WebSockets) |
| Telegram | Telegraf.js |
| Deployment | Vercel |
| Data | AISHub · NewsAPI · Alpha Vantage |

---

## Quick Start

```bash
git clone https://github.com/your-team/drishti
cd drishti
npm install
# Edit .env.local with your API keys
npm run dev
```

### Telegram Bot
```bash
npx ts-node telegram/bot.ts
```

### Environment Variables
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEWS_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

*DRISHTI (दृष्टि) — Sanskrit for "Vision". Because India's energy security needs clear vision, not reactive panic.*
