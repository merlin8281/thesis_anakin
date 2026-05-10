# THESIS

> A Bloomberg-terminal-grade research aggregator that searches **114 real-time sources in parallel** and gives you a single, decisive verdict — no more 47-tab Chrome paralysis.

Built on **Anakin.ai** for the data layer, **OpenRouter** (Claude) for the brain, and **Next.js 16** for the terminal UI. Ships with both a web terminal and a conversational Telegram bot.

---

## Why this exists

Researching anything serious — a laptop purchase, a stock, a hiring decision, a thesis topic — means opening 30 tabs across Reddit, Amazon, arXiv, YouTube, Google News, finance dashboards, and review sites, then spending an hour synthesising it yourself.

THESIS does that in **15 seconds**. One query → AI picks the right 8 sources from 114 → results stream in parallel → you get a verdict.

The verdict matters more than the data. People with choice anxiety don't want a wall of links — they want a confident friend who already did the research saying "*get the M4 Air, here's why, here's the one caveat.*"

---

## What it does

### 1. AI source selection (114 → 8)
A query like `"i want a macbook"` shouldn't return Federal Reserve data. Claude Haiku 4.5 reads the query, infers customer intent (shopping vs investing vs research vs prediction vs travel...), and picks the 8 best sources.

```
"i want macbook m5"      → Amazon, eBay, Trustpilot, YouTube, Reddit, Google News
"should I buy AAPL"      → Yahoo Finance, SEC EDGAR, Stocktwits, Polymarket, CNBC, Reddit
"latest LLM research"    → arXiv, Semantic Scholar, Hacker News, Reddit, Medium
"will trump win 2028"    → Polymarket, Kalshi, Manifold, Google News, Reddit
"trip to tokyo"          → Airbnb, Booking, Skyscanner, Reddit, YouTube
```

Falls back to keyword scoring if OpenRouter is unreachable.

### 2. Parallel fan-out across Anakin's Holocron Wire
Every selected source fires off concurrently against Anakin's wire API. Results stream in via Server-Sent Events as each source completes — no waiting for the slowest one. Failed sources surface inline with the error so you can see what's actually broken vs what's data.

### 3. Bloomberg-terminal UI
Pure black background. JetBrains Mono everywhere. Tabular numbers. Pulse dots for live status. Three-column grid:

- **Left:** source roster with per-source status (`OK` / `ERR` / `LIVE`)
- **Center:** query bar, source result cards, AI synthesis
- **Right:** dynamic YouTube videos for the query, world clocks, source breakdown by category

YouTube videos are query-relevant by default (M4 MacBook reviews when you search MacBook), and fall back to live news streams (Bloomberg, CNBC, BBC, Al Jazeera, Sky News) when idle.

### 4. Conversational Telegram bot
Same engine, conversational interface. Powered by Claude Sonnet 4.5 with **OpenRouter tool calling** — the model decides whether to chat or search based on what you actually asked.

- Remembers the last 20 messages and 5 searches per session
- Biases toward action — won't ask "what are you using it for?" when you already gave it enough context
- Returns a structured **🎯 Verdict** with evidence bullets and one honest caveat — built for choice anxiety, not for link dumps
- Hides ugly redirect URLs behind clickable Markdown titles

---

## Architecture

```
┌─────────────┐    ┌─────────────────┐
│ Web Terminal│    │  Telegram Bot   │
│ (Next.js)   │    │   (Grammy)      │
└──────┬──────┘    └────────┬────────┘
       │                    │
       └────────┬───────────┘
                ▼
       ┌────────────────────┐
       │  AI Source Selector│   ← OpenRouter / Claude Haiku 4.5
       │  (intent → 8 src)  │
       └────────┬───────────┘
                ▼
       ┌────────────────────┐
       │  Parallel Fan-out  │   ← Promise.all over selected sources
       └────────┬───────────┘
                ▼
       ┌────────────────────┐
       │  Anakin Holocron   │   ← 114 sources: ecommerce, finance, news,
       │  Wire API          │     research, social, prediction, travel...
       └────────┬───────────┘
                ▼
       ┌─────────────────────┐
       │ Synthesis / Verdict │   ← OpenRouter / Claude Sonnet 4.5
       └─────────────────────┘
```

