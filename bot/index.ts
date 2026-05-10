import { Bot, Context, session, SessionFlavor } from 'grammy';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { selectSources } from '../lib/source-selector';
import { CATEGORY_ICONS } from '../lib/all-sources';
import { getActionId } from '../lib/action-map';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
} catch {}

const ANAKIN_API_KEY = process.env.ANAKIN_API_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

interface SearchMemory {
  topic: string;
  timestamp: number;
  sources: string[];
  results: Array<{ source: string; title: string; url: string | null; extra: any }>;
  summary?: string;
}

interface SessionData {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  searches: SearchMemory[];
}

type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

bot.use(
  session({
    initial: (): SessionData => ({
      messages: [],
      searches: [],
    }),
  })
);

// === ANAKIN HELPERS ===
async function fetchAnakin(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.anakin.io/v1${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': ANAKIN_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}

async function pollJob(jobId: string, type: 'wire' | 'agentic') {
  const endpoint = type === 'wire' ? `/holocron/jobs/${jobId}` : `/agentic-search/${jobId}`;
  const delays = type === 'wire' ? [0, 500, 1000, 2000, 3000, 5000] : [0, 3000, 8000, 15000, 30000, 45000];
  for (const d of delays) {
    if (d > 0) await new Promise((r) => setTimeout(r, d));
    const j = await fetchAnakin(endpoint);
    if (j.status === 'completed') return j;
    if (j.status === 'failed') throw new Error('Job failed');
  }
  throw new Error('Timeout');
}

function normalizeItems(raw: unknown) {
  const data = raw as Record<string, unknown>;
  const arr = Array.isArray(raw) ? raw
    : Array.isArray(data?.hits) ? data.hits
    : Array.isArray(data?.items) ? data.items
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.posts) ? data.posts
    : Array.isArray(data?.repositories) ? data.repositories
    : Array.isArray(data?.papers) ? data.papers
    : Array.isArray(data?.markets) ? data.markets
    : Array.isArray(data?.articles) ? data.articles
    : Array.isArray(data?.jobs) ? data.jobs
    : Array.isArray(data?.videos) ? data.videos
    : Array.isArray(data?.questions) ? data.questions
    : [];
  return arr.slice(0, 3).map((it: Record<string, unknown>) => ({
    title: String(it.title ?? it.name ?? it.headline ?? it.question ?? it.full_name ?? it.text ?? '(untitled)'),
    url: (it.url ?? it.hn_url ?? it.link ?? it.permalink ?? it.html_url ?? it.abs_url ?? null) as string | null,
    snippet: String(it.snippet ?? it.description ?? it.summary ?? it.abstract ?? '').slice(0, 150),
    extra: (it.points ?? it.score ?? it.probability ?? it.upvotes ?? it.ups ?? it.stargazers_count ?? null),
  }));
}

async function searchSource(slug: string, query: string) {
  const actionId = await getActionId(slug, ANAKIN_API_KEY);
  if (!actionId) return null;
  try {
    const { job_id } = await fetchAnakin('/holocron/task', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId, params: { query } }),
    });
    const result = await pollJob(job_id, 'wire');
    return result.data;
  } catch {
    return null;
  }
}

// === OPENROUTER (Conversational Brain) ===
async function chatWithLLM(messages: any[], tools?: any[]): Promise<any> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });
  return res.json();
}

const SYSTEM_PROMPT = `You are THESIS, a research assistant in Telegram. You have access to 114 real-time data sources via the search_topic tool.

Your style:
- Conversational, friendly, smart - like a knowledgeable friend
- Use Telegram-friendly markdown (*, _, \`, etc.)
- Concise but insightful - no walls of text
- Reference past searches when relevant
- Be opinionated and decisive

BIAS TOWARD ACTION - search aggressively:
- If user mentions ANY product, topic, company, ticker, person, event → search it
- Don't ask clarifying questions when you have a workable query - just search and give them something
- "macbook" is enough to search. "14 inch macbook" is enough. Don't ask what they'll use it for.
- Better to search with imperfect info and refine, than ask 3 questions before doing anything
- Only ask for clarification if the query is truly ambiguous (e.g. "find me X" where X is a name shared by 5 famous people)

🛒 BUY/PURCHASE LINKS - DO NOT SEARCH, generate direct retailer URLs:
When the user asks "where to buy", "give me link to buy", "purchase link", "link to order", "shopping link", etc. for a product you already discussed:
- DO NOT call search_topic — search returns reviews/news, not buy pages
- Reply with a clean list of direct retailer URLs for the SPECIFIC product from the previous verdict
- Format:
  🛒 *Buy [exact product]*

  • [Apple Official](https://www.apple.com/shop/buy-mac/macbook-pro) — usually best for warranty/financing
  • [Amazon](https://www.amazon.com/s?k=MacBook+Pro+M4+14+inch+24GB) — often $200-400 off
  • [Best Buy](https://www.bestbuy.com/site/searchpage.jsp?st=MacBook+Pro+M4+14+inch) — price-match + open-box deals
  • [B&H Photo](https://www.bhphotovideo.com/c/search?Ntt=MacBook+Pro+M4+14) — no-tax in most states

Use real retailer search-URL patterns:
  Apple:    https://www.apple.com/shop/buy-{category}
  Amazon:   https://www.amazon.com/s?k=PRODUCT+WORDS+JOINED+BY+PLUS
  Best Buy: https://www.bestbuy.com/site/searchpage.jsp?st=PRODUCT
  B&H:      https://www.bhphotovideo.com/c/search?Ntt=PRODUCT
  eBay:     https://www.ebay.com/sch/i.html?_nkw=PRODUCT
  Walmart:  https://www.walmart.com/search?q=PRODUCT

When NOT to search:
- Pure greetings ("hi", "thanks", "how does this work")
- Questions about previous results (use memory)
- Opinion/analysis on data you already fetched
- User asks for buy/purchase/order links (use the rule above)

Default: SEARCH. When in doubt, search. But never search for purchase URLs — generate them.`;

const SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_topic',
    description: 'Search across 114 real-time data sources. AI auto-selects the best 8 sources based on query.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The search query/topic' },
        reason: { type: 'string', description: 'Why this search is needed (1 sentence)' },
      },
      required: ['topic'],
    },
  },
};

// === SEARCH EXECUTOR ===
async function executeSearch(topic: string, ctx: MyContext, statusMsgId: number) {
  const selected = await selectSources(topic, 8);
  const sourceLabels = selected.map(s => `${CATEGORY_ICONS[s.category] || '🔍'} ${s.name}`);

  try {
    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMsgId,
      `🔍 *Searching:* _${topic}_\n\n📡 ${sourceLabels.join(', ')}`,
      { parse_mode: 'Markdown' }
    );
  } catch {}

  const results: Array<{ source: string; title: string; url: string | null; extra: any }> = [];
  const completed: string[] = [];

  await Promise.all(
    selected.map(async (source) => {
      const icon = CATEGORY_ICONS[source.category] || '🔍';
      const data = await searchSource(source.slug, topic);
      if (data) {
        const items = normalizeItems(data);
        for (const item of items) {
          results.push({ source: source.name, title: item.title, url: item.url, extra: item.extra });
        }
        completed.push(`${icon} ${source.name} (${items.length})`);
        try {
          await ctx.api.editMessageText(
            ctx.chat!.id,
            statusMsgId,
            `🔍 *${topic}*\n\n✅ ${completed.join(', ')}\n⏳ ${selected.length - completed.length} more...`,
            { parse_mode: 'Markdown' }
          );
        } catch {}
      }
    })
  );

  return {
    topic,
    sources: selected.map(s => s.name),
    results,
  };
}

