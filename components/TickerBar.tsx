'use client';

interface TickerItem {
  slug: string;
  name: string;
  status: 'loading' | 'ok' | 'error' | 'idle';
  count?: number;
}

export function TickerBar({ items }: { items: TickerItem[] }) {
  const displayItems = items.length > 0 ? items : DEFAULT_TICKERS;
  const doubled = [...displayItems, ...displayItems];

  return (
    <div className="border-b border-[#1a1a1a] bg-black overflow-hidden h-7 flex items-center">
      <div className="flex ticker-scroll whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center px-4 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                item.status === 'ok'
                  ? 'bg-[#00ff88]'
                  : item.status === 'error'
                  ? 'bg-[#ff3355]'
                  : item.status === 'loading'
                  ? 'bg-[#ffb800] pulse-dot'
                  : 'bg-[#525252]'
              }`}
            />
            <span className="text-[#a3a3a3]">{item.name.toUpperCase()}</span>
            {item.count !== undefined && (
              <span
                className={`ml-2 ${
                  item.status === 'ok'
                    ? 'text-[#00ff88]'
                    : item.status === 'error'
                    ? 'text-[#ff3355]'
                    : 'text-[#525252]'
                }`}
              >
                {item.status === 'ok' ? `+${item.count}` : item.status === 'error' ? 'ERR' : '...'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_TICKERS: TickerItem[] = [
  { slug: 'hn', name: 'HACKERNEWS', status: 'idle' },
  { slug: 'reddit', name: 'REDDIT', status: 'idle' },
  { slug: 'arxiv', name: 'ARXIV', status: 'idle' },
  { slug: 'github', name: 'GITHUB', status: 'idle' },
  { slug: 'polymarket', name: 'POLYMARKET', status: 'idle' },
  { slug: 'coingecko', name: 'COINGECKO', status: 'idle' },
  { slug: 'sec', name: 'SEC EDGAR', status: 'idle' },
  { slug: 'arxiv', name: 'PUBMED', status: 'idle' },
  { slug: 'tc', name: 'TECHCRUNCH', status: 'idle' },
  { slug: 'reuters', name: 'REUTERS', status: 'idle' },
  { slug: 'bbc', name: 'BBC', status: 'idle' },
  { slug: 'cnbc', name: 'CNBC', status: 'idle' },
  { slug: 'gn', name: 'GOOGLE NEWS', status: 'idle' },
  { slug: 'yt', name: 'YOUTUBE', status: 'idle' },
  { slug: 'wp', name: 'WIKIPEDIA', status: 'idle' },
  { slug: 'yf', name: 'YAHOO FINANCE', status: 'idle' },
  { slug: 'kalshi', name: 'KALSHI', status: 'idle' },
  { slug: 'so', name: 'STACKOVERFLOW', status: 'idle' },
];
