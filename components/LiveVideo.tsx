'use client';

import { useState, useEffect } from 'react';

interface Video {
  id: string;
  title: string;
  channel?: string;
}

const DEFAULT_FEEDS: Video[] = [
  { id: 'iEpJwprxDdk', title: 'Bloomberg Live', channel: 'BLOOMBERG' },
  { id: '9NyxcX3rhQs', title: 'CNBC Live', channel: 'CNBC' },
  { id: 'YDvsBbKfLPA', title: 'BBC News Live', channel: 'BBC' },
  { id: 'gCNeDWCI0vo', title: 'Al Jazeera Live', channel: 'AL JAZEERA' },
  { id: 'F-J5t2cKBaA', title: 'Sky News Live', channel: 'SKY NEWS' },
];

export function LiveVideo({ videos, topic }: { videos?: Video[]; topic?: string | null }) {
  const isLive = !videos || videos.length === 0;
  const feeds = isLive ? DEFAULT_FEEDS : videos;
  const [active, setActive] = useState<Video>(feeds[0]);

  useEffect(() => {
    if (feeds.length > 0) setActive(feeds[0]);
  }, [videos?.length, isLive]);

  if (!feeds || feeds.length === 0) return null;

  return (
    <div className="border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1a1a1a] bg-black">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#ff3355] pulse-dot' : 'bg-[#00ff88]'}`} />
          <span className="text-[10px] text-[#a3a3a3] tracking-wider truncate">
            {isLive ? 'LIVE NEWS' : `VIDEOS · ${topic?.toUpperCase().slice(0, 30) || ''}`}
          </span>
        </div>
        <span className="text-[9px] text-[#525252] tabular-nums flex-shrink-0">
          {feeds.length} FEED{feeds.length !== 1 ? 'S' : ''}
        </span>
      </div>

      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
        <iframe
          key={active.id}
          src={`https://www.youtube.com/embed/${active.id}?autoplay=${isLive ? 1 : 0}&mute=1&controls=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="border-t border-[#1a1a1a] max-h-[140px] overflow-y-auto">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setActive(feed)}
            className={`w-full text-left px-2 py-1 border-b border-[#141414] last:border-0 transition-colors ${
              active.id === feed.id
                ? 'bg-[#00ff88]/10 border-l-2 border-l-[#00ff88]'
                : 'hover:bg-[#0d0d0d]'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-[#525252] tabular-nums text-[9px] mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] line-clamp-2 leading-tight ${
                  active.id === feed.id ? 'text-[#00ff88]' : 'text-[#e5e5e5]'
                }`}>
                  {feed.title}
                </div>
                {feed.channel && (
                  <div className="text-[9px] text-[#525252] truncate mt-0.5">
                    {feed.channel}
                  </div>
                )}
              </div>
              {active.id === feed.id && (
                <span className="text-[9px] text-[#00ff88] blink flex-shrink-0">▶</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
