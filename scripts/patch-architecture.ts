import { readFileSync, writeFileSync } from 'fs';

const path = 'architecture.excalidraw.json';
const j = JSON.parse(readFileSync(path, 'utf-8'));

const updates: Record<string, string> = {
  title: 'THESIS Architecture v5',
  subtitle: 'Decentralized Inference (Darkbloom) • 114 Anakin Sources • Verdict-Style Synthesis',

  'browser-label':
    'Web Terminal\n(Next.js 16)\n\nComponents:\n• TickerBar\n• SearchBar\n• SourceCard\n• LiveVideo (YT)\n• WorldClock\n\nBloomberg UI\nMono / Black / Green',

  'telegram-label':
    'Telegram Bot\n(Grammy)\n\n@thesis_anakinbot\nConversational\nTool-calling\n🎯 Verdict Mode',

  'openrouter-label':
    'Darkbloom\n(api.darkbloom.dev)\n\nQwen3.5 122B\nAttested Apple Silicon\n\nAI SOURCE SELECTOR\n+ BOT BRAIN\nintent → 8 sources\n+ tool calling',

  'agentic-label':
    'Anakin Wire\nfan-out errors\nsurface inline',

  'ui-flow-label':
    'REQUEST FLOW:\n\n1. User enters query\n2. POST /api/research/\n   stream\n3. Darkbloom picks\n   8 sources from 114\n4. Parallel fetch via\n   Anakin Holocron\n5. SSE stream each\n   result as it arrives\n6. UI updates live\n   per source\n\nLatency: ~3-5s\nInference: 100% on\nDarkbloom (no OpenAI,\nno Anthropic, no GCP)',

  'tech-stack-label':
    'TECH STACK:  Next.js 16 (App Router) • React 19 • TypeScript • Tailwind CSS v4 • JetBrains Mono • Server-Sent Events (SSE) • Grammy (Telegram) • Darkbloom (Qwen3.5 122B on attested Apple Silicon) • Anakin.ai (114 sources)\n\nUI THEME: Bloomberg Terminal — Pure black bg • Monospace everywhere • Green/red color coding • Tabular nums • Sharp borders • Tight 9-12px sizes • Dense info layout • Pulse/blink animations\n\nLAYOUT: 12-col grid → [TickerBar] / [Header] / [SearchBar] / [LeftSidebar | CenterGrid | RightSidebar(Video+Clock+Stats+Sys)] / [Footer]',
};

let patched = 0;
for (const el of j.elements) {
  if (el.type === 'text' && updates[el.id]) {
    el.text = updates[el.id];
    el.originalText = updates[el.id];
    patched++;
  }
}

writeFileSync(path, JSON.stringify(j, null, 2));
console.log(`patched ${patched} text elements`);
