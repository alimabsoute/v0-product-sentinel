'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Zap } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type CompareProduct = {
  id: string
  slug: string
  name: string
  tagline: string
  logo: string
  category: string
  tags: string[]
  status: string
  launchDate: string
  buzz: {
    score: number
    trend: 'rising' | 'falling' | 'stable'
    weeklyChange: number
  }
  signalHistory: { date: string; score: number }[]
}

type SearchResult = {
  id: string
  slug: string
  name: string
  tagline: string
  logo: string
  category: string
}

interface CompareClientProps {
  initialProductA: CompareProduct | null
  initialProductB: CompareProduct | null
}

// ─── Product Search Input ─────────────────────────────────────────────────────

interface ProductSearchProps {
  label: string
  value: CompareProduct | null
  onSelect: (p: CompareProduct) => void
  onClear: () => void
  accentColor: string
}

function ProductSearch({ label, value, onSelect, onClear, accentColor }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=8&minimal=true`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.products ?? data ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (value) {
    return (
      <div
        className="rounded-xl border-2 p-4 flex items-center gap-3"
        style={{ borderColor: accentColor }}
      >
        <img src={value.logo} alt={value.name} className="h-12 w-12 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{value.name}</p>
          <p className="text-sm text-muted-foreground truncate">{value.tagline}</p>
        </div>
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={`Search ${label}...`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
      </div>
      {open && (query.length >= 2) && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center">No results</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
              onClick={() => {
                onSelect(r as CompareProduct)
                setQuery('')
                setOpen(false)
                setResults([])
              }}
            >
              <img src={r.logo} alt={r.name} className="h-8 w-8 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.tagline}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{r.category}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Comparison chart ─────────────────────────────────────────────────────────

function buildChartData(
  histA: { date: string; score: number }[],
  histB: { date: string; score: number }[],
  nameA: string,
  nameB: string,
) {
  const allDates = [
    ...new Set([...histA.map((h) => h.date), ...histB.map((h) => h.date)]),
  ].sort()

  const mapA = new Map(histA.map((h) => [h.date, h.score]))
  const mapB = new Map(histB.map((h) => [h.date, h.score]))

  return allDates.map((date) => ({
    date,
    [nameA]: mapA.get(date) ?? null,
    [nameB]: mapB.get(date) ?? null,
  }))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CompareClient({ initialProductA, initialProductB }: CompareClientProps) {
  const router = useRouter()
  const [productA, setProductA] = useState<CompareProduct | null>(initialProductA)
  const [productB, setProductB] = useState<CompareProduct | null>(initialProductB)
  const [verdictText, setVerdictText] = useState<string | null>(null)
  const [loadingVerdict, setLoadingVerdict] = useState(false)

  async function fetchVerdict() {
    if (!productA || !productB) return
    setLoadingVerdict(true)
    setVerdictText(null)
    try {
      const res = await fetch('/api/compare/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productA: {
            name: productA.name,
            tagline: productA.tagline,
            category: productA.category,
            tags: productA.tags,
            signal_score: productA.buzz.score,
          },
          productB: {
            name: productB.name,
            tagline: productB.tagline,
            category: productB.category,
            tags: productB.tags,
            signal_score: productB.buzz.score,
          },
        }),
      })
      const data = await res.json()
      setVerdictText(data.verdict ?? 'Unable to generate verdict.')
    } catch {
      setVerdictText('Unable to generate verdict.')
    } finally {
      setLoadingVerdict(false)
    }
  }

  const COLOR_A = '#6366f1' // indigo
  const COLOR_B = '#f59e0b' // amber

  function updateUrl(a: CompareProduct | null, b: CompareProduct | null) {
    const params = new URLSearchParams()
    if (a) params.set('a', a.slug)
    if (b) params.set('b', b.slug)
    router.replace(`/compare?${params.toString()}`, { scroll: false })
  }

  function handleSelectA(p: CompareProduct) {
    setProductA(p)
    updateUrl(p, productB)
  }
  function handleSelectB(p: CompareProduct) {
    setProductB(p)
    updateUrl(productA, p)
  }
  function handleClearA() {
    setProductA(null)
    updateUrl(null, productB)
  }
  function handleClearB() {
    setProductB(null)
    updateUrl(productA, null)
  }

  const bothSelected = productA !== null && productB !== null

  const chartData = bothSelected
    ? buildChartData(
        productA.signalHistory ?? [],
        productB.signalHistory ?? [],
        productA.name,
        productB.name,
      )
    : []

  return (
    <div className="space-y-8">
      {/* Search row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Product A
          </p>
          <ProductSearch
            label="Product A"
            value={productA}
            onSelect={handleSelectA}
            onClear={handleClearA}
            accentColor={COLOR_A}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Product B
          </p>
          <ProductSearch
            label="Product B"
            value={productB}
            onSelect={handleSelectB}
            onClear={handleClearB}
            accentColor={COLOR_B}
          />
        </div>
      </div>

      {/* Comparison content */}
      {bothSelected && (
        <div className="space-y-6">
          {/* Row 1: Logos + names */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { p: productA, color: COLOR_A },
              { p: productB, color: COLOR_B },
            ].map(({ p, color }) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="rounded-xl border-2 bg-card p-5 flex items-center gap-4 hover:shadow-md transition-all"
                style={{ borderColor: color }}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-16 w-16 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-bold truncate">{p.name}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.tagline}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{p.category}</Badge>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 2: Signal score chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium mb-4">Signal Score History</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_A} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLOR_A} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_B} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLOR_B} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
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
                  <Tooltip
                    formatter={(v: number, name: string) => [Math.round(v * 10), name]}
                    labelFormatter={(l) => formatDate(String(l))}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey={productA.name}
                    stroke={COLOR_A}
                    strokeWidth={2}
                    fill="url(#gradA)"
                    dot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey={productB.name}
                    stroke={COLOR_B}
                    strokeWidth={2}
                    fill="url(#gradB)"
                    dot={false}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Row 3: Characteristics table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <h3 className="font-medium px-5 py-4 border-b border-border">Characteristics</h3>
            <div className="divide-y divide-border">
              {[
                { label: 'Category', a: productA.category, b: productB.category },
                { label: 'Status', a: productA.status, b: productB.status },
                {
                  label: 'Launched',
                  a: new Date(productA.launchDate).getFullYear().toString(),
                  b: new Date(productB.launchDate).getFullYear().toString(),
                },
                {
                  label: 'Signal Score',
                  a: String(productA.buzz.score),
                  b: String(productB.buzz.score),
                },
                {
                  label: 'Weekly Change',
                  a: `${productA.buzz.weeklyChange > 0 ? '+' : ''}${productA.buzz.weeklyChange}%`,
                  b: `${productB.buzz.weeklyChange > 0 ? '+' : ''}${productB.buzz.weeklyChange}%`,
                },
              ].map(({ label, a, b }) => (
                <div key={label} className="grid grid-cols-3 text-sm px-5 py-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className="font-medium text-center"
                    style={{ color: COLOR_A }}
                  >
                    {a}
                  </span>
                  <span
                    className="font-medium text-center"
                    style={{ color: COLOR_B }}
                  >
                    {b}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Tags diff */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-medium mb-4">Tags</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: COLOR_A }}>
                  Unique to {productA.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {productA.tags
                    .filter((t) => !productB.tags.includes(t))
                    .map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs" style={{ borderColor: COLOR_A }}>
                        {t}
                      </Badge>
                    ))}
                  {productA.tags.filter((t) => !productB.tags.includes(t)).length === 0 && (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">Shared</p>
                <div className="flex flex-wrap gap-1.5">
                  {productA.tags
                    .filter((t) => productB.tags.includes(t))
                    .map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  {productA.tags.filter((t) => productB.tags.includes(t)).length === 0 && (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: COLOR_B }}>
                  Unique to {productB.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {productB.tags
                    .filter((t) => !productA.tags.includes(t))
                    .map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs" style={{ borderColor: COLOR_B }}>
                        {t}
                      </Badge>
                    ))}
                  {productB.tags.filter((t) => !productA.tags.includes(t)).length === 0 && (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: AI Verdict */}
          <div className="flex flex-col gap-4">
            <Button
              onClick={fetchVerdict}
              disabled={loadingVerdict}
              className={cn('self-start')}
            >
              {loadingVerdict ? 'Generating verdict...' : 'Get AI Verdict'}
            </Button>
            {verdictText && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI Verdict</h3>
                  <Badge variant="outline" className="text-xs">Claude Sonnet 4.6</Badge>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {verdictText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompt when only one or neither is selected */}
      {!bothSelected && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          <p className="font-medium">
            {productA || productB
              ? 'Select the second product to start comparing'
              : 'Search for two products to compare'}
          </p>
        </div>
      )}
    </div>
  )
}
