'use client';

import { useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function SearchBar({ value, onChange, onSubmit, disabled }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!disabled && value.trim()) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center border border-[#1a1a1a] bg-[#0a0a0a] focus-within:border-[#00ff88] transition-colors">
        <span className="text-[#00ff88] px-2 text-[12px] blink">▶</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="QUERY > SEARCH 114 SOURCES VIA AI..."
          disabled={disabled}
          className="flex-1 bg-transparent py-2 px-1 text-[12px] text-white placeholder:text-[#525252] focus:outline-none uppercase tracking-wider"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="text-[9px] text-[#525252] border border-[#1a1a1a] px-1.5 py-0.5 mx-2">
          /
        </kbd>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={`px-3 py-2 text-[10px] tracking-wider transition-colors ${
            value.trim() && !disabled
              ? 'bg-[#00ff88] text-black hover:bg-[#00cc6a]'
              : 'bg-[#141414] text-[#525252] cursor-not-allowed'
          }`}
        >
          {disabled ? 'SEARCHING...' : 'EXECUTE'}
        </button>
      </div>
    </form>
  );
}
