'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SignalDataPoint {
  score_date: string
  score: number
  mention_score: number | null
  sentiment_score: number | null
  velocity_score: number | null
  press_score: number | null
  funding_score: number | null
}

interface SignalHistoryChartProps {
  data: SignalDataPoint[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TooltipPayloadItem {
  value: number
  name: string
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const main = payload[0]
  const sub = payload.slice(1)

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2">{label ? formatDate(label) : ''}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Signal Score</span>
          <span className="font-medium tabular-nums">{Math.round((main?.value ?? 0) * 10)}</span>
        </div>
        {sub.map((item) => (
          <div key={item.name} className="flex justify-between gap-4">
            <span className="text-muted-foreground capitalize">{item.name.replace('_score', '')}</span>
            <span className="tabular-nums">{Math.round((item.value ?? 0) * 10)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SignalHistoryChart({ data }: SignalHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-medium mb-3">Signal History</h3>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No signal history yet
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium mb-4">Signal History</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="score_date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => String(Math.round(v * 10))}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
          <Area
            type="monotone"
            dataKey="mention_score"
            stroke="hsl(var(--sentinel-rising))"
            strokeWidth={1}
            fill="none"
            dot={false}
            strokeDasharray="3 3"
          />
          <Area
            type="monotone"
            dataKey="press_score"
            stroke="hsl(var(--sentinel-stable))"
            strokeWidth={1}
            fill="none"
            dot={false}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-primary/60" />
          Overall
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-px w-4 border-t-2 border-dashed border-[var(--sentinel-rising)]" />
          Mentions
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-px w-4 border-t-2 border-dashed border-[var(--sentinel-stable)]" />
          Press
        </span>
      </div>
    </div>
  )
}
