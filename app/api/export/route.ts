import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { searchProducts } from '@/lib/db/products'
import { exportRateLimit } from '@/lib/rate-limit'
import type { SortOption } from '@/lib/db/products'

const MAX_ANON_ROWS = 500
const MAX_AUTH_ROWS = 5000

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Escape a CSV field value per RFC 4180.
 * Wraps in quotes and doubles any internal quote characters.
 */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * GET /api/export?format=csv|json&q=...&category=...&limit=500
 *
 * Anonymous:     max 500 rows, format=json only
 * Authenticated: max 5000 rows, csv or json
 * Rate limits:   10 exports/hour anonymous, 50/hour authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const isAuthenticated = session !== null
    const rateLimitKey = isAuthenticated ? session!.user.id : getClientIp(request)
    const rateLimitResult = exportRateLimit(rateLimitKey, isAuthenticated)

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded the export rate limit. Try again in ${resetIn} minute(s).`,
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    const { searchParams } = request.nextUrl
    const format = searchParams.get('format') || 'json'
    const q = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const sort = (searchParams.get('sort') as SortOption) || 'newest'
    const requestedLimit = parseInt(searchParams.get('limit') || '500', 10)

    // Enforce per-tier row limits
    const maxRows = isAuthenticated ? MAX_AUTH_ROWS : MAX_ANON_ROWS
    const limit = Math.min(Math.max(1, requestedLimit), maxRows)

    // Anonymous users can only export JSON
    if (!isAuthenticated && format === 'csv') {
      return NextResponse.json(
        {
          error: 'CSV export requires authentication',
          message: 'Sign in to export data as CSV. Anonymous exports are limited to JSON format.',
        },
        { status: 401 },
      )
    }

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Use format=csv or format=json' },
        { status: 400 },
      )
    }

    // Fetch products — page size is the full limit (single-page export)
    const result = await searchProducts({ q, category, sort, page: 1, limit, status: 'active' })
    const { products } = result

    const exportedAt = new Date().toISOString()

    // ── JSON response ──────────────────────────────────────────────────────
    if (format === 'json') {
      const payload = products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        url: p.url,
        logo: p.logo,
        tags: p.tags,
        buzz_score: p.buzz.score,
        buzz_trend: p.buzz.trend,
        buzz_weekly_change: p.buzz.weeklyChange,
        launch_date: p.launchDate,
        status: p.status,
        characteristics: p.characteristics,
      }))

      return NextResponse.json(
        {
          products: payload,
          total: result.total,
          returned: products.length,
          exported_at: exportedAt,
          authenticated: isAuthenticated,
          filters: { q: q ?? null, category: category ?? null, sort, limit },
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="prism-products-${Date.now()}.json"`,
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        },
      )
    }

    // ── CSV response ───────────────────────────────────────────────────────
    const headers = [
      'id', 'name', 'slug', 'tagline', 'category', 'url', 'tags',
      'buzz_score', 'buzz_trend', 'buzz_weekly_change',
      'launch_date', 'status', 'pricing', 'ai_powered', 'open_source',
    ]

    const rows = [
      headers.join(','),
      ...products.map((p) =>
        [
          p.id,
          p.name,
          p.slug,
          p.tagline,
          p.category,
          p.url,
          p.tags.join(';'),
          p.buzz.score,
          p.buzz.trend,
          p.buzz.weeklyChange,
          p.launchDate,
          p.status,
          p.characteristics.pricing,
          p.characteristics.aiPowered ? 'yes' : 'no',
          p.characteristics.openSource ? 'yes' : 'no',
        ]
          .map(csvField)
          .join(','),
      ),
    ]

    const csvBody = rows.join('\r\n')

    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="prism-products-${Date.now()}.csv"`,
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      },
    })
  } catch (err) {
    console.error('/api/export error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
