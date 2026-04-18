"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/branding"

// ─── Code block with copy button ────────────────────────────────────────────

function CodeBlock({ code, language = "http" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-white/40 font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-sm text-white/85 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Endpoint section ────────────────────────────────────────────────────────

interface EndpointProps {
  method: string
  path: string
  description: string
  params: { name: string; type: string; required?: boolean; description: string }[]
  exampleRequest: string
  exampleResponse: string
  badge?: string
}

function Endpoint({ method, path, description, params, exampleRequest, exampleResponse, badge }: EndpointProps) {
  const methodColor =
    method === "GET"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : method === "POST"
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-start gap-4 px-6 py-5 border-b border-white/10">
        <span className={cn("shrink-0 rounded-md border px-2.5 py-1 text-xs font-mono font-semibold", methodColor)}>
          {method}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono text-white/90">{path}</code>
            {badge && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/50">{description}</p>
        </div>
      </div>

      {/* Parameters */}
      {params.length > 0 && (
        <div className="px-6 py-4 border-b border-white/10">
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Query Parameters</h4>
          <div className="space-y-2">
            {params.map((param) => (
              <div key={param.name} className="flex items-start gap-3 text-sm">
                <div className="shrink-0 flex items-center gap-2">
                  <code className="text-white/80 font-mono">{param.name}</code>
                  <span className="text-white/30 font-mono text-xs">{param.type}</span>
                  {param.required && (
                    <span className="text-red-400/80 text-xs">required</span>
                  )}
                </div>
                <span className="text-white/40 mt-0.5">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="px-6 py-5 grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Request</h4>
          <CodeBlock code={exampleRequest} language="http" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Response</h4>
          <CodeBlock code={exampleResponse} language="json" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-serif text-primary-foreground">{BRAND.initial}</span>
            </div>
            <span className="font-serif text-lg text-white">{BRAND.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Public Beta
            </Badge>
            <Button variant="outline" size="sm" asChild className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/10 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            API Status: Operational
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            {BRAND.name} API
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mb-6">
            Programmatic access to 7,800+ tracked tech products with real-time buzz scores,
            signal data, and category intelligence.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
              <span className="text-white/40 mr-2">Base URL</span>
              <code className="text-white/80 font-mono">https://prism.ai/api</code>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
              <span className="text-white/40 mr-2">Auth</span>
              <code className="text-white/80 font-mono">Cookie-based (sign in at /login)</code>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
              <span className="text-white/40 mr-2">Format</span>
              <code className="text-white/80 font-mono">JSON (CSV on exports)</code>
            </div>
          </div>
        </div>
      </div>

      {/* Rate limits callout */}
      <div className="px-6 py-6 border-b border-white/10 bg-yellow-500/5">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Rate Limits — Public Beta</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm text-white/60">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40 text-xs mb-1">Anonymous search</div>
              <div className="font-mono text-white/70">60 req / min</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40 text-xs mb-1">Authenticated search</div>
              <div className="font-mono text-white/70">200 req / min</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40 text-xs mb-1">Anonymous export</div>
              <div className="font-mono text-white/70">10 exports / hour</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40 text-xs mb-1">Authenticated export</div>
              <div className="font-mono text-white/70">50 exports / hour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="font-serif text-2xl text-white mb-6">Endpoints</h2>

          {/* Product Search */}
          <Endpoint
            method="GET"
            path="/api/products/search"
            description="Search and paginate through the full product catalog with full-text search, category filtering, and multiple sort options."
            params={[
              { name: "q", type: "string", description: "Full-text search query. Minimum 3 characters for full-text; shorter queries use ilike matching." },
              { name: "category", type: "string", description: "Filter by category slug (e.g., ai-tools, dev-tools, productivity). Case-insensitive." },
              { name: "sort", type: "string", description: "Sort order: newest (default), oldest, az, score (by signal score), trending (by velocity)." },
              { name: "page", type: "number", description: "Page number, 1-indexed. Default: 1." },
              { name: "limit", type: "number", description: "Results per page. Default: 50, max: 100." },
              { name: "status", type: "string", description: "Filter by status: active (default), dead, all." },
              { name: "minimal", type: "boolean", description: "Return lightweight response (id, slug, name, logo, category) for autocomplete use cases." },
            ]}
            exampleRequest={`GET /api/products/search?q=AI+writing&category=ai-tools&sort=score&page=1&limit=20`}
            exampleResponse={`{
  "products": [
    {
      "id": "uuid",
      "slug": "notion-ai",
      "name": "Notion AI",
      "tagline": "Write, edit, summarize, and translate",
      "category": "AI Tools",
      "tags": ["ai", "productivity", "writing"],
      "buzz": {
        "score": 842,
        "trend": "rising",
        "weeklyChange": 12.4,
        "sparkline": [600, 650, 700, 780, 800, 820, 842]
      },
      "status": "active"
    }
  ],
  "total": 1847,
  "page": 1,
  "totalPages": 93
}`}
          />

          {/* Export */}
          <Endpoint
            method="GET"
            path="/api/export"
            description="Bulk export products as JSON or CSV. Anonymous users get up to 500 rows in JSON format. Authenticated users get up to 5,000 rows with CSV support."
            badge="Auth optional"
            params={[
              { name: "format", type: "string", description: "Export format: json (default, available to all) or csv (requires authentication)." },
              { name: "q", type: "string", description: "Filter by search query before exporting." },
              { name: "category", type: "string", description: "Filter by category slug before exporting." },
              { name: "sort", type: "string", description: "Sort order for exported rows. Default: newest." },
              { name: "limit", type: "number", description: "Max rows to export. Anonymous: max 500. Authenticated: max 5,000." },
            ]}
            exampleRequest={`GET /api/export?format=csv&category=dev-tools&limit=1000`}
            exampleResponse={`{
  "products": [ ... ],
  "total": 892,
  "returned": 500,
  "exported_at": "2026-04-18T12:00:00Z",
  "authenticated": false,
  "filters": {
    "q": null,
    "category": "dev-tools",
    "sort": "newest",
    "limit": 500
  }
}

// CSV response (authenticated) includes:
// id, name, slug, tagline, category, url, tags,
// buzz_score, buzz_trend, buzz_weekly_change,
// launch_date, status, pricing, ai_powered, open_source`}
          />
        </div>
      </div>

      {/* Response codes */}
      <div className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl text-white mb-6">Response Codes</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            {[
              { code: "200", label: "OK", desc: "Request succeeded." },
              { code: "400", label: "Bad Request", desc: "Missing or invalid parameters." },
              { code: "401", label: "Unauthorized", desc: "Authentication required (CSV export or authenticated-only endpoint)." },
              { code: "429", label: "Too Many Requests", desc: "Rate limit exceeded. Check Retry-After header for reset time." },
              { code: "500", label: "Internal Server Error", desc: "Unexpected error. Please retry." },
            ].map((item, i) => (
              <div
                key={item.code}
                className={cn(
                  "flex items-start gap-4 px-6 py-4 text-sm",
                  i !== 0 && "border-t border-white/10"
                )}
              >
                <code className="shrink-0 w-12 font-mono text-white/60">{item.code}</code>
                <span className="shrink-0 w-40 text-white/80 font-medium">{item.label}</span>
                <span className="text-white/40">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div>
            {BRAND.name} API — Public Beta. Rate limits apply. No SLA during beta.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/products" className="hover:text-white/60 transition-colors">Browse</Link>
            <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white/60 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
