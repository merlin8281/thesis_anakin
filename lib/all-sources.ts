export interface SourceMeta {
  slug: string;
  name: string;
  category: string;
  keywords: string[];
}

export const ALL_SOURCES: SourceMeta[] = [
  // Analytics
  { slug: 'google_trends', name: 'Google Trends', category: 'analytics', keywords: ['trends', 'popularity', 'search volume', 'interest'] },

  // Books
  { slug: 'goodreads', name: 'Goodreads', category: 'books', keywords: ['books', 'reading', 'authors', 'literature', 'novels'] },

  // Content
  { slug: 'medium', name: 'Medium', category: 'content', keywords: ['articles', 'blog', 'essays', 'opinion', 'writing'] },
  { slug: 'substack', name: 'Substack', category: 'content', keywords: ['newsletter', 'blog', 'writers', 'subscription'] },

  // Developer Tools
  { slug: 'github_public', name: 'GitHub', category: 'developer', keywords: ['code', 'programming', 'open source', 'software', 'repository', 'developer', 'tech'] },
  { slug: 'stackoverflow', name: 'StackOverflow', category: 'developer', keywords: ['programming', 'code', 'debug', 'error', 'developer', 'how to'] },
  { slug: 'npm', name: 'npm', category: 'developer', keywords: ['javascript', 'node', 'package', 'library', 'npm'] },
  { slug: 'pypi', name: 'PyPI', category: 'developer', keywords: ['python', 'package', 'library', 'pip'] },
  { slug: 'devto', name: 'DEV Community', category: 'developer', keywords: ['developer', 'programming', 'tutorial', 'tech'] },

  // Finance & Markets
  { slug: 'yahoo_finance', name: 'Yahoo Finance', category: 'finance', keywords: ['stock', 'market', 'trading', 'finance', 'investment', 'price', 'ticker'] },
  { slug: 'coingecko', name: 'CoinGecko', category: 'finance', keywords: ['crypto', 'bitcoin', 'ethereum', 'token', 'coin', 'blockchain', 'defi'] },
  { slug: 'finviz', name: 'Finviz', category: 'finance', keywords: ['stock', 'screener', 'market', 'trading'] },
  { slug: 'nasdaq', name: 'NASDAQ', category: 'finance', keywords: ['stock', 'nasdaq', 'market', 'trading', 'tech stocks'] },
  { slug: 'investing_com', name: 'Investing.com', category: 'finance', keywords: ['forex', 'commodities', 'stocks', 'market', 'trading'] },
  { slug: 'stocktwits', name: 'StockTwits', category: 'finance', keywords: ['stock', 'trading', 'sentiment', 'market'] },
  { slug: 'fred_stlouisfed', name: 'FRED', category: 'finance', keywords: ['economics', 'data', 'gdp', 'inflation', 'fed', 'rates'] },
  { slug: 'trading_economics', name: 'Trading Economics', category: 'finance', keywords: ['economics', 'gdp', 'inflation', 'indicators'] },
  { slug: 'sec_edgar', name: 'SEC EDGAR', category: 'finance', keywords: ['sec', 'filing', '10k', '10q', 'company', 'disclosure'] },
  { slug: 'fear_greed', name: 'Fear & Greed Index', category: 'finance', keywords: ['market', 'sentiment', 'fear', 'greed'] },

  // Prediction Markets
  { slug: 'polymarket', name: 'Polymarket', category: 'prediction', keywords: ['prediction', 'betting', 'odds', 'election', 'event', 'market'] },
  { slug: 'kalshi', name: 'Kalshi', category: 'prediction', keywords: ['prediction', 'event', 'contract', 'odds'] },
  { slug: 'manifold', name: 'Manifold', category: 'prediction', keywords: ['prediction', 'market', 'forecast'] },

  // News
  { slug: 'google_news', name: 'Google News', category: 'news', keywords: ['news', 'current', 'events', 'breaking', 'headlines'] },
  { slug: 'hackernews', name: 'Hacker News', category: 'news', keywords: ['tech', 'startup', 'programming', 'hn', 'ycombinator'] },
  { slug: 'techcrunch', name: 'TechCrunch', category: 'news', keywords: ['tech', 'startup', 'funding', 'venture', 'silicon valley'] },
  { slug: 'reuters', name: 'Reuters', category: 'news', keywords: ['news', 'world', 'politics', 'business', 'breaking'] },
  { slug: 'bbc', name: 'BBC News', category: 'news', keywords: ['news', 'world', 'uk', 'international'] },
  { slug: 'cnbc', name: 'CNBC', category: 'news', keywords: ['business', 'finance', 'market', 'economy', 'news'] },
  { slug: 'apnews', name: 'AP News', category: 'news', keywords: ['news', 'breaking', 'world', 'politics'] },
  { slug: 'aljazeera', name: 'Al Jazeera', category: 'news', keywords: ['news', 'middle east', 'world', 'politics'] },
  { slug: 'guardian', name: 'The Guardian', category: 'news', keywords: ['news', 'uk', 'opinion', 'world'] },
  { slug: 'scmp', name: 'South China Morning Post', category: 'news', keywords: ['china', 'asia', 'hong kong', 'news'] },
  { slug: 'nikkei_asia', name: 'Nikkei Asia', category: 'news', keywords: ['asia', 'japan', 'business', 'economy'] },
  { slug: 'economic_times', name: 'Economic Times', category: 'news', keywords: ['india', 'business', 'economy', 'market'] },

  // Research & Academic
  { slug: 'arxiv', name: 'arXiv', category: 'research', keywords: ['research', 'paper', 'academic', 'science', 'ai', 'ml', 'physics', 'math'] },
  { slug: 'pubmed', name: 'PubMed', category: 'research', keywords: ['medical', 'health', 'research', 'paper', 'clinical', 'biology'] },
  { slug: 'semantic_scholar', name: 'Semantic Scholar', category: 'research', keywords: ['research', 'paper', 'academic', 'citation'] },

  // Social
  { slug: 'reddit', name: 'Reddit', category: 'social', keywords: ['discussion', 'community', 'forum', 'opinion', 'subreddit'] },
  { slug: 'youtube', name: 'YouTube', category: 'social', keywords: ['video', 'tutorial', 'watch', 'channel', 'creator'] },

  // Reference
  { slug: 'wikipedia', name: 'Wikipedia', category: 'reference', keywords: ['wiki', 'definition', 'what is', 'history', 'background'] },

  // Jobs
  { slug: 'indeed', name: 'Indeed', category: 'jobs', keywords: ['jobs', 'hiring', 'career', 'salary', 'employment'] },
  { slug: 'remoteok', name: 'RemoteOK', category: 'jobs', keywords: ['remote', 'jobs', 'work from home', 'hiring'] },
  { slug: 'weworkremotely', name: 'We Work Remotely', category: 'jobs', keywords: ['remote', 'jobs', 'hiring'] },

  // E-commerce
  { slug: 'amazon', name: 'Amazon', category: 'ecommerce', keywords: ['buy', 'product', 'price', 'review', 'shopping'] },
  { slug: 'flipkart', name: 'Flipkart', category: 'ecommerce', keywords: ['buy', 'product', 'price', 'shopping', 'india', 'indian'] },

  // Travel
  { slug: 'airbnb', name: 'Airbnb', category: 'travel', keywords: ['stay', 'rental', 'travel', 'accommodation', 'vacation'] },
  { slug: 'google_flights', name: 'Google Flights', category: 'travel', keywords: ['flights', 'travel', 'airline', 'booking'] },
  { slug: 'booking', name: 'Booking.com', category: 'travel', keywords: ['hotel', 'travel', 'booking', 'stay'] },
  { slug: 'skyscanner', name: 'Skyscanner', category: 'travel', keywords: ['flights', 'cheap', 'travel', 'compare'] },

  // Startups
  { slug: 'ycombinator', name: 'Y Combinator', category: 'startups', keywords: ['startup', 'yc', 'funding', 'accelerator', 'batch'] },

  // Real Estate
  { slug: 'zillow', name: 'Zillow', category: 'real-estate', keywords: ['house', 'real estate', 'property', 'rent', 'buy home'] },

  // Entertainment
  { slug: 'imdb', name: 'IMDb', category: 'entertainment', keywords: ['movie', 'film', 'tv', 'actor', 'rating', 'show'] },
  { slug: 'steam', name: 'Steam', category: 'entertainment', keywords: ['game', 'gaming', 'pc', 'steam', 'video game'] },

  // Reviews
  { slug: 'trustpilot', name: 'Trustpilot', category: 'reviews', keywords: ['review', 'rating', 'company', 'feedback'] },

  // Events
  { slug: 'meetup', name: 'Meetup', category: 'events', keywords: ['event', 'meetup', 'group', 'networking'] },
  { slug: 'luma', name: 'Luma', category: 'events', keywords: ['event', 'conference', 'meetup', 'calendar'] },

  // Health
  { slug: 'drugs_com', name: 'Drugs.com', category: 'health', keywords: ['drug', 'medicine', 'medication', 'side effects', 'health'] },
];

export const CATEGORY_ICONS: Record<string, string> = {
  analytics: '📊',
  books: '📚',
  content: '✍️',
  developer: '💻',
  finance: '💰',
  prediction: '🎯',
  news: '📰',
  research: '🔬',
  social: '💬',
  reference: '📖',
  jobs: '💼',
  ecommerce: '🛒',
  travel: '✈️',
  startups: '🚀',
  'real-estate': '🏠',
  entertainment: '🎬',
  reviews: '⭐',
  events: '📅',
  health: '💊',
};
