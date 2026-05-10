'use client';

interface Item {
  title: string;
  url: string | null;
  snippet: string;
  extra: string | number | null;
  timestamp: string | null;
}

interface SourceCardProps {
  label: string;
  status: 'loading' | 'ok' | 'error';
  items?: Item[];
  error?: string;
}

export function SourceCard({ label, status, items, error }: SourceCardProps) {
  return (
    <div className="border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1a1a1a] bg-black">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              status === 'ok'
                ? 'bg-[#00ff88]'
                : status === 'error'
                ? 'bg-[#ff3355]'
                : 'bg-[#ffb800] pulse-dot'
            }`}
          />
          <span className="text-[10px] text-[#a3a3a3] tracking-wider truncate">{label.toUpperCase()}</span>
        </div>
        <span
          className={`text-[9px] tabular-nums flex-shrink-0 ${
            status === 'ok'
              ? 'text-[#00ff88]'
              : status === 'error'
              ? 'text-[#ff3355]'
              : 'text-[#ffb800]'
          }`}
        >
          {status === 'ok' ? `${items?.length || 0} HITS` : status === 'error' ? 'ERR' : 'FETCH'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 text-[10px] max-h-[280px]">
        {status === 'loading' && (
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-[#141414] animate-pulse" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="text-[#ff3355] text-[10px]">{error || 'Connection failed'}</div>
        )}

        {status === 'ok' && items && items.length === 0 && (
          <div className="text-[#525252] italic">No results</div>
        )}

        {status === 'ok' && items && items.map((item, i) => (
          <div
            key={i}
            className="py-1 border-b border-[#141414] last:border-0 hover:bg-[#0d0d0d] transition-colors"
          >
            <a
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex items-start gap-2">
                <span className="text-[#525252] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#e5e5e5] group-hover:text-[#00ff88] line-clamp-2 leading-tight">
                    {item.title}
                  </div>
                  {item.snippet && (
                    <div className="text-[#525252] line-clamp-1 mt-0.5 text-[9px]">
                      {item.snippet}
                    </div>
                  )}
                </div>
                {item.extra !== null && item.extra !== undefined && (
                  <span className="text-[#00ff88] tabular-nums text-[9px] flex-shrink-0">
                    {typeof item.extra === 'number' ? item.extra.toLocaleString() : item.extra}
                  </span>
                )}
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
