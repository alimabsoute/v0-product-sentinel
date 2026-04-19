import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ExternalLink,
  Bookmark,
  Share2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Users,
  DollarSign,
  Globe,
  Zap,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { SignalHistoryChart } from '@/components/signal-history-chart'
import { CommentSection } from '@/components/comment-section'
import { UpvoteButton } from '@/components/upvote-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Product } from '@/lib/mock-data'
import { getProductBySlug, getRelatedProducts } from '@/lib/db/products'
import { getPressMentionsForProduct } from '@/lib/db/news'
import { getProductRelationships } from '@/lib/db/relationships'
import { getProductComments, getProductCommentCount } from '@/lib/db/comments'
import { supabaseAdmin } from '@/lib/supabase-server'
import { cn } from '@/lib/utils'

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found | Prism' }
  return {
    title: `${product.name} — ${product.category} | Prism`,
    description: product.description || product.tagline,
    openGraph: {
      title: product.name,
      description: product.description || product.tagline,
      images: product.logo ? [{ url: product.logo, width: 400, height: 400 }] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Related products (checks product_alternatives first, falls back to same category)
  const competitors = await getRelatedProducts(
    product.id,
    product.category,
    4,
  )

  // Real press mentions for this product
  const relatedNews = await getPressMentionsForProduct(product.id, 4)

  // Product relationships (product_relationships + product_alternatives)
  const relationships = await getProductRelationships(product.id)

  // Comments
  const [comments, commentCount] = await Promise.all([
    getProductComments(product.id),
    getProductCommentCount(product.id),
  ])

  const { data: productTagRows } = await supabaseAdmin
    .from('product_tags')
    .select('tags!inner(slug, tag_group)')
    .eq('product_id', product.id)

  // Signal history for the chart
  const { data: signalHistory } = await supabaseAdmin
    .from('product_signal_scores')
    .select('score_date, signal_score, mention_score, sentiment_score, velocity_score, press_score, funding_score')
    .eq('product_id', product.id)
    .order('score_date', { ascending: true })

  const chartData = (signalHistory ?? []).map((row: {
    score_date: string
    signal_score: number | null
    mention_score: number | null
    sentiment_score: number | null
    velocity_score: number | null
    press_score: number | null
    funding_score: number | null
  }) => ({
    score_date: row.score_date,
    score: row.signal_score ?? 0,
    mention_score: row.mention_score,
    sentiment_score: row.sentiment_score,
    velocity_score: row.velocity_score,
    press_score: row.press_score,
    funding_score: row.funding_score,
  }))

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/products" 
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Link>
        </nav>

        {/* Product Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={product.logo}
              alt={product.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl font-bold">{product.name}</h1>
                {product.badges.includes('verified') && (
                  <Badge variant="secondary">Verified</Badge>
                )}
                {product.status === 'dead' && (
                  <Badge className="bg-[var(--sentinel-dead)]">Sunset</Badge>
                )}
              </div>
              <p className="mt-1 text-lg text-muted-foreground">{product.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{product.category}</Badge>
                {product.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UpvoteButton productId={product.id} />
            <Button variant="outline" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button asChild>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Media Gallery */}
            {(product.videoUrl || product.screenshots.length > 0) && (
              <MediaGallery product={product} />
            )}

            {/* Description */}
            <section>
              <h2 className="font-serif text-xl font-semibold mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </section>

            {/* Characteristics */}
            <section>
              <h2 className="font-serif text-xl font-semibold mb-4">Product Details</h2>
              <ProductCharacteristics product={product} />
            </section>

            {/* Attributes — tag pills from product_tags */}
            {(productTagRows?.length ?? 0) > 0 && (() => {
              type TagRow = { tags: { slug: string; tag_group: string } }
              const grouped: Record<string, string[]> = {}
              for (const row of (productTagRows as TagRow[])) {
                const { slug, tag_group } = row.tags
                if (!grouped[tag_group]) grouped[tag_group] = []
                grouped[tag_group].push(slug)
              }
              const GL: Record<string, string> = {
                audience: 'Audience',
                capability: 'Capabilities',
                business_model: 'Business Models',
                pricing_model: 'Pricing',
                deployment: 'Deployment',
                data_format: 'Data Formats',
                compliance: 'Compliance',
                integration: 'Integrations',
              }
              const gl = (g: string) =>
                GL[g] ?? g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              return (
                <section>
                  <h2 className="font-serif text-xl font-semibold mb-4">Attributes</h2>
                  <div className="space-y-3">
                    {Object.entries(grouped).map(([group, tags]) => (
                      <div key={group} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground w-28 shrink-0">
                          {gl(group)}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <Link key={tag} href={`/products?tags=${tag}`}>
                              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs">
                                {tag.replace(/-/g, ' ')}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Competitors from DB */}
            {competitors.length > 0 && (
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4">Alternatives &amp; Competitors</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {competitors.map(competitor => (
                    <ProductCard key={competitor.id} product={competitor} variant="compact" />
                  ))}
                </div>
              </section>
            )}

            {/* Structured relationships (product_relationships + product_alternatives) */}
            {relationships.length > 0 && (
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4">Related &amp; Alternatives</h2>
                <div className="space-y-3">
                  {relationships.map((rel) => (
                    <Link
                      key={rel.product.id}
                      href={`/products/${rel.product.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-card"
                    >
                      {rel.product.logo_url ? (
                        <img
                          src={rel.product.logo_url}
                          alt={rel.product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                          {rel.product.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{rel.product.name}</p>
                        <p className="text-xs text-muted-foreground">{rel.product.category}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {rel.type}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related News */}
            {relatedNews.length > 0 && (
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4">In the News</h2>
                <div className="space-y-3">
                  {relatedNews.map(news => (
                    <a
                      key={news.id}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/30 hover:bg-card"
                    >
                      <h3 className="font-medium">{news.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {news.source ?? 'Unknown'} • {news.published_at ? formatRelativeTime(news.published_at) : ''}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}
            {/* Comments */}
            <CommentSection
              productId={product.id}
              initialComments={comments}
              initialCount={commentCount}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Signal History Chart */}
            <SignalHistoryChart data={chartData} />

            {/* Buzz Score Card */}
            <BuzzScoreCard product={product} />

            {/* Quick Info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium mb-4">Quick Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Launched
                  </dt>
                  <dd>{new Date(product.launchDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Updated
                  </dt>
                  <dd>{formatRelativeTime(product.lastUpdated)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Saves
                  </dt>
                  <dd>{product.saves.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Views
                  </dt>
                  <dd>{product.views.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            {/* Badges */}
            {product.badges.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium mb-3">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {product.badges.map(badge => (
                    <BadgeDisplay key={badge} badge={badge} />
                  ))}
                </div>
              </div>
            )}

            {/* Status Info (for dead products) */}
            {product.status === 'dead' && product.statusReason && (
              <div className="rounded-xl border border-[var(--sentinel-dead)] bg-[var(--sentinel-dead)]/10 p-4">
                <h3 className="font-medium flex items-center gap-2 text-[var(--sentinel-dead)]">
                  <XCircle className="h-4 w-4" />
                  Discontinued
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.statusReason}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function MediaGallery({ product }: { product: Product }) {
  const hasVideo = !!product.videoUrl
  const hasScreenshots = product.screenshots.length > 0

  if (!hasVideo && !hasScreenshots) return null

  return (
    <div className="space-y-4">
      {/* Main Media */}
      <div className="aspect-video overflow-hidden rounded-xl bg-muted">
        {hasVideo ? (
          <iframe
            src={product.videoUrl}
            className="h-full w-full"
            allowFullScreen
            title={`${product.name} video`}
          />
        ) : (
          <img
            src={product.screenshots[0]}
            alt={`${product.name} screenshot`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {hasScreenshots && product.screenshots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {product.screenshots.map((screenshot, index) => (
            <button
              key={index}
              className="flex-shrink-0 aspect-video w-24 overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-colors"
            >
              <img
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCharacteristics({ product }: { product: Product }) {
  const { characteristics } = product

  const items = [
    {
      icon: DollarSign,
      label: 'Pricing',
      value: characteristics.pricing.charAt(0).toUpperCase() + characteristics.pricing.slice(1),
      detail: characteristics.pricingDetails,
    },
    {
      icon: Globe,
      label: 'Platforms',
      value: characteristics.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', '),
    },
    {
      icon: Users,
      label: 'Team Size',
      value: characteristics.teamSize,
    },
    {
      icon: Zap,
      label: 'Funding',
      value: characteristics.funding.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    },
    {
      icon: Calendar,
      label: 'Founded',
      value: characteristics.founded.toString(),
    },
  ]

  const features = [
    { label: 'Open Source', enabled: characteristics.openSource },
    { label: 'Has API', enabled: characteristics.hasAPI },
    { label: 'AI Powered', enabled: characteristics.aiPowered },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <div key={item.label} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </div>
            <p className="mt-1 font-medium">{item.value}</p>
            {item.detail && (
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {features.map(feature => (
          <Badge
            key={feature.label}
            variant={feature.enabled ? 'default' : 'outline'}
            className={cn(!feature.enabled && 'opacity-50')}
          >
            {feature.enabled ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {feature.label}
          </Badge>
        ))}
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Target Audience</p>
        <div className="flex flex-wrap gap-1.5">
          {characteristics.targetAudience.map(audience => (
            <Badge key={audience} variant="secondary" className="text-xs">
              {audience.charAt(0).toUpperCase() + audience.slice(1)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

function BuzzScoreCard({ product }: { product: Product }) {
  const { buzz } = product
  const TrendIcon = buzz.trend === 'rising' 
    ? TrendingUp 
    : buzz.trend === 'falling' 
    ? TrendingDown 
    : Minus

  const trendColor = buzz.trend === 'rising'
    ? 'text-[var(--sentinel-rising)]'
    : buzz.trend === 'falling'
    ? 'text-[var(--sentinel-falling)]'
    : 'text-muted-foreground'

  const maxVal = Math.max(...buzz.sparkline)
  const normalized = buzz.sparkline.map(v => (v / maxVal) * 100)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Buzz Score</h3>
        <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          {buzz.weeklyChange > 0 ? '+' : ''}{buzz.weeklyChange}%
        </div>
      </div>

      {/* Score */}
      <div className="text-center mb-4">
        <p className="text-4xl font-bold tabular-nums">{buzz.score}</p>
        <p className="text-sm text-muted-foreground">mentions this week</p>
      </div>

      {/* Sparkline */}
      <div className="flex items-end justify-center gap-1 h-12 mb-4">
        {normalized.map((height, i) => (
          <div
            key={i}
            className={cn(
              "w-4 rounded-t transition-all",
              i === normalized.length - 1 ? "bg-primary" : "bg-primary/40"
            )}
            style={{ height: `${Math.max(10, height)}%` }}
          />
        ))}
      </div>

      {/* Source breakdown */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">By Source</p>
        {[
          { label: 'Twitter', value: buzz.sources.twitter, color: 'bg-[var(--buzz-twitter)]' },
          { label: 'Reddit', value: buzz.sources.reddit, color: 'bg-[var(--buzz-reddit)]' },
          { label: 'Hacker News', value: buzz.sources.hackerNews, color: 'bg-[var(--buzz-hackernews)]' },
          { label: 'News', value: buzz.sources.news, color: 'bg-[var(--buzz-news)]' },
        ].map(source => {
          const percentage = (source.value / buzz.score) * 100
          return (
            <div key={source.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">{source.label}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", source.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-8 text-right">{source.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BadgeDisplay({ badge }: { badge: string }) {
  const badgeInfo: Record<string, { label: string; description: string }> = {
    'verified': { label: 'Verified', description: 'This product has been claimed and verified by its creator' },
    'responsive-founder': { label: 'Responsive Founder', description: 'Founder actively responds to questions and feedback' },
    'transparent-pricing': { label: 'Transparent Pricing', description: 'Clear, upfront pricing with no hidden fees' },
    'active-development': { label: 'Active Development', description: 'Regular updates and new features being shipped' },
    'open-source': { label: 'Open Source', description: 'Source code is publicly available' },
  }

  const info = badgeInfo[badge] || { label: badge, description: '' }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            <CheckCircle className="mr-1 h-3 w-3" />
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
