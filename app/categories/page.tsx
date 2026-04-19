export const revalidate = 3600

import Link from 'next/link'
import {
  Sparkles,
  Code2,
  CheckSquare,
  Palette,
  Megaphone,
  BarChart3,
  DollarSign,
  MessageSquare,
  Shield,
  GraduationCap,
  Heart,
  ShoppingCart,
  Gamepad2,
  Cpu,
  Play,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { supabaseAdmin } from '@/lib/supabase-server'

export const metadata = { title: 'Categories | Prism' }

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'ai-tools':      Sparkles,
  'dev-tools':     Code2,
  'productivity':  CheckSquare,
  'design':        Palette,
  'marketing':     Megaphone,
  'analytics':     BarChart3,
  'finance':       DollarSign,
  'communication': MessageSquare,
  'security':      Shield,
  'education':     GraduationCap,
  'health':        Heart,
  'e-commerce':    ShoppingCart,
  'gaming':        Gamepad2,
  'hardware':      Cpu,
  'entertainment': Play,
}

// Stable icon colour per category (bg / text pair)
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'ai-tools':      { bg: 'bg-violet-500/10',  text: 'text-violet-500' },
  'dev-tools':     { bg: 'bg-blue-500/10',    text: 'text-blue-500' },
  'productivity':  { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  'design':        { bg: 'bg-pink-500/10',    text: 'text-pink-500' },
  'marketing':     { bg: 'bg-orange-500/10',  text: 'text-orange-500' },
  'analytics':     { bg: 'bg-cyan-500/10',    text: 'text-cyan-500' },
  'finance':       { bg: 'bg-green-500/10',   text: 'text-green-500' },
  'communication': { bg: 'bg-sky-500/10',     text: 'text-sky-500' },
  'security':      { bg: 'bg-red-500/10',     text: 'text-red-500' },
  'education':     { bg: 'bg-amber-500/10',   text: 'text-amber-500' },
  'health':        { bg: 'bg-rose-500/10',    text: 'text-rose-500' },
  'e-commerce':    { bg: 'bg-teal-500/10',    text: 'text-teal-500' },
  'gaming':        { bg: 'bg-purple-500/10',  text: 'text-purple-500' },
  'hardware':      { bg: 'bg-slate-500/10',   text: 'text-slate-500' },
  'entertainment': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500' },
}

function displayName(slug: string): string {
  const MAP: Record<string, string> = {
    'ai-tools':      'AI Tools',
    'dev-tools':     'Developer Tools',
    'productivity':  'Productivity',
    'design':        'Design',
    'marketing':     'Marketing',
    'analytics':     'Analytics',
    'finance':       'Finance',
    'communication': 'Communication',
    'security':      'Security',
    'hardware':      'Hardware',
    'entertainment': 'Entertainment',
    'education':     'Education',
    'health':        'Health',
    'e-commerce':    'E-commerce',
    'gaming':        'Gaming',
  }
  return MAP[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Data fetching ────────────────────────────────────────────────────────────

type CategoryRow = { category: string; cnt: number; logos: string[] }

async function getCategoryData(): Promise<CategoryRow[]> {
  const [countRes, logoRes] = await Promise.all([
    // A) Count per category
    supabaseAdmin
      .from('products')
      .select('category')
      .eq('status', 'active'),

    // B) Logo pool — 100 active products with logos across all categories
    supabaseAdmin
      .from('products')
      .select('category, logo_url')
      .eq('status', 'active')
      .not('logo_url', 'is', null)
      .limit(300),
  ])

  // Count in JS
  const countMap: Record<string, number> = {}
  for (const row of (countRes.data ?? []) as { category: string }[]) {
    countMap[row.category] = (countMap[row.category] ?? 0) + 1
  }

  // Group logos by category, take first 3
  const logoMap: Record<string, string[]> = {}
  for (const row of (logoRes.data ?? []) as { category: string; logo_url: string }[]) {
    const cat = row.category
    const url = row.logo_url
    if (!logoMap[cat]) logoMap[cat] = []
    if (logoMap[cat].length < 3) logoMap[cat].push(url)
  }

  return Object.entries(countMap)
    .map(([category, cnt]) => ({ category, cnt, logos: logoMap[category] ?? [] }))
    .sort((a, b) => b.cnt - a.cnt)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoriesPage() {
  const categories = await getCategoryData()

  const totalProducts = categories.reduce((sum, c) => sum + c.cnt, 0)
  const totalCategories = categories.length

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Browse by Category
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalProducts.toLocaleString()}+ products across {totalCategories} categories
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map(({ category, cnt, logos }) => {
            const Icon = CATEGORY_ICONS[category] ?? Sparkles
            const colors = CATEGORY_COLORS[category] ?? { bg: 'bg-primary/10', text: 'text-primary' }

            return (
              <Link
                key={category}
                href={`/categories/${category}`}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
                </div>

                {/* Name + count */}
                <div className="flex-1">
                  <div className="font-semibold text-sm leading-snug">{displayName(category)}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {cnt.toLocaleString()} products
                  </div>
                </div>

                {/* Logo stack */}
                {logos.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {logos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full border border-background bg-muted object-cover"
                      />
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
