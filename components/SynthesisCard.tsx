'use client';

interface SynthesisCardProps {
  status: 'loading' | 'ok' | 'error';
  summary?: string;
  error?: string;
}

export function SynthesisCard({ status, summary, error }: SynthesisCardProps) {
  return (
    <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1a1a1a] bg-black">
        <div className="flex items-center gap-2">
          <span className="text-[#00d4ff] text-[10px]">◈</span>
          <span className="text-[10px] text-[#a3a3a3] tracking-wider">AI SYNTHESIS</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'ok'
                ? 'bg-[#00ff88]'
                : status === 'error'
                ? 'bg-[#ff3355]'
                : 'bg-[#00d4ff] pulse-dot'
            }`}
          />
          <span
            className={`text-[9px] tabular-nums ${
              status === 'ok'
                ? 'text-[#00ff88]'
                : status === 'error'
                ? 'text-[#ff3355]'
                : 'text-[#00d4ff]'
            }`}
          >
            {status === 'ok' ? 'COMPLETE' : status === 'error' ? 'FAILED' : 'PROCESSING'}
          </span>
        </div>
      </div>

      <div className="p-3 text-[11px] leading-relaxed">
        {status === 'loading' && (
          <div className="space-y-2">
            <div className="h-3 bg-[#141414] animate-pulse w-full" />
            <div className="h-3 bg-[#141414] animate-pulse w-11/12" />
            <div className="h-3 bg-[#141414] animate-pulse w-4/5" />
            <div className="flex items-center gap-2 mt-3 text-[#00d4ff] text-[10px]">
              <span className="blink">▌</span>
              <span>ANALYZING SOURCES...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-[#ff3355] text-[10px]">{error || 'Synthesis failed'}</div>
        )}

        {status === 'ok' && (
          <div className="text-[#e5e5e5] whitespace-pre-wrap">
            {summary || <span className="text-[#525252]">No synthesis available</span>}
          </div>
        )}
      </div>
    </div>
  );
}
