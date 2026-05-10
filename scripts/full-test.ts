import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
}

const HAS_OPENROUTER = !!process.env.OPENROUTER_API_KEY;
const HAS_ANAKIN = !!process.env.ANAKIN_API_KEY;
const HAS_TG = !!process.env.TELEGRAM_BOT_TOKEN;

console.log('\n=== ENV ===');
console.log(`OPENROUTER_API_KEY: ${HAS_OPENROUTER ? 'OK' : 'MISSING'}`);
console.log(`ANAKIN_API_KEY:     ${HAS_ANAKIN ? 'OK' : 'MISSING'}`);
console.log(`TELEGRAM_BOT_TOKEN: ${HAS_TG ? 'OK' : 'MISSING'}`);

async function main() {
  // 1. Source selector across multiple intents
  console.log('\n=== TEST 1: Source selector intent mapping ===');
  const { selectSources } = await import('../lib/source-selector');
  const intents: Array<[string, string]> = [
    ['shopping', 'i want a macbook m4'],
    ['investing', 'should I buy AAPL stock'],
    ['research', 'latest LLM research papers'],
    ['prediction', 'will trump win 2028'],
    ['news', 'breaking news today'],
  ];
  for (const [label, q] of intents) {
    const r = await selectSources(q, 6);
    const slugs = r.map(s => s.slug).join(', ');
    console.log(`[${label.padEnd(11)}] "${q}" → ${slugs}`);
  }

  // 2. Action map coverage
  console.log('\n=== TEST 2: Action ID coverage ===');
  const { ACTION_MAP } = await import('../lib/action-map');
  const { ALL_SOURCES } = await import('../lib/all-sources');
  const missing = ALL_SOURCES.filter(s => !ACTION_MAP[s.slug]).map(s => s.slug);
  console.log(`Mapped: ${Object.keys(ACTION_MAP).length} / ${ALL_SOURCES.length}`);
  if (missing.length > 0) console.log(`Missing: ${missing.join(', ')}`);

  // 3. Anakin wire — single fast source
  console.log('\n=== TEST 3: Anakin Wire (reddit, fast) ===');
  const { submitWireTask, pollWireTask } = await import('../lib/anakin');
  try {
    const t0 = Date.now();
    const { job_id } = await submitWireTask('rt_search', { query: 'macbook m4' });
    const result = await pollWireTask(job_id);
    const items = (result as any)?.posts || (result as any)?.data || [];
    console.log(`Reddit OK in ${Date.now() - t0}ms — ${items.length} items`);
    if (items[0]) console.log(`  First: ${items[0].title?.slice(0, 80)}`);
  } catch (e) {
    console.log(`Reddit FAILED: ${e instanceof Error ? e.message : e}`);
  }

  // 4. Anakin wire — youtube
  console.log('\n=== TEST 4: Anakin Wire (youtube) ===');
  try {
    const t0 = Date.now();
    const { job_id } = await submitWireTask('yt_search', { query: 'macbook m4 review' });
    const result = await pollWireTask(job_id);
    const items = (result as any)?.data || (result as any)?.videos || [];
    console.log(`YouTube OK in ${Date.now() - t0}ms — ${items.length} videos`);
    if (items[0]) console.log(`  First: ${items[0].title?.slice(0, 80)}`);
  } catch (e) {
    console.log(`YouTube FAILED: ${e instanceof Error ? e.message : e}`);
  }

  // 5. SSE endpoint
  console.log('\n=== TEST 5: Web /api/research/stream endpoint ===');
  try {
    const t0 = Date.now();
    const res = await fetch('http://localhost:3000/api/research/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'macbook m4' }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok || !res.body) {
      console.log(`STREAM FAILED: HTTP ${res.status}`);
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const events: Record<string, number> = {};
      let okCount = 0, errCount = 0, sourceCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value);
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const p of parts) {
          if (!p.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(p.slice(6));
            events[d.type] = (events[d.type] || 0) + 1;
            if (d.type === 'source') {
              sourceCount++;
              if (d.status === 'ok') okCount++;
              else errCount++;
            }
            if (d.type === 'done') break;
          } catch {}
        }
      }
      console.log(`Stream completed in ${Date.now() - t0}ms`);
      console.log(`  Events: ${JSON.stringify(events)}`);
      console.log(`  Sources: ${okCount} OK / ${errCount} ERR / ${sourceCount} total`);
    }
  } catch (e) {
    console.log(`STREAM FAILED: ${e instanceof Error ? e.message : e}`);
  }

  // 6. OpenRouter chat — verify model + key
  console.log('\n=== TEST 6: OpenRouter chat (sonnet 4.5) ===');
  try {
    const t0 = Date.now();
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
        max_tokens: 20,
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    console.log(`OpenRouter OK in ${Date.now() - t0}ms — reply: "${content}"`);
  } catch (e) {
    console.log(`OpenRouter FAILED: ${e instanceof Error ? e.message : e}`);
  }

  console.log('\n=== DONE ===\n');
}

main().catch(console.error);
