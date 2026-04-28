'use client'

import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import type {
  DeathVelocityRow, DeathCause, DangerWindowRow, HazardCell,
} from '@/lib/db/graveyard'

// ─── Death Velocity Chart ─────────────────────────────────────────────────────
// Shows the IQR + median time-to-death for each kill mechanism.
// Professionals use this to benchmark: "how much runway do I have?"

export function DeathVelocityChart({ rows }: { rows: DeathVelocityRow[] }) {
  // Build chart data: one bar representing the IQR range, a marker for median
  const data = rows.map(r => ({
    ...r,
    // recharts stacked trick: invisible bar to "offset" the IQR bar
    offset: r.p25Months,
    iqr: r.p75Months - r.p25Months,
    medianLabel: `${(r.medianMonths / 12).toFixed(1)}yr`,
  }))

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: { payload: typeof data[0] }[]
  }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl max-w-xs">
        <p className="font-semibold text-white mb-1">{d.label}</p>
        <div className="space-y-1 mb-2">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Median age at death</span>
            <span className="font-mono text-white">{d.medianMonths}mo ({(d.medianMonths/12).toFixed(1)}yr)</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Middle 50%</span>
            <span className="font-mono text-zinc-300">{d.p25Months}–{d.p75Months}mo</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Range</span>
            <span className="font-mono text-zinc-300">{d.minMonths}–{d.maxMonths}mo</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Fastest</span>
            <span className="font-mono text-zinc-400">{d.fastestName}</span>
          </div>
        </div>
        <p className="text-zinc-500 italic border-t border-zinc-800 pt-2">{d.insight}</p>
      </div>
    )
  }

  const maxMonths = Math.max(...rows.map(r => r.maxMonths))

  return (
    <div>
      <ResponsiveContainer width="100%" height={rows.length * 52 + 40}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          barSize={10}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, maxMonths + 12]}
            tickFormatter={(v: number) => v < 12 ? `${v}mo` : `${Math.round(v / 12)}yr`}
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
            ticks={[0, 12, 24, 36, 60, 84, 120, 180, 240]}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

          {/* Invisible offset bar (p25) */}
          <Bar dataKey="offset" stackId="v" fill="transparent" />

          {/* IQR bar (p25 → p75) */}
          <Bar dataKey="iqr" stackId="v" radius={[3, 3, 3, 3]}>
            {data.map((d) => (
              <Cell key={d.reason} fill={d.color} fillOpacity={0.3} />
            ))}
          </Bar>

          {/* Median reference lines per row — drawn as custom labels */}
          {data.map((d) => (
            <ReferenceLine
              key={`med-${d.reason}`}
              x={d.medianMonths}
              stroke="transparent"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Median dots overlay — recharts can't do this natively for grouped bars */}
      <div className="relative -mt-1 ml-[138px] mr-[60px]">
        {data.map((d, i) => {
          const pct = (d.medianMonths / (maxMonths + 12)) * 100
          return (
            <div
              key={d.reason}
              className="absolute flex items-center"
              style={{ left: `${pct}%`, top: i * 52 + 8, transform: 'translateX(-50%)' }}
            >
              <div
                className="h-3 w-3 rounded-full border-2 border-zinc-900 shadow-lg"
                style={{ background: d.color }}
                title={`Median: ${d.medianMonths}mo`}
              />
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[10px] text-zinc-600 font-mono">
        Bar = interquartile range (25th–75th percentile) · Dot = median · n={rows.reduce((s, r) => s + r.count, 0)} failures
      </p>
    </div>
  )
}

// ─── Death Cause Distribution ─────────────────────────────────────────────────

export function DeathCauseChart({ causes }: { causes: DeathCause[] }) {
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: { payload: DeathCause }[]
  }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-white">{d.label}</p>
        <p className="font-mono text-zinc-400">{d.count} products · {d.pct}% of failures</p>
        <p className="text-zinc-500 mt-1">Median lifespan: {d.medianMonths}mo ({(d.medianMonths/12).toFixed(1)}yr)</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={causes}
        layout="vertical"
        margin={{ top: 0, right: 36, left: 8, bottom: 0 }}
        barSize={13}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          domain={[0, 35]}
        />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fill: '#a1a1aa', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={125}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
          {causes.map((c) => (
            <Cell key={c.reason} fill={c.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Danger Windows ───────────────────────────────────────────────────────────
// Stacked horizontal bar: early (0-2yr) / mid (2-5yr) / late (5yr+)
// Answers: "which phase is most dangerous for this category?"

const WINDOW_COLORS = {
  early: '#ef4444',
  mid: '#f97316',
  late: '#eab308',
}

const WINDOW_LABELS = {
  early: '0–2 yr  (startup killer)',
  mid: '2–5 yr  (growth stage)',
  late: '5+ yr   (established)',
}

export function DangerWindowsChart({ rows }: { rows: DangerWindowRow[] }) {
  const data = rows.map(r => ({
    name: r.displayName,
    early: r.earlyPct,
    mid: r.midPct,
    late: r.latePct,
    median: r.medianMonths,
    count: r.count,
    peak: r.peakWindow,
  }))

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const row = data.find(d => d.name === label)
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl">
        <p className="font-semibold text-white mb-1.5">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{WINDOW_LABELS[p.name as keyof typeof WINDOW_LABELS]}</span>
            <span className="font-mono text-white">{p.value}%</span>
          </div>
        ))}
        {row && (
          <p className="text-zinc-500 mt-1.5 border-t border-zinc-800 pt-1.5 font-mono">
            Median: {row.median}mo · n={row.count}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        {Object.entries(WINDOW_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm" style={{ background: WINDOW_COLORS[k as keyof typeof WINDOW_COLORS] }} />
            <span className="text-[10px] text-zinc-500">{label.split('  ')[0]}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={rows.length * 44 + 40}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
          barSize={18}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={50} stroke="#3f3f46" strokeDasharray="4 2" />
          <Bar dataKey="early" stackId="w" fill={WINDOW_COLORS.early} fillOpacity={0.85} />
          <Bar dataKey="mid" stackId="w" fill={WINDOW_COLORS.mid} fillOpacity={0.85} />
          <Bar dataKey="late" stackId="w" fill={WINDOW_COLORS.late} fillOpacity={0.85} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[10px] text-zinc-600 font-mono">
        % of failures occurring in each lifecycle phase · conditional on eventual death · n=120 curated failures
      </p>
    </div>
  )
}

// ─── Death Wave Timeline ──────────────────────────────────────────────────────

const WAVE_COLORS: Record<string, string> = {
  social: '#ef4444', productivity: '#3b82f6', media: '#f97316',
  hardware: '#a855f7', 'e-commerce': '#22c55e', communication: '#eab308',
  gaming: '#ec4899', other: '#52525b',
}

const WAVE_LABELS: Record<string, string> = {
  social: 'Social', productivity: 'Productivity', media: 'Media',
  hardware: 'Hardware', 'e-commerce': 'E-Commerce', communication: 'Comms',
  gaming: 'Gaming', other: 'Other',
}

import {
  BarChart as RC_BarChart, Bar as RC_Bar, XAxis as RC_XAxis, YAxis as RC_YAxis,
  CartesianGrid as RC_Grid, Tooltip as RC_Tooltip, Legend as RC_Legend,
  ResponsiveContainer as RC_Container,
} from 'recharts'

export function DeathWaveChart({ years, series, categories }: {
  years: number[]
  series: Record<string, number[]>
  categories: string[]
}) {
  const data = years.map((yr, i) => {
    const row: Record<string, number | string> = { year: yr }
    for (const cat of categories) row[cat] = series[cat]?.[i] ?? 0
    return row
  })

  return (
    <RC_Container width="100%" height={220}>
      <RC_BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={12}>
        <RC_Grid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <RC_XAxis
          dataKey="year"
          tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          interval={2}
        />
        <RC_YAxis
          tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <RC_Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
          cursor={{ fill: '#27272a' }}
        />
        <RC_Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 6 }}
          formatter={(v: string) => <span style={{ color: '#71717a' }}>{WAVE_LABELS[v] ?? v}</span>}
        />
        {categories.map(cat => (
          <RC_Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={WAVE_COLORS[cat] ?? '#52525b'} />
        ))}
      </RC_BarChart>
    </RC_Container>
  )
}

// ─── Hazard Heatmap ───────────────────────────────────────────────────────────

const AGE_BUCKETS = ['0-1yr', '1-3yr', '3-5yr', '5-10yr', '10yr+']
const AGE_LABELS: Record<string, string> = {
  '0-1yr': '< 1 yr', '1-3yr': '1–3 yr', '3-5yr': '3–5 yr',
  '5-10yr': '5–10 yr', '10yr+': '10+ yr',
}

export function HazardHeatmap({ cells }: { cells: HazardCell[] }) {
  const categories = Array.from(new Set(cells.map(c => c.category)))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid mb-1" style={{ gridTemplateColumns: '110px repeat(5, 1fr)' }}>
          <div />
          {AGE_BUCKETS.map(b => (
            <div key={b} className="text-center text-[10px] font-mono text-zinc-600 pb-1">
              {AGE_LABELS[b]}
            </div>
          ))}
        </div>
        {categories.map(cat => {
          const row = cells.filter(c => c.category === cat)
          const displayName = row[0]?.displayName ?? cat
          return (
            <div key={cat} className="grid mb-0.5" style={{ gridTemplateColumns: '110px repeat(5, 1fr)' }}>
              <div className="flex items-center text-xs text-zinc-400 font-medium pr-3 truncate">
                {displayName}
              </div>
              {AGE_BUCKETS.map(b => {
                const cell = row.find(c => c.ageBucket === b)
                const intensity = cell?.intensity ?? 0
                const pct = cell?.pct ?? 0
                const count = cell?.count ?? 0
                return (
                  <div
                    key={b}
                    title={`${displayName} · ${AGE_LABELS[b]}: ${count} products died here (${pct}% of ${displayName} failures)`}
                    className="mx-0.5 h-8 rounded flex items-center justify-center text-[10px] font-mono transition-all cursor-default"
                    style={{
                      background: `rgba(239, 68, 68, ${0.07 + intensity * 0.83})`,
                      color: intensity > 0.6 ? '#fca5a5' : intensity > 0.3 ? '#f87171' : '#7f1d1d',
                    }}
                  >
                    {pct > 0 ? `${Math.round(pct)}%` : '—'}
                  </div>
                )
              })}
            </div>
          )
        })}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-zinc-700">Low concentration</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.95].map(i => (
              <div key={i} className="h-3 w-5 rounded-sm" style={{ background: `rgba(239,68,68,${0.07+i*0.83})` }} />
            ))}
          </div>
          <span className="text-[10px] text-zinc-700">High concentration</span>
        </div>
        <p className="text-[10px] text-zinc-700 font-mono mt-1">
          % of that category's failures occurring in each age window · conditional on observed deaths
        </p>
      </div>
    </div>
  )
}
