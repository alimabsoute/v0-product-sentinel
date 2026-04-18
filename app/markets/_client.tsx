'use client'

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
} from 'recharts'
import type {
  CategoryDistributionItem,
  SignalDistributionItem,
  VelocityLeader,
  NewProductRateItem,
  CategoryGrowthItem,
  SurvivalRateItem,
  MarketStats,
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

export function MarketsClient({
  stats,
  categoryDistribution,
  signalDistribution,
  velocityLeaders,
  newProductRate,
  categoryGrowth,
  survivalRates,
}: Props) {
  const activePercent =
    stats.totalProducts > 0
      ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
      : 0

  // Top 5 categories by product count for line chart
  const top5Categories = categoryDistribution.slice(0, 5).map(c => c.category)
  const lineData = buildLineData(categoryGrowth, top5Categories)

  // Pie chart data — top 10 categories
  const pieData = categoryDistribution.slice(0, 10)

  return (
    <div className="space-y-6">
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
            Category Growth — Last 12 Months
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
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={entry.category}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
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
    </div>
  )
}
