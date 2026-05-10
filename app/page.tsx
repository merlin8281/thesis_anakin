'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SourceCard } from '@/components/SourceCard';
import { SynthesisCard } from '@/components/SynthesisCard';
import { TickerBar } from '@/components/TickerBar';
import { LiveVideo } from '@/components/LiveVideo';
import { WorldClock } from '@/components/WorldClock';

interface SourceData {
  slug: string;
  name: string;
  category: string;
  icon: string;
  status: 'loading' | 'ok' | 'error';
  items?: Array<{
    title: string;
    url: string | null;
    snippet: string;
    extra: string | number | null;
    timestamp: string | null;
  }>;
  error?: string;
}

interface SynthesisData {
  status: 'loading' | 'ok' | 'error';
  summary?: string;
  error?: string;
}

interface VideoData {
  id: string;
  title: string;
  channel?: string;
}

const SUGGESTIONS = [
  'BITCOIN PRICE',
  'AI STARTUP FUNDING',
  'TESLA STOCK',
  'ML RESEARCH PAPERS',
  'REMOTE DEV JOBS',
  'POLYMARKET ELECTION',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisData>({ status: 'loading' });
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!startTime || !loading) return;
    const i = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);
    return () => clearInterval(i);
  }, [startTime, loading]);

  async function handleSearch(searchTopic?: string) {
    const t = searchTopic || query;
    if (!t.trim()) return;

    setLoading(true);
    setError(null);
    setTopic(t);
    setSources([]);
    setSynthesis({ status: 'loading' });
    setVideos([]);
    setStartTime(Date.now());
    setElapsed(0);

    try {
      const res = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === 'sources_selected') {
            setSources(
              data.sources.map((s: any) => ({ ...s, status: 'loading' as const }))
            );
          } else if (data.type === 'source') {
            setSources((prev) =>
              prev.map((s) =>
                s.slug === data.slug
                  ? { ...s, status: data.status, items: data.items, error: data.error }
                  : s
              )
            );
          } else if (data.type === 'videos') {
            setVideos(data.videos || []);
          } else if (data.type === 'synthesis') {
            setSynthesis({
              status: data.status,
              summary: data.summary,
              error: data.error,
            });
          } else if (data.type === 'done') {
            setLoading(false);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const completedCount = sources.filter((s) => s.status === 'ok').length;
  const errorCount = sources.filter((s) => s.status === 'error').length;
  const totalCount = sources.length;
  const utcTime = now.toUTCString().split(' ')[4];

  const tickerItems = sources.length > 0
    ? sources.map(s => ({
        slug: s.slug,
        name: s.name,
        status: s.status,
        count: s.items?.length,
      }))
    : [];

  return (
    <div className="h-screen flex flex-col bg-black text-[#e5e5e5] overflow-hidden">
      {/* Top Ticker Bar */}
      <TickerBar items={tickerItems} />

      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-black px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff88] text-[16px] font-bold tracking-tighter">THESIS</span>
            <span className="text-[10px] text-[#525252] tracking-wider">RESEARCH TERMINAL</span>
          </div>
          <div className="h-3 w-px bg-[#1a1a1a]" />
          <nav className="flex gap-3 text-[10px] tracking-wider">
            <button className="text-[#00ff88]">ALL</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">NEWS</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">FINANCE</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">RESEARCH</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">SOCIAL</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">PREDICTIONS</button>
            <button className="text-[#525252] hover:text-[#a3a3a3]">DEV</button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-[#525252]">SOURCES <span className="text-[#00ff88]">114/114</span></span>
          <span className="text-[#525252]">AI <span className="text-[#00ff88]">CLAUDE-3.5</span></span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] pulse-dot" />
            <span className="text-[#a3a3a3] tabular-nums">{utcTime} UTC</span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => handleSearch()}
          disabled={loading}
        />
      </div>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden min-h-0">
        {/* Left Sidebar - Source List */}
        <div className="col-span-2 border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col overflow-hidden">
          <div className="px-2 py-1 border-b border-[#1a1a1a] bg-black flex items-center justify-between">
            <span className="text-[10px] text-[#a3a3a3] tracking-wider">SOURCE FEED</span>
            <span className="text-[9px] text-[#525252]">{totalCount > 0 ? `${completedCount}/${totalCount}` : '0/0'}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sources.length === 0 && !error && (
              <div className="p-2 space-y-1">
                <div className="text-[9px] text-[#525252] mb-2">⌘ TRY:</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      handleSearch(s);
                    }}
                    className="block w-full text-left text-[10px] text-[#a3a3a3] hover:text-[#00ff88] hover:bg-[#0d0d0d] px-1.5 py-1 transition-colors"
                  >
                    <span className="text-[#525252]">▸ </span>{s}
                  </button>
                ))}
              </div>
            )}

            {sources.map((source, i) => (
              <div
                key={source.slug}
                className={`flex items-center justify-between px-2 py-1 border-b border-[#141414] text-[10px] hover:bg-[#0d0d0d] transition-colors ${
                  source.status === 'ok' ? 'flash-green' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[#525252] tabular-nums text-[9px]">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    className={`w-1 h-1 rounded-full flex-shrink-0 ${
                      source.status === 'ok'
                        ? 'bg-[#00ff88]'
                        : source.status === 'error'
                        ? 'bg-[#ff3355]'
                        : 'bg-[#ffb800] pulse-dot'
                    }`}
                  />
                  <span className="truncate">{source.name}</span>
                </div>
                <span
                  className={`text-[9px] tabular-nums flex-shrink-0 ml-1 ${
                    source.status === 'ok'
                      ? 'text-[#00ff88]'
                      : source.status === 'error'
                      ? 'text-[#ff3355]'
                      : 'text-[#525252]'
                  }`}
                >
                  {source.status === 'ok' ? `+${source.items?.length || 0}` : source.status === 'error' ? 'ERR' : '...'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Main Content */}
        <div className="col-span-7 flex flex-col gap-2 overflow-hidden min-h-0">
          {/* Status Bar */}
          {topic && (
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 flex items-center justify-between text-[10px] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[#525252]">QUERY:</span>
                <span className="text-[#00ff88] tracking-wider uppercase">{topic}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-[#525252]">ELAPSED <span className="text-[#a3a3a3]">{elapsed.toFixed(1)}s</span></span>
                <span className="text-[#525252]">OK <span className="text-[#00ff88]">{completedCount}</span></span>
                <span className="text-[#525252]">ERR <span className="text-[#ff3355]">{errorCount}</span></span>
                {loading && (
                  <span className="text-[#ffb800] flex items-center gap-1">
                    <span className="blink">▌</span>LIVE
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-[#ff3355]/30 bg-[#ff3355]/5 px-3 py-2 text-[11px] text-[#ff3355]">
              [ERROR] {error}
            </div>
          )}

          {/* Empty state */}
          {!topic && !error && (
            <div className="flex-1 border border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-center">
              <div className="text-center max-w-lg px-6">
                <div className="text-[10px] text-[#525252] mb-3 tracking-widest">SYSTEM READY</div>
                <div className="text-[24px] font-bold text-white mb-2 tracking-tight">
                  RESEARCH <span className="text-[#00ff88]">ANYTHING</span>
                </div>
                <div className="text-[11px] text-[#a3a3a3] mb-4">
                  AI selects optimal sources from 114 integrations. Real-time streaming. Sub-5s latency.
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {[
                    { l: 'NEWS', v: '12' },
                    { l: 'FINANCE', v: '11' },
                    { l: 'RESEARCH', v: '3' },
                    { l: 'PREDICT', v: '3' },
                    { l: 'DEV', v: '6' },
                    { l: 'SOCIAL', v: '2' },
                  ].map((c) => (
                    <div key={c.l} className="border border-[#1a1a1a] px-2 py-1.5 flex items-center justify-between">
                      <span className="text-[#a3a3a3]">{c.l}</span>
                      <span className="text-[#00ff88] tabular-nums">{c.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Source Grid */}
          {sources.length > 0 && (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 min-h-0">
              {sources.map((source) => (
                <SourceCard
                  key={source.slug}
                  label={`${source.icon} ${source.name}`}
                  status={source.status}
                  items={source.items}
                  error={source.error}
                />
              ))}
            </div>
          )}

          {/* Synthesis */}
          {topic && (
            <div className="flex-shrink-0">
              <SynthesisCard
                status={synthesis.status}
                summary={synthesis.summary}
                error={synthesis.error}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Live Video + World Clock */}
        <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
          <LiveVideo videos={videos} topic={topic} />
          <WorldClock />

          {/* Quick Stats */}
          <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="px-2 py-1 border-b border-[#1a1a1a] bg-black flex items-center gap-2">
              <span className="text-[#00ff88] text-[10px]">▦</span>
              <span className="text-[10px] text-[#a3a3a3] tracking-wider">SOURCE BREAKDOWN</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 p-2 text-[10px]">
              {[
                ['NEWS', 12, '#00ff88'],
                ['FINANCE', 11, '#00ff88'],
                ['DEV', 6, '#ffb800'],
                ['RESEARCH', 3, '#00d4ff'],
                ['PREDICT', 3, '#00d4ff'],
                ['SOCIAL', 2, '#ff3355'],
                ['JOBS', 3, '#ff3355'],
                ['TRAVEL', 4, '#a3a3a3'],
                ['REVIEWS', 1, '#a3a3a3'],
                ['HEALTH', 1, '#a3a3a3'],
              ].map(([name, count, color]) => (
                <div key={String(name)} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full" style={{ background: color as string }} />
                    <span className="text-[#a3a3a3]">{name}</span>
                  </div>
                  <span className="text-white tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="px-2 py-1 border-b border-[#1a1a1a] bg-black flex items-center gap-2">
              <span className="text-[#00ff88] text-[10px]">●</span>
              <span className="text-[10px] text-[#a3a3a3] tracking-wider">SYSTEM</span>
            </div>
            <div className="p-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#525252]">ANAKIN API</span>
                <span className="text-[#00ff88]">● ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">OPENROUTER</span>
                <span className="text-[#00ff88]">● ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">SSE STREAM</span>
                <span className="text-[#00ff88]">● ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">TG BOT</span>
                <span className="text-[#00ff88]">● ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-black px-3 py-1 flex items-center justify-between text-[9px] text-[#525252]">
        <div className="flex items-center gap-3">
          <span>THESIS v3.0</span>
          <span>•</span>
          <span>POWERED BY ANAKIN.AI</span>
          <span>•</span>
          <span>114 SOURCES</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PRESS / TO FOCUS</span>
          <span>•</span>
          <span>↵ TO EXECUTE</span>
        </div>
      </footer>
    </div>
  );
}
