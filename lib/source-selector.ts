import { ALL_SOURCES, SourceMeta } from './all-sources';

const SOURCE_LIST = ALL_SOURCES.map(s => `${s.slug}: ${s.name} (${s.category}) - ${s.keywords.join(', ')}`).join('\n');

export async function selectSources(query: string, maxSources: number = 8): Promise<SourceMeta[]> {
  const DARKBLOOM_API_KEY = process.env.DARKBLOOM_API_KEY;
  // If no API key, fall back to keyword matching
  if (!DARKBLOOM_API_KEY) {
    console.warn('[source-selector] DARKBLOOM_API_KEY missing — falling back to keyword regex');
    return selectSourcesFallback(query, maxSources);
  }
  console.log(`[source-selector] Darkbloom selecting for: "${query}"`);

  try {
    const response = await fetch('https://api.darkbloom.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DARKBLOOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mlx-community/Qwen3.5-122B-A10B-8bit',
        messages: [
          {
            role: 'system',
            content: `You are a source selection AI. THINK LIKE THE CUSTOMER. Read the query and infer their actual INTENT, then pick the ${maxSources} most relevant sources from the list. Return ONLY a JSON array of slugs.

Available sources:
${SOURCE_LIST}

CUSTOMER INTENT MAPPING - infer from query, then match:

🛒 SHOPPING/PRODUCT INTENT ("i want X", "buy X", "best X under $", "X review"):
   → amazon, flipkart, trustpilot, youtube (reviews), reddit (opinions), google_news, techcrunch
   → DO NOT pick ebay, finance/stock sources, or producthunt (no search support)
   → flipkart is essential for India-region queries

💰 INVESTMENT INTENT ("should I invest", "stock price", "$TICKER", "market cap"):
   → yahoo_finance, sec_edgar, stocktwits, polymarket, cnbc, reddit, google_news, finviz

📰 NEWS/CURRENT EVENTS ("what's happening", "latest", "today", "breaking"):
   → google_news, reuters, bbc, apnews, hackernews, reddit, youtube

🔬 RESEARCH/LEARN ("how does X work", "research on", "papers about"):
   → arxiv, pubmed, semantic_scholar, wikipedia, youtube (tutorials), medium

💻 DEVELOPER/CODE ("how to code", "library for", "github project"):
   → github_public, stackoverflow, npm/pypi, devto, hackernews, reddit, youtube

🎯 PREDICTION/ODDS ("will X happen", "election odds", "probability"):
   → polymarket, kalshi, manifold, google_news, reddit

✈️ TRAVEL ("trip to X", "flights", "hotel"):
   → airbnb, booking, google_flights, skyscanner, reddit, youtube

🎬 ENTERTAINMENT ("movie", "show", "game"):
   → imdb, steam, youtube, reddit, trustpilot

💼 JOBS ("hiring", "career", "salary"):
   → indeed, remoteok, weworkremotely, reddit, hackernews

💊 HEALTH/MEDICAL ("symptoms", "drug", "treatment"):
   → drugs_com, pubmed, reddit, google_news

🏠 REAL ESTATE: → zillow, reddit, google_news

CRITICAL RULES:
- Customer says "i want a macbook" → SHOPPING intent → ecommerce + reviews, NOT stock prices
- Customer says "should i buy AAPL" → INVESTMENT intent → finance sources
- Customer says "best laptop 2025" → SHOPPING + REVIEWS → amazon, trustpilot, youtube, reddit
- Always include youtube for any product/how-to/review query
- Always include reddit for opinion-driven queries
- Match the intent, NOT just keywords

After any reasoning, your FINAL line MUST be just the JSON array.
Return format: ["slug1", "slug2", ...]`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Darkbloom models reason out loud — find the LAST JSON array in the response
    const matches = content.match(/\[[^\[\]]*\]/g);
    if (!matches || matches.length === 0) {
      console.error('AI selection failed (no array found), using fallback');
      return selectSourcesFallback(query, maxSources);
    }

    const slugs: string[] = JSON.parse(matches[matches.length - 1]);
    const selected = slugs
      .map(slug => ALL_SOURCES.find(s => s.slug === slug))
      .filter((s): s is SourceMeta => s !== undefined)
      .slice(0, maxSources);

    if (selected.length < 3) {
      return selectSourcesFallback(query, maxSources);
    }

    return selected;
  } catch (e) {
    console.error('AI selection error:', e);
    return selectSourcesFallback(query, maxSources);
  }
}

// Fallback keyword-based selection
function selectSourcesFallback(query: string, maxSources: number): SourceMeta[] {
  const q = query.toLowerCase();
  const words = q.split(/\s+/);

  const scored = ALL_SOURCES.map((source) => {
    let score = 0;

    for (const keyword of source.keywords) {
      if (q.includes(keyword)) score += 10;
      for (const word of words) {
        if (keyword.includes(word) || word.includes(keyword)) score += 5;
      }
    }

    if (/stock|market|trading|invest|price|\$[A-Z]+/i.test(q)) {
      if (source.category === 'finance') score += 20;
    }
    if (/crypto|bitcoin|btc|eth|blockchain/i.test(q)) {
      if (source.slug === 'coingecko') score += 30;
    }
    if (/news|breaking|today|latest/i.test(q)) {
      if (source.category === 'news') score += 20;
    }
    if (/code|programming|developer|github/i.test(q)) {
      if (source.category === 'developer') score += 20;
    }
    if (/research|paper|academic|science/i.test(q)) {
      if (source.category === 'research') score += 25;
    }
    if (/job|hiring|career|remote/i.test(q)) {
      if (source.category === 'jobs') score += 25;
    }
    if (/ai|machine learning|llm|gpt/i.test(q)) {
      if (source.slug === 'arxiv') score += 20;
      if (source.slug === 'hackernews') score += 15;
    }

    if (score === 0) {
      if (source.slug === 'google_news') score = 3;
      if (source.slug === 'reddit') score = 2;
      if (source.slug === 'wikipedia') score = 2;
    }

    return { source, score };
  });

  const selected = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSources)
    .map((s) => s.source);

  return selected;
}
