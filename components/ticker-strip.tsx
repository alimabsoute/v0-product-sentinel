'use client'

import type { MarketStats } from '@/lib/db/products'

const SEPARATOR = <span className="opacity-30 mx-3">·</span>

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-mono text-zinc-100">{value}</span>
      <span className="ml-1.5 text-zinc-400 text-xs">{label}</span>
    </span>
  )
}

export function TickerStrip({ stats }: { stats: MarketStats }) {
  const items = [
    <Stat key="total" label="products tracked" value={stats.totalProducts.toLocaleString()} />,
    <Stat key="today" label="added today" value={stats.addedToday} />,
    <Stat key="press" label="press mentions" value={stats.pressCount.toLocaleString()} />,
    <Stat key="signal" label="avg signal score" value={stats.avgSignal} />,
    <Stat key="deaths" label={stats.deathsThisWeek === 1 ? 'died this week' : 'died this week'} value={stats.deathsThisWeek} />,
  ]

  // Duplicate for seamless loop
  const track = [...items, ...items]

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 overflow-hidden">
      <div className="flex items-center h-9 relative">
        {/* Leading label */}
        <div className="absolute left-0 z-10 flex items-center h-full px-4 bg-zinc-950 border-r border-zinc-800 shrink-0">
          <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
            SENTINEL
          </span>
        </div>

        {/* Scrolling track */}
        <div className="ml-24 overflow-hidden flex-1">
          <div
            className="flex gap-0 animate-ticker whitespace-nowrap text-sm"
            style={{ animationDuration: '40s' }}
          >
            {track.map((item, i) => (
              <span key={i} className="flex items-center">
                {item}
                {SEPARATOR}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
