'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { SurvivalModelData, WeibullFitResult, KMPoint } from '@/lib/db/graveyard'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'km' | 'weibull' | 'hazard'

// ─── Data helpers ──────────────────────────────────────────────────────────────

function stepInterpolate(pts: KMPoint[], t: number): number {
  const prev = [...pts].reverse().find(p => p.t <= t)
  return prev?.s ?? 1
}

function mergeKMData(
  curves: SurvivalModelData['categoryCurves'],
  overall: KMPoint[]
): Record<string, number>[] {
  const times = new Set<number>()
  curves.forEach(c => c.points.forEach(p => times.add(p.t)))
  overall.forEach(p => times.add(p.t))

  return [...times].sort((a, b) => a - b).map(t => {
    const row: Record<string, number> = { t, overall: stepInterpolate(overall, t) }
    for (const c of curves) row[c.key] = stepInterpolate(c.points, t)
    return row
  })
}

function computeHazardData(fits: WeibullFitResult[]): { key: string; displayName: string; k: number; hazardShape: string; n: number }[] {
  return [...fits]
    .filter(f => f.n >= 4)
    .sort((a, b) => a.k - b.k)
}

// ─── Bloomberg Terminal aesthetic tokens ──────────────────────────────────────

const T = {
  amber: '#ffb300',
  amberDim: '#997700',
  amberFaint: '#3d2f00',
  amberGhost: '#1a1400',
  green: '#00cc44',
  red: '#ff3300',
  yellow: '#ffcc00',
  bg: '#050400',
  bgCard: '#0a0800',
  border: '#2a1f00',
  grid: '#111100',
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function KMTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0800', border: `1px solid ${T.amberFaint}`, fontFamily: 'monospace' }}
      className="p-2 text-[10px] shadow-2xl min-w-[160px]">
      <p style={{ color: T.amberDim }} className="mb-1 font-bold">T = {label} MONTHS</p>
      {[...payload].reverse().map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3 shrink-0" style={{ background: p.color }} />
            <span style={{ color: T.amberDim }}>{p.name.toUpperCase()}</span>
          </div>
          <span style={{ color: T.amber }} className="font-bold tabular-nums">
            {(p.value * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── KM Curves chart ──────────────────────────────────────────────────────────

function KMCurvesChart({ data }: { data: SurvivalModelData }) {
  const chartData = useMemo(() => mergeKMData(data.categoryCurves, data.overallCurve), [data])

  return (
    <div>
      <div className="mb-3 font-mono text-[10px]" style={{ color: T.amberDim }}>
        <span style={{ color: T.amber }}>S(t)</span> = KAPLAN-MEIER SURVIVAL ESTIMATE
        — PROBABILITY PRODUCT SURVIVES BEYOND AGE t.&nbsp;
        <span style={{ color: T.amberFaint, borderColor: T.amberFaint }}
          className="border px-1">
          STEP FUNCTION — DROPS AT EACH OBSERVED FAILURE EVENT
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 4, right: 20, bottom: 24, left: 10 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="2 4" />
          <XAxis
            dataKey="t"
            tick={{ fill: T.amberDim, fontSize: 9, fontFamily: 'monospace' }}
            label={{ value: 'PRODUCT AGE (MONTHS)', position: 'insideBottom', offset: -12, fill: T.amberFaint, fontSize: 8, fontFamily: 'monospace' }}
          />
          <YAxis
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            domain={[0, 1]}
            tick={{ fill: T.amberDim, fontSize: 9, fontFamily: 'monospace' }}
          />
          <Tooltip content={<KMTooltip />} />
          <ReferenceLine y={0.5} stroke={T.amberFaint} strokeDasharray="6 3"
            label={{ value: 'S=50%', fill: T.amberFaint, fontSize: 8, fontFamily: 'monospace' }} />
          <ReferenceLine x={18} stroke={T.amberFaint} strokeDasharray="2 4"
            label={{ value: '18mo', fill: T.amberFaint, fontSize: 8, fontFamily: 'monospace' }} />

          {/* Overall — bright amber, bold */}
          <Line dataKey="overall" name="ALL PRODUCTS" type="stepAfter"
            stroke={T.amber} strokeWidth={2.5} dot={false} strokeOpacity={1} />

          {/* Category curves */}
          {data.categoryCurves.map(c => (
            <Line key={c.key} dataKey={c.key} name={c.displayName.toUpperCase()}
              type="stepAfter" stroke={c.color} strokeWidth={1.5}
              dot={false} strokeOpacity={0.65} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[9px]" style={{ color: T.amberDim }}>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5" style={{ background: T.amber }} />
          <span style={{ color: T.amber }}>ALL (n={data.sampleSize})</span>
        </div>
        {data.categoryCurves.map(c => (
          <div key={c.key} className="flex items-center gap-1.5">
            <div className="h-0.5 w-5" style={{ background: c.color }} />
            <span>{c.displayName.toUpperCase()} ({c.n})</span>
          </div>
        ))}
      </div>

      <div className="mt-4 font-mono text-[9px]" style={{ color: T.amberFaint }}>
        ⚠&nbsp;SAMPLE CONDITIONAL ON DOCUMENTED FAMOUS FAILURES — NOT A RANDOM-DRAW POPULATION SURVIVAL RATE.
        RELATIVE PATTERNS (CATEGORY VS CATEGORY) REMAIN ANALYTICALLY VALID.
      </div>
    </div>
  )
}

// ─── Weibull parameter table ──────────────────────────────────────────────────

const HAZARD_META = {
  decreasing: { label: '↘ INFANT-MORT', color: T.red, tip: 'Risk front-loaded — survive year 1 and safety improves' },
  constant: { label: '→ CONSTANT', color: T.yellow, tip: 'Memoryless process — age provides no protection' },
  increasing: { label: '↗ WEAR-OUT', color: T.green, tip: 'Risk compounds — older products face growing pressure' },
}

function WeibullParameterTable({ fits, overall }: { fits: WeibullFitResult[]; overall: WeibullFitResult }) {
  const rows = [overall, ...fits]
  return (
    <div>
      <div className="mb-3 font-mono text-[10px]" style={{ color: T.amberDim }}>
        <span style={{ color: T.amber }}>WEIBULL(k, λ)</span> FIT —
        PROBABILITY PAPER LINEARIZATION + OLS (BENARD&apos;S MEDIAN RANKS).&nbsp;
        k&lt;1 = DECREASING HAZARD · k=1 = EXPONENTIAL BASELINE · k&gt;1 = INCREASING HAZARD
      </div>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[10px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.amberFaint}` }}>
              {['CATEGORY', 'N', 'k̂ (SHAPE)', 'λ̂ (MO)', 'E[T]', 'P(12MO)', 'P(18MO)', 'P(36MO)', 'HAZARD REGIME'].map(h => (
                <th key={h} className="text-left pb-2 pr-4 font-normal" style={{ color: T.amberFaint }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const meta = HAZARD_META[f.hazardShape]
              const isOverall = i === 0
              return (
                <tr
                  key={f.key}
                  style={{
                    borderBottom: `1px solid ${T.amberGhost}`,
                    background: isOverall ? T.amberGhost : 'transparent',
                  }}
                >
                  <td className="py-2 pr-4" style={{ color: isOverall ? T.amber : T.amberDim }}>
                    {f.displayName}
                  </td>
                  <td className="py-2 pr-4 tabular-nums" style={{ color: T.amberDim }}>{f.n}</td>
                  <td className="py-2 pr-4 tabular-nums font-bold" style={{ color: T.amber }}>{f.k}</td>
                  <td className="py-2 pr-4 tabular-nums" style={{ color: T.amberDim }}>{f.lambda}</td>
                  <td className="py-2 pr-4 tabular-nums" style={{ color: T.amberDim }}>{f.meanMonths}mo</td>
                  <td className="py-2 pr-4 tabular-nums" style={{ color: T.amberDim }}>{(f.p12mo * 100).toFixed(0)}%</td>
                  <td className="py-2 pr-4 tabular-nums font-bold" style={{ color: T.amber }}>{(f.p18mo * 100).toFixed(0)}%</td>
                  <td className="py-2 pr-4 tabular-nums" style={{ color: T.amberDim }}>{(f.p36mo * 100).toFixed(0)}%</td>
                  <td className="py-2 text-left font-bold" style={{ color: meta.color }}>{meta.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 font-mono text-[9px] space-y-1" style={{ color: T.amberFaint }}>
        <p>k̂ = MLE SHAPE PARAMETER · λ̂ = SCALE (CHARACTERISTIC LIFETIME) · E[T] = λ·Γ(1+1/k)</p>
        <p>P(18MO) = exp(-(18/λ)^k) — PROBABILITY OF SURVIVING 18 MONTHS FROM FIRST SIGNAL</p>
        <p>⚠&nbsp;PARAMETER RELIABILITY INCREASES WITH N — CATEGORIES WITH N&lt;10 SHOULD BE INTERPRETED DIRECTIONALLY</p>
      </div>
    </div>
  )
}

// ─── Hazard shape bar chart ───────────────────────────────────────────────────

function HazardShapeChart({ fits }: { fits: WeibullFitResult[] }) {
  const data = computeHazardData(fits)

  return (
    <div>
      <div className="mb-3 font-mono text-[10px]" style={{ color: T.amberDim }}>
        <span style={{ color: T.amber }}>h(t) SHAPE</span> — WEIBULL k̂ BY CATEGORY.
        k̂ ENCODES WHETHER INSTANTANEOUS FAILURE RATE IS DECREASING, CONSTANT, OR INCREASING WITH AGE.
        REFERENCE: k=1 (EXPONENTIAL / MEMORYLESS BASELINE).
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32 + 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, bottom: 4, left: 90 }}>
          <CartesianGrid horizontal={false} stroke={T.grid} strokeDasharray="2 4" />
          <XAxis
            type="number"
            domain={[0, Math.max(2, Math.max(...data.map(d => d.k)) + 0.3)]}
            tick={{ fill: T.amberDim, fontSize: 9, fontFamily: 'monospace' }}
            tickFormatter={v => v.toFixed(1)}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fill: T.amberDim, fontSize: 9, fontFamily: 'monospace' }}
            width={90}
            tickFormatter={v => v.toString().toUpperCase()}
          />
          <ReferenceLine x={1} stroke={T.amberDim} strokeDasharray="4 2"
            label={{ value: 'k=1', fill: T.amberDim, fontSize: 8, fontFamily: 'monospace', position: 'insideTopRight' }} />
          <Tooltip
            formatter={(val: number) => [`k̂ = ${val.toFixed(3)}`, '']}
            contentStyle={{ background: T.bgCard, border: `1px solid ${T.amberFaint}`, fontFamily: 'monospace', fontSize: 10 }}
            labelStyle={{ color: T.amber }}
            cursor={{ fill: T.amberGhost }}
          />
          <Bar dataKey="k" radius={[0, 2, 2, 0]}>
            {data.map(d => (
              <Cell
                key={d.key}
                fill={d.hazardShape === 'decreasing' ? T.red : d.hazardShape === 'increasing' ? T.green : T.yellow}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[9px]">
        {Object.entries(HAZARD_META).map(([key, m]) => (
          <div key={key} style={{ border: `1px solid ${T.amberFaint}`, background: T.amberGhost }}
            className="p-2">
            <div className="font-bold mb-0.5" style={{ color: m.color }}>{m.label}</div>
            <div style={{ color: T.amberFaint }}>{m.tip}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 font-mono text-[9px]" style={{ color: T.amberFaint }}>
        h(t) = (k/λ)·(t/λ)^(k-1) — INSTANTANEOUS FAILURE RATE AT AGE t.
        FOR PORTFOLIO DUE DILIGENCE: A PRODUCT IN A k&lt;1 CATEGORY FACES HIGHEST RISK IN YEAR 1-2.
        IN A k&gt;1 CATEGORY, RISK COMPOUNDS AS THE MARKET MATURES.
      </div>
    </div>
  )
}

// ─── Main panel export ────────────────────────────────────────────────────────

export function SurvivalModelPanel({ data }: { data: SurvivalModelData }) {
  const [tab, setTab] = useState<Tab>('km')

  const TABS: { id: Tab; label: string; fkey: string }[] = [
    { id: 'km', label: 'SURVIVAL CURVES', fkey: 'F1' },
    { id: 'weibull', label: 'WEIBULL PARAMS', fkey: 'F2' },
    { id: 'hazard', label: 'HAZARD SHAPE', fkey: 'F3' },
  ]

  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, fontFamily: 'monospace' }}
      className="rounded-sm overflow-hidden">

      {/* Bloomberg-style header bar */}
      <div style={{ background: T.bgCard, borderBottom: `1px solid ${T.border}` }}
        className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold tracking-widest" style={{ color: T.amber }}>
            SURVIVAL ANALYTICS
          </div>
          <div className="text-[9px]" style={{ color: T.amberDim }}>
            KAPLAN-MEIER · WEIBULL MLE
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px]" style={{ color: T.amberDim }}>
          <span>CORPUS: PROD_FAILURES</span>
          <span style={{ color: T.amber, fontWeight: 'bold' }}>N={data.sampleSize}</span>
          <span>COND. ON DOCUMENTED FAILURES</span>
        </div>
      </div>

      {/* Fake terminal prompt line */}
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.amberGhost}`, color: T.amberFaint }}
        className="px-4 py-1.5 text-[9px]">
        <span style={{ color: T.amberDim }}>$</span>{' '}
        survival.fit(data=products[status==&apos;dead&apos;], estimator=&apos;km&apos;, dist=&apos;weibull&apos;, n={data.sampleSize})
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${T.border}` }} className="flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-[10px] tracking-wider transition-colors',
              tab === t.id
                ? 'font-bold'
                : 'hover:opacity-80'
            )}
            style={{
              color: tab === t.id ? T.amber : T.amberDim,
              background: tab === t.id ? T.amberGhost : T.bg,
              borderRight: `1px solid ${T.border}`,
              borderBottom: tab === t.id ? `2px solid ${T.amber}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <span style={{ color: tab === t.id ? T.amberDim : '#2a1f00' }}
              className="mr-1.5">[{t.fkey}]</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {tab === 'km' && <KMCurvesChart data={data} />}
        {tab === 'weibull' && <WeibullParameterTable fits={data.weibullFits} overall={data.overallWeibull} />}
        {tab === 'hazard' && <HazardShapeChart fits={data.weibullFits} />}
      </div>
    </div>
  )
}