A live Excalidraw version lives at `architecture.excalidraw.json` — drop it into [excalidraw.com](https://excalidraw.com) to view.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Runtime | React 19, TypeScript 5 |
| Styling | Tailwind v4, JetBrains Mono |
| Streaming | Server-Sent Events |
| Bot | Grammy (Telegram) + tsx for dev |
| AI | OpenRouter — Claude Sonnet 4.5 (bot brain), Claude Haiku 4.5 (source selection) |
| Data | Anakin.ai Holocron Wire (114 sources) + Agentic Search |

---

## Quick start

```bash
git clone https://github.com/merlin8281/thesis_anakin
cd thesis_anakin
pnpm install            # or npm / yarn

cp .env.example .env.local
# Fill in: ANAKIN_API_KEY, OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN (optional)

pnpm dev                # web terminal at http://localhost:3000
pnpm bot                # in another tab, run the Telegram bot
```

You need at minimum:
1. An [Anakin.ai](https://anakin.io) API key (data layer)
2. An [OpenRouter](https://openrouter.ai/keys) API key (AI selection + synthesis)
3. *(optional)* A Telegram bot token from [@BotFather](https://t.me/BotFather)

---

## Project layout

```
app/
  api/research/stream/route.ts    SSE endpoint — fans out to selected sources
  page.tsx                        Bloomberg terminal UI
  globals.css                     Terminal aesthetic — pure black, mono, accents
bot/
  index.ts                        Conversational Telegram bot (Grammy + OpenRouter)
components/
  LiveVideo.tsx                   Dynamic YouTube panel (query-relevant + live news)
  SourceCard.tsx                  Per-source result card with status dots
  SynthesisCard.tsx               AI summary panel
  WorldClock.tsx                  NY/LON/TOK/SGP clocks
  TickerBar.tsx                   Scrolling status ticker
lib/
  source-selector.ts              AI selector — intent inference, 114→8
  all-sources.ts                  Source registry (slug, name, category, keywords)
  action-map.ts                   Slug → Anakin action_id, with catalog fallback
  anakin.ts                       Wire + Agentic Search client (submit/poll)
scripts/
  test-selector.ts                Verify selector for a list of queries
architecture.excalidraw.json      Live system diagram
```

---

## Behind a few design choices

**Why AI selection instead of regex/keyword matching?**
Tried regex first. "i want a macbook" → matched "price" → dumped Federal Reserve and Finviz at the top. Customer intent isn't keyword-shaped. Claude Haiku 4.5 reads intent in 200ms for ~$0.0001/query.

**Why a verdict instead of a summary?**
Choice anxiety is the actual bottleneck. People who get a 30-link summary close the tab. People who get *"Get the M4 Air. Why: 600 upvotes, MKBHD called it 'too easy', $400 off this week. Watch out for: 256GB fills up fast — bump to 512."* — they buy.

**Why both web AND Telegram?**
Different attention modes. The terminal is for sit-down research sessions ("compare these 4 cameras"). The bot is for shower-thought queries you'd otherwise forget ("wait, what's polymarket saying about the election right now?").

**Why are some Anakin sources flaky?**
Amazon/eBay/Trustpilot scrapers occasionally return empty or 404. Surface the error inline rather than hiding it — user can see the failure was upstream, not the model picking wrong sources. Reddit/YouTube/Google News are the most reliable; weight them when synthesising.

---

## Development

```bash
pnpm dev                          # Next dev server (Turbopack)
pnpm bot                          # Telegram bot (hot reload via tsx)
pnpm build                        # production build
npx tsx scripts/test-selector.ts  # verify source selection for sample queries
```

Bot logs print to stdout. The selector logs `[source-selector] AI selecting for: "..."` on every call — useful when debugging whether the OpenRouter path is actually firing.

---

## License

MIT — build whatever you want with it.
