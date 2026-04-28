'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import type {
  CategoryDistributionItem,
  SignalDistributionItem,
  VelocityLeader,
  NewProductRateItem,
  CategoryGrowthItem,
  SurvivalRateItem,
  MarketStats,
  CohortShareItem,
} from '@/lib/db/analytics'

// ─── Palette ─────────────────────────────────────────────────────────────────

const LINE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#9333ea', '#16a34a',
]

const PIE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#9333ea', '#16a34a', '#f97316', '#0d9488',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortMonth(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  } catch {
    return isoString
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-3xl font-mono font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  stats: MarketStats
  categoryDistribution: CategoryDistributionItem[]
  signalDistribution: SignalDistributionItem[]
  velocityLeaders: VelocityLeader[]
  newProductRate: NewProductRateItem[]
  categoryGrowth: CategoryGrowthItem[]
  survivalRates: SurvivalRateItem[]
  cohortShare: CohortShareItem[]
}

function pivotCohortData(data: CohortShareItem[]) {
  const byYear = new Map<number, Record<string, number>>()
  const tags = new Set<string>()
  for (const row of data) {
    if (!byYear.has(row.launched_year)) byYear.set(row.launched_year, { year: row.launched_year })
    byYear.get(row.launched_year)![row.tag_slug] = row.share_pct
    tags.add(row.tag_slug)
  }
  return {
    chartData: Array.from(byYear.values()).sort((a, b) => a.year - b.year),
    tags: Array.from(tags),
  }
}

// ─── Category Growth Line Chart Data ─────────────────────────────────────────

