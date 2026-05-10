import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
}

const DARKBLOOM_API_KEY = process.env.DARKBLOOM_API_KEY!;

async function chat(messages: any[], tools?: any[]) {
  const res = await fetch('https://api.darkbloom.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DARKBLOOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mlx-community/Qwen3.5-122B-A10B-8bit',
      messages, tools, temperature: 0.7, max_tokens: 2000,
    }),
  });
  return res.json();
}

const TOOL = {
  type: 'function',
  function: {
    name: 'search_topic',
    description: 'Search 114 real-time data sources for any topic. Use for fresh data, prices, news, opinions, reviews, predictions.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
};

async function main() {
  console.log('--- Test 1: tool call expected ---');
  const r1 = await chat([
    { role: 'system', content: 'You are THESIS. Use search_topic to find fresh data. Be concise.' },
    { role: 'user', content: 'What are people saying about the new MacBook Pro M4?' },
  ], [TOOL]);
  const m1 = r1.choices?.[0]?.message;
  console.log('finish:', r1.choices?.[0]?.finish_reason);
  console.log('tool_calls:', JSON.stringify(m1?.tool_calls, null, 2));
  console.log('content:', (m1?.content || '').slice(0, 200));

  console.log('\n--- Test 2: chat-only expected ---');
  const r2 = await chat([
    { role: 'system', content: 'You are THESIS. Friendly, concise.' },
    { role: 'user', content: 'hi who are you' },
  ], [TOOL]);
  const m2 = r2.choices?.[0]?.message;
  console.log('finish:', r2.choices?.[0]?.finish_reason);
  console.log('tool_calls:', m2?.tool_calls ? 'YES' : 'NO');
  console.log('content:', (m2?.content || '').slice(0, 300));
}

main().catch(console.error);
