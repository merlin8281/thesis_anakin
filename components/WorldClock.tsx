'use client';

import { useEffect, useState } from 'react';

const TIMEZONES = [
  { city: 'NEW YORK', tz: 'America/New_York' },
  { city: 'LONDON', tz: 'Europe/London' },
  { city: 'TOKYO', tz: 'Asia/Tokyo' },
  { city: 'HONG KONG', tz: 'Asia/Hong_Kong' },
  { city: 'DUBAI', tz: 'Asia/Dubai' },
  { city: 'MUMBAI', tz: 'Asia/Kolkata' },
];

export function WorldClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="px-2 py-1 border-b border-[#1a1a1a] bg-black flex items-center gap-2">
        <span className="text-[#525252]">⊞</span>
        <span className="text-[10px] text-[#a3a3a3] tracking-wider">WORLD CLOCK</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-2">
        {TIMEZONES.map(({ city, tz }) => {
          const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: tz,
          });
          return (
            <div key={city} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#00ff88]" />
                <span className="text-[#a3a3a3]">{city}</span>
              </div>
              <span className="text-white tabular-nums">{time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