function buildLineData(
  categoryGrowth: CategoryGrowthItem[],
  topCategories: string[]
): { month: string; [key: string]: number | string }[] {
  // Collect all unique months
  const months = [...new Set(categoryGrowth.map(r => r.month))].sort()

  return months.map(month => {
    const entry: { month: string; [key: string]: number | string } = {
      month: shortMonth(month),
    }
    for (const cat of topCategories) {
      const row = categoryGrowth.find(r => r.month === month && r.category === cat)
      entry[cat] = row?.count ?? 0
    }
    return entry
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────

type DateRange = '30d' | '90d' | '1y' | 'all'

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1 yr', value: '1y' },
  { label: 'All', value: 'all' },
]

export function MarketsClient({
  stats,
  categoryDistribution,
  signalDistribution,
  velocityLeaders,
  newProductRate,
  categoryGrowth,
  survivalRates,
  cohortShare,
}: Props) {
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const activePercent =
    stats.totalProducts > 0
      ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
      : 0

  // Filter growth data by selected date range (client-side)
  const filteredGrowth = useMemo(() => {
    if (dateRange === 'all') return categoryGrowth
    const cutoff = new Date()
    if (dateRange === '30d') cutoff.setDate(cutoff.getDate() - 30)
    else if (dateRange === '90d') cutoff.setDate(cutoff.getDate() - 90)
    else if (dateRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return categoryGrowth.filter(r => r.month >= cutoffStr)
  }, [categoryGrowth, dateRange])

  // Top 5 categories by product count for line chart
  const top5Categories = categoryDistribution.slice(0, 5).map(c => c.category)
  // When a pie slice is selected, show only that category's line
  const activeLineCategories = selectedCategory ? [selectedCategory] : top5Categories
  const lineData = buildLineData(filteredGrowth, activeLineCategories)

  // Pie chart data — top 10 categories
  const pieData = categoryDistribution.slice(0, 10)

  // Cohort chart — top 6 tags by total share
  const { chartData: cohortChartData, tags: allCohortTags } = pivotCohortData(cohortShare)
  const tagTotals = allCohortTags.map(tag => ({
    tag,
    total: cohortShare.filter(r => r.tag_slug === tag).reduce((s, r) => s + r.share_pct, 0),
  }))
  const top6Tags = tagTotals.sort((a, b) => b.total - a.total).slice(0, 6).map(t => t.tag)

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Period:</span>
        <div className="flex gap-1">
          {DATE_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                dateRange === opt.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-1.5 rounded border border-border bg-secondary/40 px-2.5 py-1 text-xs font-mono">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">
              {pieData.find(d => d.category === selectedCategory)?.display ?? selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="ml-1 text-muted-foreground hover:text-foreground leading-none"
              aria-label="Clear category filter"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={stats.totalProducts.toLocaleString()}
          sub="all time"
        />
        <StatCard
          label="Active"
          value={`${activePercent}%`}
          sub={`${stats.activeProducts.toLocaleString()} active`}
        />
        <StatCard
          label="Avg Signal Score"
          value={stats.avgSignalScore}
          sub="0–100 scale"
        />
        <StatCard
          label="Categories"
          value={stats.totalCategories}
          sub="distinct segments"
        />
      </div>

      {/* Row 2: Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Category Growth Line Chart (60%) */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Category Growth
            {selectedCategory && (
              <span className="ml-2 normal-case capitalize font-normal">
                — {pieData.find(d => d.category === selectedCategory)?.display ?? selectedCategory}
              </span>
            )}
          </h2>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) =>
                    value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  }
                />
                {top5Categories.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
              No growth data — run migration 0006 to populate category_monthly_launches view
            </div>
          )}
        </div>

        {/* Category Distribution Pie Chart (40%) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Category Distribution
          </h2>
          {pieData.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-muted-foreground">Click a slice to filter the growth chart.</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="display"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    onClick={(entry: { category: string }) => {
                      setSelectedCategory(prev =>
                        prev === entry.category ? null : entry.category
                      )
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={entry.category}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                        stroke={selectedCategory === entry.category ? '#fff' : 'none'}
                        strokeWidth={selectedCategory === entry.category ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {pieData.slice(0, 6).map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.display}</span>
                    </span>
                    <span className="font-mono tabular-nums">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Signal Distribution Bar + New Product Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Score Distribution Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Signal Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={signalDistribution} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Products']}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New Product Rate Cards */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            New Products Tracked
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {newProductRate.map(item => (
              <div
                key={item.period}
                className="rounded-lg bg-secondary/40 border border-border p-4 text-center"
              >
                <div className="text-2xl font-mono font-semibold tabular-nums">
                  {item.count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{item.period}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Products first indexed within the period. Based on ingestion date.
          </p>
        </div>
      </div>

      {/* Row 4: Velocity Leaders Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Velocity Leaders — Top 10 by Momentum
        </h2>
        {velocityLeaders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="pb-2 pr-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="pb-2 pr-4 font-mono text-xs text-muted-foreground uppercase tracking-wider text-right">Signal</th>
                  <th className="pb-2 font-mono text-xs text-muted-foreground uppercase tracking-wider text-right">Velocity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {velocityLeaders.map((leader, i) => {
                  const velocityColor =
                    leader.wow_velocity > 10
                      ? 'text-emerald-600'
                      : leader.wow_velocity > 0
                      ? 'text-emerald-500'
                      : 'text-muted-foreground'

                  return (
                    <tr key={leader.product_id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/products/${leader.slug}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          {leader.logo_url ? (
                            <img
                              src={leader.logo_url}
                              alt={leader.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
                              {leader.name[0]}
                            </span>
                          )}
                          <span className="font-medium">{leader.name}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-sm">
                        {leader.signal_score.toFixed(1)}
                      </td>
                      <td className={`py-2.5 text-right font-mono tabular-nums text-sm font-semibold ${velocityColor}`}>
                        {leader.wow_velocity > 0 ? '+' : ''}{leader.wow_velocity.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No velocity data yet — signal scores are computed nightly.
          </p>
        )}
      </div>

      {/* Row 5: Survival Rates by Launch Year */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-1">
          Cohort Survival by Launch Year
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Products still active vs. dead, grouped by the year they launched.
        </p>
        {survivalRates.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={survivalRates}
              margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="launched_year"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  name === 'survival_rate' ? `${value}%` : value.toLocaleString(),
                  name === 'survival_rate' ? 'Survival Rate' : name === 'alive' ? 'Active' : 'Total',
                ]}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) =>
                  value === 'survival_rate'
                    ? 'Survival Rate'
                    : value === 'alive'
                    ? 'Active'
                    : 'Total'
                }
              />
              <Bar dataKey="survival_rate" name="survival_rate" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            No cohort data available — products need launched_year set.
          </p>
        )}
      </div>

      {/* Row 6: Capability Adoption by Launch Year */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-1">
          Capability Adoption by Launch Year
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Share of products launched each year featuring each capability tag (100% stacked).
        </p>
        {cohortChartData.length > 0 && top6Tags.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={cohortChartData}
              stackOffset="expand"
              margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  `${(value * 100).toFixed(1)}%`,
                  name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                ]}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) =>
                  value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                }
              />
              {top6Tags.map((tag, i) => (
                <Area
                  key={tag}
                  type="monotone"
                  dataKey={tag}
                  stackId="1"
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  fill={LINE_COLORS[i % LINE_COLORS.length]}
                  fillOpacity={0.75}
                  strokeWidth={1}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            No capability cohort data — create the attribute_cohort_share view in Supabase.
          </p>
        )}
      </div>
    </div>
  )
}