function escapeMd(s: string) {
  // Escape Telegram Markdown v1 special chars in display text
  return s.replace(/([_*`\[\]])/g, '\\$1');
}

function formatSearchResults(searchData: { topic: string; sources: string[]; results: any[] }) {
  let text = `📊 *Results for "${escapeMd(searchData.topic)}"*\n\n`;
  const grouped: Record<string, any[]> = {};
  for (const r of searchData.results) {
    if (!grouped[r.source]) grouped[r.source] = [];
    grouped[r.source].push(r);
  }
  for (const [source, items] of Object.entries(grouped)) {
    text += `*${escapeMd(source)}*\n`;
    for (const item of items.slice(0, 3)) {
      const score = item.extra ? ` _[${item.extra}]_` : '';
      const title = escapeMd(String(item.title || '').slice(0, 120));
      // Embed link in title — hides ugly URLs (e.g. Google News base64 redirects)
      const line = item.url ? `• [${title}](${item.url})${score}` : `• ${title}${score}`;
      text += `${line}\n`;
    }
    text += '\n';
  }
  return text;
}

// === COMMANDS ===
bot.command('start', async (ctx) => {
  ctx.session.messages = [];
  ctx.session.searches = [];
  await ctx.reply(
    `👋 *Hey! I'm THESIS.*

I'm your AI research buddy with access to *114 real-time sources*.

Just talk to me naturally:
• "what's happening with bitcoin?"
• "should I invest in tesla?"
• "find me latest AI papers"
• "what was that polymarket odds you mentioned?"

I remember our conversation, decide when to search vs just chat, and use Claude 3.5 Sonnet to synthesize everything.

Try me. 🚀`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('clear', async (ctx) => {
  ctx.session.messages = [];
  ctx.session.searches = [];
  await ctx.reply('🧹 Cleared. Fresh start - what do you want to know?');
});

bot.command('memory', async (ctx) => {
  const searches = ctx.session.searches;
  if (searches.length === 0) {
    await ctx.reply('No searches yet. Ask me something!');
    return;
  }
  const list = searches.map((s, i) =>
    `${i + 1}. *${s.topic}* — ${s.sources.length} sources, ${s.results.length} results`
  ).join('\n');
  await ctx.reply(`📚 *Search History*\n\n${list}`, { parse_mode: 'Markdown' });
});

// === MAIN CONVERSATION HANDLER ===
bot.on('message:text', async (ctx) => {
  const userMessage = ctx.message.text;
  if (userMessage.startsWith('/')) return;

  // Add user message to history
  ctx.session.messages.push({ role: 'user', content: userMessage });

  // Build context from past searches
  const searchContext = ctx.session.searches.length > 0
    ? `\n\nPrevious searches in this conversation:\n${ctx.session.searches.map((s, i) =>
        `${i + 1}. "${s.topic}" - found ${s.results.length} results from ${s.sources.slice(0, 3).join(', ')}`
      ).join('\n')}`
    : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + searchContext },
    ...ctx.session.messages.slice(-10),
  ];

  await ctx.replyWithChatAction('typing');
  const statusMsg = await ctx.reply('💭 _thinking..._', { parse_mode: 'Markdown' });

  try {
    // First LLM call - decide whether to search or just chat
    let llmResponse = await chatWithLLM(messages, [SEARCH_TOOL]);
    const choice = llmResponse.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('LLM returned no message');
    }

    // Check if LLM wants to call the search tool
    const toolCalls = message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      // Execute the search
      const toolCall = toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments);
      const topic = args.topic;

      const searchData = await executeSearch(topic, ctx, statusMsg.message_id);

      // Save to memory
      ctx.session.searches.push({
        topic,
        timestamp: Date.now(),
        sources: searchData.sources,
        results: searchData.results,
      });
      if (ctx.session.searches.length > 5) {
        ctx.session.searches = ctx.session.searches.slice(-5);
      }

      // Send raw results
      const resultsText = formatSearchResults(searchData);
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch {}

      if (resultsText.length > 4000) {
        const chunks = resultsText.match(/[\s\S]{1,4000}/g) || [];
        for (const chunk of chunks) {
          try {
            await ctx.reply(chunk, { parse_mode: 'Markdown' });
          } catch {
            await ctx.reply(chunk);
          }
        }
      } else {
        try {
          await ctx.reply(resultsText, { parse_mode: 'Markdown' });
        } catch {
          await ctx.reply(resultsText);
        }
      }

      // Now have LLM synthesize the results
      await ctx.replyWithChatAction('typing');
      const synthesisMsg = await ctx.reply('💭 _analyzing..._', { parse_mode: 'Markdown' });

      const resultsForLLM = searchData.results.slice(0, 15).map(r =>
        `[${r.source}] ${r.title}${r.extra ? ` (${r.extra})` : ''}`
      ).join('\n');

      const VERDICT_PROMPT = `You are THESIS giving a final verdict to a user with CHOICE ANXIETY. They will get overwhelmed by links and back out without buying anything. Your job is to MAKE THE DECISION FOR THEM.

Format EXACTLY (Telegram markdown):

🎯 *Verdict:* [ONE clear recommendation in one sentence — name a specific product/option/answer]

*Why:*
• [evidence point 1 from results — quote a number/review/source]
• [evidence point 2]
• [evidence point 3]

*Watch out for:* [1 honest caveat]

Rules:
- BE DECISIVE. "Get the X." not "X might be good if you..."
- Pick ONE thing. Never "either A or B"
- Pull specifics from the results (upvotes, view counts, review snippets)
- Speak like a confident friend who already did the research
- Max 8 lines total. No preamble like "Based on the results...".`;

      const synthesisMessages = [
        { role: 'system', content: VERDICT_PROMPT },
        {
          role: 'user',
          content: `User asked: "${topic}"\n\nSearch results across ${searchData.sources.length} sources:\n\n${resultsForLLM}\n\nGive your verdict now.`,
        },
      ];

      const synthesisResponse = await chatWithLLM(synthesisMessages);
      const synthesisText = synthesisResponse.choices?.[0]?.message?.content
        || (synthesisResponse.error?.message ? `LLM error: ${synthesisResponse.error.message}` : 'Could not analyze.');
      if (!synthesisResponse.choices?.[0]?.message?.content) {
        console.error('Synthesis empty. Raw:', JSON.stringify(synthesisResponse).slice(0, 500));
      }

      try {
        await ctx.api.deleteMessage(ctx.chat.id, synthesisMsg.message_id);
      } catch {}

      try {
        await ctx.reply(`💡 ${synthesisText}`, { parse_mode: 'Markdown' });
      } catch {
        await ctx.reply(`💡 ${synthesisText}`);
      }

      ctx.session.messages.push({
        role: 'assistant',
        content: `[Searched "${topic}"] ${synthesisText}`,
      });
    } else {
      // Just a conversational response - no search needed
      const response = message.content || 'Hmm, I got nothing.';

      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch {}

      try {
        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch {
        await ctx.reply(response);
      }

      ctx.session.messages.push({ role: 'assistant', content: response });
    }

    // Trim message history
    if (ctx.session.messages.length > 20) {
      ctx.session.messages = ctx.session.messages.slice(-20);
    }
  } catch (e) {
    console.error('Bot error:', e);
    try {
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch {}
    await ctx.reply(`❌ Something broke: ${e instanceof Error ? e.message : 'unknown'}`);
  }
});

console.log('🤖 THESIS Bot starting (Conversational Mode + OpenRouter + 114 sources)...');
bot.start();
