'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { KMCurve, DeathCause, DeathWavePoint, HazardCell, ActuarialRow } from '@/lib/db/graveyard'

// ─── KM Survival Curve ───────────────────────────────────────────────────────

export function KMSurvivalChart({ curves }: { curves: KMCurve[] }) {
  // Build unified data array keyed by timeYears
  const timeSet = new Set<number>()
  for (const c of curves) c.points.forEach(p => timeSet.add(p.timeYears))
  const times = Array.from(timeSet).sort((a, b) => a - b)

  const chartData = times.map(t => {
    const row: Record<string, number> = { timeYears: t }
    for (const c of curves) {
      let pt = c.points[0]
      for (const p of c.points) { if (p.timeYears <= t) pt = p; else break }
      row[c.label] = parseFloat(((pt?.survival ?? 1) * 100).toFixed(1))
    }
    return row
  })

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: number
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
        <p className="mb-1.5 font-mono text-zinc-400">t = {label}yr</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="h-1.5 w-3 rounded-full" style={{ background: p.color }} />
            <span className="text-zinc-300">{p.name}:</span>
            <span className="font-mono font-medium text-white">{p.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="timeYears"
          tickFormatter={(v: number) => `${v}yr`}
          tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          domain={[0, 20]}
          type="number"
          ticks={[0, 2, 4, 6, 8, 10, 12, 15, 18, 20]}
        />
        <YAxis
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="4 4" label={{ value: 'T₅₀', fill: '#52525b', fontSize: 9 }} />
        {curves.map(c => (
          <Line
            key={c.label}
            type="stepAfter"
            dataKey={c.label}
            stroke={c.color}
            strokeWidth={c.label === 'All Products' ? 2.5 : 1.5}
            dot={false}
            activeDot={{ r: 3 }}
            opacity={c.label === 'All Products' ? 1 : 0.8}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: '#a1a1aa', fontSize: 10 }}>{value}</span>
          )}
        />
      </LineChart>
    </ResponsiveContainer>
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
        <p className="font-mono text-zinc-400">{d.count} products · {d.pct}%</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={causes}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
        barSize={14}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
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
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
        <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
          {causes.map((c) => (
            <Cell key={c.reason} fill={c.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Death Wave Timeline ──────────────────────────────────────────────────────

const WAVE_COLORS: Record<string, string> = {
  social: '#ef4444',
  productivity: '#3b82f6',
  media: '#f97316',
  hardware: '#a855f7',
  'e-commerce': '#22c55e',
  communication: '#eab308',
  gaming: '#ec4899',
  other: '#52525b',
}

const WAVE_LABELS: Record<string, string> = {
  social: 'Social',
  productivity: 'Productivity',
  media: 'Media',
  hardware: 'Hardware',
  'e-commerce': 'E-Commerce',
  communication: 'Communication',
  gaming: 'Gaming',
  other: 'Other',
}

export function DeathWaveChart({ years, series, categories }: {
  years: number[]
  series: Record<string, number[]>
  categories: string[]
}) {
  const data = years.map((yr, i) => {
    const row: Record<string, number | string> = { year: yr }
    for (const cat of categories) {
      row[cat] = series[cat]?.[i] ?? 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
          itemStyle={{ color: '#e4e4e7' }}
          cursor={{ fill: '#27272a' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: '#71717a' }}>{WAVE_LABELS[value] ?? value}</span>
          )}
        />
        {categories.map(cat => (
          <Bar
            key={cat}
            dataKey={cat}
            name={cat}
            stackId="a"
            fill={WAVE_COLORS[cat] ?? '#52525b'}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Hazard Heatmap ───────────────────────────────────────────────────────────

const AGE_BUCKETS = ['0-1yr', '1-3yr', '3-5yr', '5-10yr', '10yr+']
const AGE_LABELS: Record<string, string> = {
  '0-1yr': '< 1 year',
  '1-3yr': '1 – 3 years',
  '3-5yr': '3 – 5 years',
  '5-10yr': '5 – 10 years',
  '10yr+': '10+ years',
}

export function HazardHeatmap({ cells }: { cells: HazardCell[] }) {
  const categories = Array.from(new Set(cells.map(c => c.category)))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Header row */}
        <div className="grid mb-1" style={{ gridTemplateColumns: '120px repeat(5, 1fr)' }}>
          <div />
          {AGE_BUCKETS.map(b => (
            <div key={b} className="text-center text-[10px] font-mono text-zinc-500 pb-1">
              {AGE_LABELS[b]}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {categories.map(cat => {
          const row = cells.filter(c => c.category === cat)
          return (
            <div key={cat} className="grid mb-0.5" style={{ gridTemplateColumns: '120px repeat(5, 1fr)' }}>
              <div className="flex items-center text-xs text-zinc-400 font-medium pr-3 truncate">
                {catDisplay(cat, cells)}
              </div>
              {AGE_BUCKETS.map(b => {
                const cell = row.find(c => c.ageBucket === b)
                const intensity = cell?.intensity ?? 0
                const pct = cell?.pct ?? 0
                const count = cell?.count ?? 0
                return (
                  <div
                    key={b}
                    title={`${catDisplay(cat, cells)} · ${AGE_LABELS[b]}: ${count} products (${pct}%)`}
                    className="mx-0.5 h-8 rounded flex items-center justify-center text-[10px] font-mono transition-all"
                    style={{
                      background: `rgba(239, 68, 68, ${0.08 + intensity * 0.82})`,
                      color: intensity > 0.5 ? '#fca5a5' : intensity > 0.2 ? '#f87171' : '#7f1d1d',
                    }}
                  >
                    {pct > 0 ? `${pct}%` : '—'}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-zinc-600">Low</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
              <div key={i} className="h-3 w-5 rounded-sm" style={{ background: `rgba(239, 68, 68, ${0.08 + i * 0.82})` }} />
            ))}
          </div>
          <span className="text-[10px] text-zinc-600">High</span>
          <span className="text-[10px] text-zinc-600 ml-2">= % of category deaths in this age window</span>
        </div>
      </div>
    </div>
  )
}

function catDisplay(slug: string, cells: HazardCell[]): string {
  return cells.find(c => c.category === slug)?.displayName ?? slug
}

// ─── Actuarial Table ──────────────────────────────────────────────────────────

export function ActuarialTable({ rows }: { rows: ActuarialRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="pb-2 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">Category</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">n</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">Median Life</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">S(1yr)</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">S(3yr)</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">S(5yr)</th>
            <th className="pb-2 text-right text-xs font-mono text-zinc-500 uppercase tracking-wider">Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const riskScore = Math.round(100 - row.fiveYearSurvival)
            const riskColor = riskScore >= 80 ? 'text-red-400' : riskScore >= 60 ? 'text-orange-400' : riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'
            return (
              <tr key={row.category} className={cn('border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors', i % 2 === 0 ? '' : 'bg-zinc-950/30')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.displayName}</td>
                <td className="py-2.5 text-right font-mono text-zinc-400">{row.count}</td>
                <td className="py-2.5 text-right font-mono text-zinc-300">
                  {row.medianMonths < 12
                    ? `${row.medianMonths}mo`
                    : `${(row.medianMonths / 12).toFixed(1)}yr`}
                </td>
                <td className="py-2.5 text-right">
                  <SurvivalBar value={row.oneYearSurvival} />
                </td>
                <td className="py-2.5 text-right">
                  <SurvivalBar value={row.threeYearSurvival} />
                </td>
                <td className="py-2.5 text-right">
                  <SurvivalBar value={row.fiveYearSurvival} />
                </td>
                <td className={cn('py-2.5 text-right font-mono font-bold', riskColor)}>
                  {riskScore}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-zinc-600 font-mono">
        S(t) = Kaplan-Meier conditional survival probability. Risk = 1 − S(5yr). n = {rows.reduce((s, r) => s + r.count, 0)} dead products observed 1994–2024.
      </p>
    </div>
  )
}

function SurvivalBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#86efac' : value >= 40 ? '#facc15' : value >= 20 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="font-mono text-xs" style={{ color }}>{value}%</span>
      <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}
