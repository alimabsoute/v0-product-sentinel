import Link from 'next/link'
import { TrendingUp, Minus, ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-server'
import { cn } from '@/lib/utils'

type CategoryStat = {
  category: string
  count: number
}

async function getCategoryStats(): Promise<CategoryStat[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('status', 'active')

  if (error || !data) return []

  const counts: Record<string, number> = {}
  for (const row of data as unknown as { category: string }[]) {
    counts[row.category] = (counts[row.category] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function displayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function MarketPulse() {
  const stats = await getCategoryStats()

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold">Market Pulse</h2>
        <Link
          href="/categories"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {stats.slice(0, 6).map((stat) => (
          <Link
            key={stat.category}
            href={`/categories/${stat.category}`}
            className="group flex items-center justify-between rounded-xl p-2.5 -mx-2.5 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {displayName(stat.category)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {stat.count} {stat.count === 1 ? 'product' : 'products'}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
        ))}

        {stats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
        )}
      </div>
    </div>
  )
}

// Compact version for sidebars
export async function MarketPulseCompact() {
  const stats = await getCategoryStats()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
      <div className="space-y-1">
        {stats.slice(0, 5).map((stat) => (
          <Link
            key={stat.category}
            href={`/categories/${stat.category}`}
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span>{displayName(stat.category)}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Minus className="h-3 w-3" />
              {stat.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
