'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, X, RotateCcw, ExternalLink, Copy } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GraphData, GraphNode, GraphLink, GraphViewMode } from '@/lib/db/graph'

// ─── Dynamic import: react-force-graph is canvas/WebGL → client-only ─────────
// The package ships ESM + DOM APIs; importing at module level during SSR throws
// "self is not defined". `ssr: false` is required.
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(m => m.default),
  { ssr: false, loading: () => <GraphSkeleton /> }
) as unknown as React.ComponentType<any>

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExplorePageProps {
  initialGraph: GraphData
  categories: { slug: string; name: string }[]
}

// react-force-graph mutates nodes in place with x/y/vx/vy.
interface RGNode extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
  __bckgDimensions?: [number, number]
}

interface RGLink extends Omit<GraphLink, 'source' | 'target'> {
  source: string | RGNode
  target: string | RGNode
}

// ─── Category colour palette (Bloomberg-ish neon on dark) ────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'ai-tools':       '#a78bfa', // violet
  'dev-tools':      '#38bdf8', // sky
  'productivity':   '#34d399', // emerald
  'design':         '#f472b6', // pink
  'marketing':      '#fb923c', // orange
  'analytics':      '#60a5fa', // blue
  'finance':        '#facc15', // yellow
  'communication':  '#f87171', // red
  'security':       '#4ade80', // green
  'hardware':       '#94a3b8', // slate
  'entertainment':  '#c084fc', // purple
  'education':      '#22d3ee', // cyan
  'health':         '#fda4af', // rose
  'e-commerce':     '#fbbf24', // amber
  'gaming':         '#a3e635', // lime
}

function colorForCategory(slug: string): string {
  return CATEGORY_COLORS[slug] ?? '#64748b'
}

// ─── Death / mortality risk helpers ──────────────────────────────────────────

function riskColor(risk: number): string {
  if (risk >= 100) return '#dc2626'  // crimson — dead
  if (risk >= 70)  return '#f97316'  // orange — critical
  if (risk >= 40)  return '#eab308'  // yellow — watch
  return '#22c55e'                   // green — safe
}

function riskLabel(risk: number): string {
  if (risk >= 100) return 'DEAD'
  if (risk >= 70)  return 'CRITICAL'
  if (risk >= 40)  return 'WATCH'
  return 'SAFE'
}

function riskBadgeClass(risk: number): string {
  if (risk >= 100) return 'bg-red-900/50 text-red-400'
  if (risk >= 70)  return 'bg-orange-900/50 text-orange-400'
  if (risk >= 40)  return 'bg-yellow-900/50 text-yellow-400'
  return 'bg-green-900/50 text-green-400'
}

// ─── Graveyard gravity — pulls dead nodes toward a fixed cluster point ────────

function makeGraveyardForce(cx: number, cy: number) {
  let _nodes: RGNode[] = []
  function force(alpha: number) {
    for (const n of _nodes) {
      if (!n.is_dead) continue
      const dx = (n.x ?? cx) - cx
      const dy = (n.y ?? cy) - cy
      n.vx = (n.vx ?? 0) - dx * alpha * 0.15
      n.vy = (n.vy ?? 0) - dy * alpha * 0.15
    }
  }
  ;(force as any).initialize = (ns: RGNode[]) => { _nodes = ns }
  return force
}

// Log-scale node radius so huge scores don't swamp the canvas
function radiusForScore(score: number): number {
  const clamped = Math.max(0, Math.min(100, score))
  return 4 + Math.log10(clamped + 1) * 4  // 4..12 roughly
}

// ─── Debounce hook ───────────────────────────────────────────────────────────

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ExplorePage({ initialGraph, categories }: ExplorePageProps) {
  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [dims, setDims] = useState({ width: 1200, height: 800 })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<RGNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<RGNode | null>(null)
  const [viewMode, setViewMode] = useState<GraphViewMode>('category')
  const [graphData, setGraphData] = useState(initialGraph)
  const [loadingMode, setLoadingMode] = useState(false)
  const [riskThreshold, setRiskThreshold] = useState(0)

  const debouncedSearch = useDebounced(search, 200)

  // ── Image cache (logo_url → HTMLImageElement) ─────────────────────────────
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const getLogoImage = useCallback((url: string): HTMLImageElement | null => {
    const cache = imgCache.current
    const existing = cache.get(url)
    if (existing) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => {
      // Nudge the graph to redraw once the image is ready.
      fgRef.current?.d3ReheatSimulation?.()
    }
    img.onerror = () => {
      // Replace with a sentinel so we stop trying.
      const broken = new Image()
      cache.set(url, broken)
    }
    cache.set(url, img)
    return null
  }, [])

  // ── Viewport sizing ───────────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDims({ width: rect.width, height: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // ── View mode switcher ───────────────────────────────────────────────────
  const switchViewMode = useCallback(async (mode: GraphViewMode) => {
    setViewMode(mode)
    setLoadingMode(true)
    setCategoryFilter(null)
    if (mode !== 'death') setRiskThreshold(0)
    try {
      const res = await fetch(`/api/graph?viewMode=${mode}&limit=2000`)
      const data = await res.json()
      setGraphData(data)
    } catch { /* keep existing */ }
    setLoadingMode(false)
  }, [])

  // ── Filtered graph data ───────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const { nodes, links } = graphData

    // Apply category filter
    let visibleProducts = nodes.filter(n => n.type === 'product')
    if (categoryFilter) {
      visibleProducts = visibleProducts.filter(n => n.categorySlug === categoryFilter)
    }

    // Death mode: apply risk threshold filter
    if (viewMode === 'death' && riskThreshold > 0) {
      visibleProducts = visibleProducts.filter(n => n.mortality_risk >= riskThreshold)
    }

    const productIds = new Set(visibleProducts.map(n => n.id))

    // Category hubs: keep only hubs referenced by visible products
    const visibleHubSlugs = new Set(visibleProducts.map(n => n.categorySlug))
    const visibleHubs = nodes.filter(
      n => n.type === 'category' && visibleHubSlugs.has(n.categorySlug),
    )
    const hubIds = new Set(visibleHubs.map(n => n.id))

    const allVisibleIds = new Set([...productIds, ...hubIds])

    const visibleLinks = links.filter(l => {
      const src = typeof l.source === 'string' ? l.source : (l.source as RGNode).id!
      const tgt = typeof l.target === 'string' ? l.target : (l.target as RGNode).id!
      return allVisibleIds.has(src) && allVisibleIds.has(tgt)
    })

    return {
      nodes: [...visibleProducts, ...visibleHubs] as RGNode[],
      links: visibleLinks as RGLink[],
    }
  }, [graphData, categoryFilter, viewMode, riskThreshold])

  // ── Neighbour index for hover highlighting ────────────────────────────────
  const neighbourIndex = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const link of filteredData.links) {
      const src = typeof link.source === 'string' ? link.source : (link.source as RGNode).id!
      const tgt = typeof link.target === 'string' ? link.target : (link.target as RGNode).id!
      if (!map.has(src)) map.set(src, new Set())
      if (!map.has(tgt)) map.set(tgt, new Set())
      map.get(src)!.add(tgt)
      map.get(tgt)!.add(src)
    }
    return map
  }, [filteredData])

  // ── Search match set (for highlighting) ───────────────────────────────────
  const searchMatches = useMemo(() => {
    if (!debouncedSearch.trim()) return null
    const q = debouncedSearch.toLowerCase().trim()
    const matches = filteredData.nodes.filter(
      n => n.type === 'product' && n.name.toLowerCase().includes(q),
    )
    return new Set(matches.map(n => n.id))
  }, [debouncedSearch, filteredData])

  // Zoom to first search match when search changes
  useEffect(() => {
    if (!searchMatches || searchMatches.size === 0) return
    const firstId = searchMatches.values().next().value
    const node = filteredData.nodes.find(n => n.id === firstId) as RGNode | undefined
    if (node && node.x != null && node.y != null && fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800)
      fgRef.current.zoom(3, 800)
    }
  }, [searchMatches, filteredData])

  // ── Physics config — applied after ForceGraph2D mounts, then reheated ──────
  // onEngineStop fires AFTER simulation settles, so forces set there don't affect
  // the visible layout. Instead: configure forces + reheat after a short delay.
  useEffect(() => {
    const id = setTimeout(() => {
      const fg = fgRef.current
      if (!fg) return
      fg.d3Force('charge')?.strength(-80)
      fg.d3Force('link')?.distance((link: RGLink) => {
        if (link.type === 'alternative') return 20
        if (link.type === 'relationship') return 25
        return 35
      })
      fg.d3Force('link')?.strength((link: RGLink) => {
        return link.type === 'category' ? 0.5 : 0.3
      })
      // Death mode: gravity well pulls all dead nodes toward bottom-right cluster
      if (viewMode === 'death') {
        fg.d3Force('graveyard', makeGraveyardForce(dims.width * 0.72, dims.height * 0.72))
      } else {
        fg.d3Force('graveyard', null)
      }
      fg.d3ReheatSimulation?.()
    }, 600)
    return () => clearTimeout(id)
  }, [graphData, viewMode, dims])

  // ── Node rendering (canvas) ───────────────────────────────────────────────
  const drawNode = useCallback(
    (node: RGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0
      const y = node.y ?? 0
      const isHub = node.type === 'category'
      const radius = isHub ? 16 : radiusForScore(node.signal_score)
      // In death mode override colour to reflect mortality risk
      const catColor = (!isHub && viewMode === 'death')
        ? riskColor(node.mortality_risk)
        : colorForCategory(node.categorySlug)

      // ── Dimming logic ──
      let opacity = 1
      if (hoveredNode) {
        const isHover = node.id === hoveredNode.id
        const isNeighbour = neighbourIndex.get(hoveredNode.id)?.has(node.id!)
        opacity = isHover || isNeighbour ? 1 : 0.1
      } else if (searchMatches) {
        opacity = searchMatches.has(node.id!) ? 1 : 0.15
      }

      ctx.globalAlpha = opacity

      // ── Category hub: big solid circle with label ──
      if (isHub) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        ctx.fillStyle = catColor
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()

        // Label (always visible for hubs)
        const label = node.name.toUpperCase()
        const fontSize = Math.max(11 / globalScale, 3)
        ctx.font = `600 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#fff'
        ctx.fillText(label, x, y + radius + 4 / globalScale)
        ctx.globalAlpha = 1
        return
      }

      // ── Product node ──
      const tryLogo = node.logo_url && globalScale > 0.4
      let drewLogo = false
      if (tryLogo) {
        const img = getLogoImage(node.logo_url!)
        if (img) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
          ctx.closePath()
          ctx.clip()
          try {
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2)
            drewLogo = true
          } catch {
            // Tainted canvas from cross-origin image — fall back to circle
          }
          ctx.restore()

          // Ring
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
          ctx.lineWidth = 1.5 / globalScale
          ctx.strokeStyle = catColor
          ctx.stroke()
        }
      }

      if (!drewLogo) {
        // Filled circle (category colour, slightly transparent)
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        ctx.fillStyle = catColor + 'cc' // ~80% alpha
        ctx.fill()
        ctx.strokeStyle = catColor
        ctx.lineWidth = 1 / globalScale
        ctx.stroke()

        // First letter fallback if node is big enough
        if (radius > 7 && globalScale > 0.8) {
          const letter = (node.name[0] ?? '?').toUpperCase()
          const fontSize = Math.max(radius * 1.1, 6)
          ctx.font = `700 ${fontSize}px Inter, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#0a0a0a'
          ctx.fillText(letter, x, y)
        }
      }

      // ── Risk ring (all modes: critical ≥70; death mode: watch ≥40 too) ──
      const ringThreshold = viewMode === 'death' ? 40 : 70
      if (!isHub && node.mortality_risk >= ringThreshold) {
        ctx.beginPath()
        ctx.arc(x, y, radius + 1.5 / globalScale, 0, 2 * Math.PI, false)
        ctx.lineWidth = (node.mortality_risk >= 100 ? 2.5 : 1.5) / globalScale
        ctx.strokeStyle = hexWithAlpha(riskColor(node.mortality_risk), 0.75)
        ctx.stroke()
      }

      // ── Skull overlay for confirmed dead products ──
      if (!isHub && node.is_dead && globalScale > 0.5 && radius > 4) {
        const sz = Math.max(radius * 1.05, 7)
        ctx.font = `${sz}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = opacity * 0.8
        ctx.fillStyle = '#fff'
        ctx.fillText('☠', x, y)
        ctx.globalAlpha = opacity
      }

      // Hover label
      if (hoveredNode?.id === node.id) {
        const label = node.name
        const fontSize = Math.max(11 / globalScale, 3)
        ctx.font = `500 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const textWidth = ctx.measureText(label).width
        const pad = 4 / globalScale
        ctx.fillStyle = 'rgba(10,10,10,0.9)'
        ctx.fillRect(
          x - textWidth / 2 - pad,
          y + radius + 2 / globalScale,
          textWidth + pad * 2,
          fontSize + pad,
        )
        ctx.fillStyle = '#fff'
        ctx.fillText(label, x, y + radius + 2 / globalScale + pad / 2)
      }

      ctx.globalAlpha = 1
    },
    [hoveredNode, neighbourIndex, searchMatches, getLogoImage, viewMode],
  )

  // ── Link colour + opacity (for dim-on-hover) ──────────────────────────────
  const linkColor = useCallback(
    (link: RGLink) => {
      const src = typeof link.source === 'string' ? link.source : (link.source as RGNode).id!
      const tgt = typeof link.target === 'string' ? link.target : (link.target as RGNode).id!

      let opacity = link.type === 'category' ? 0.25 : 0.5
      if (hoveredNode) {
        const touches = src === hoveredNode.id || tgt === hoveredNode.id
        opacity = touches ? 0.9 : 0.05
      }

      const base = link.type === 'alternative' ? '#f472b6' : link.type === 'relationship' ? '#60a5fa' : '#475569'
      return hexWithAlpha(base, opacity)
    },
    [hoveredNode],
  )

  const linkWidth = useCallback(
    (link: RGLink) => {
      if (link.type === 'alternative' || link.type === 'relationship') return 1.2
      return 0.6
    },
    [],
  )

  // ── Interaction handlers ──────────────────────────────────────────────────
  const handleNodeClick = useCallback((node: RGNode) => {
    if (node.type === 'category') {
      // Toggle category filter
      setCategoryFilter(prev => (prev === node.categorySlug ? null : node.categorySlug))
      setSelectedNode(null)
      return
    }
    setSelectedNode(node)
  }, [])

  const handleNodeRightClick = useCallback((node: RGNode) => {
    if (node.type !== 'product') return
    window.open(`/products/${node.slug}`, '_blank', 'noopener')
  }, [])

  const handleCopyReport = useCallback(() => {
    if (!selectedNode) return
    const n = selectedNode
    const threats = filteredData.nodes
      .filter(x => x.type === 'product' && !x.is_dead && x.categorySlug === n.categorySlug && x.id !== n.id)
      .sort((a, b) => b.signal_score - a.signal_score)
      .slice(0, 3)
    const deadComps = filteredData.nodes
      .filter(x => x.type === 'product' && x.is_dead && x.categorySlug === n.categorySlug)
      .sort((a, b) => (b.lifespan_months ?? 0) - (a.lifespan_months ?? 0))
      .slice(0, 3)
    const lines = [
      `LAUNCH SENTINEL INTELLIGENCE REPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `PRODUCT: ${n.name}`,
      `CATEGORY: ${n.category}`,
      `SIGNAL: ${n.signal_score.toFixed(1)}${n.signal_delta != null ? ` (${n.signal_delta >= 0 ? '+' : ''}${n.signal_delta.toFixed(1)})` : ''}`,
      `MORTALITY RISK: ${n.mortality_risk}/100 [${riskLabel(n.mortality_risk)}]`,
      ``,
      `COMPETITIVE THREATS:`,
      ...threats.map(t => `  · ${t.name} — ${t.signal_score.toFixed(1)}`),
      ...(threats.length === 0 ? ['  None tracked'] : []),
      ``,
      `DEAD COMPARABLES (${n.category}):`,
      ...deadComps.map(d => `  · ${d.name}${d.lifespan_months ? ` (${Math.round(d.lifespan_months / 12)}yr)` : ''} — ${d.death_reason?.replace(/_/g, ' ') ?? 'cause unknown'}`),
      ...(deadComps.length === 0 ? ['  No documented deaths in this category'] : []),
      ``,
      `Source: launchsentinel.com/products/${n.slug}`,
    ]
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
  }, [selectedNode, filteredData])

  const handleReset = useCallback(() => {
    setSearch('')
    setCategoryFilter(null)
    setRiskThreshold(0)
    setSelectedNode(null)
    fgRef.current?.zoomToFit?.(600, 60)
  }, [])

  const nodeCount = filteredData.nodes.filter(n => n.type === 'product').length
  const hubCount = filteredData.nodes.filter(n => n.type === 'category').length

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      <SiteHeader />

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {/* ── Controls bar (top-left) ── */}
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-3">
          <div className="rounded-lg border border-white/10 bg-black/60 p-3 shadow-lg backdrop-blur">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="h-8 w-64 border-white/10 bg-white/5 pl-8 pr-8 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* View mode tabs */}
            <div className="mb-2 flex rounded-md border border-white/10 overflow-hidden">
              {(['category', 'era', 'similarity', 'death'] as GraphViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { if (m !== viewMode) switchViewMode(m) }}
                  className={`flex-1 py-1 text-[10px] font-medium capitalize transition-colors ${
                    viewMode === m
                      ? m === 'death' ? 'bg-red-900/60 text-red-300' : 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {m === 'death' ? '☠ risk' : m}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              {viewMode === 'death' ? (
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-white/50">
                    <span>Min risk</span>
                    <span className="font-mono text-orange-400">{riskThreshold > 0 ? `${riskThreshold}+` : 'all'}</span>
                  </div>
                  <input
                    type="range" min={0} max={90} step={10}
                    value={riskThreshold}
                    onChange={e => setRiskThreshold(Number(e.target.value))}
                    className="h-1 w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              ) : viewMode === 'category' ? (
                <select
                  value={categoryFilter ?? ''}
                  onChange={(e) => setCategoryFilter(e.target.value || null)}
                  className="h-7 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">All categories</option>
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={handleReset}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[11px] text-white/60 backdrop-blur">
            <span className="text-white/90">{nodeCount}</span> products{' '}
            <span className="text-white/30">·</span>{' '}
            <span className="text-white/90">{hubCount}</span> categories{' '}
            {searchMatches && (
              <>
                <span className="text-white/30">·</span>{' '}
                <span className="text-amber-400">{searchMatches.size}</span> match{searchMatches.size === 1 ? '' : 'es'}
              </>
            )}
          </div>
        </div>

        {/* ── Legend (bottom-left) ── */}
        <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-white/10 bg-black/60 p-3 text-[11px] text-white/70 backdrop-blur">
          <div className="mb-1.5 font-medium text-white/90">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="block h-3 w-3 rounded-full border-2 border-white bg-violet-400" />
              <span>Category hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="block h-2.5 w-2.5 rounded-full bg-sky-400/80" />
              <span>Product (size = signal)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="block h-px w-4 bg-slate-500" />
              <span>Category link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="block h-px w-4 bg-pink-400" />
              <span>Alternative</span>
            </div>
          </div>
          <div className="mt-2 border-t border-white/10 pt-2 text-[10px] text-white/40">
            Click product for details · Right-click to open · Click hub to filter
          </div>
        </div>

        {/* ── Side panel (right, slide-in) ── */}
        {selectedNode && selectedNode.type === 'product' && (() => {
          const sn = selectedNode
          const catColor = colorForCategory(sn.categorySlug)
          const threats = filteredData.nodes
            .filter(n => n.type === 'product' && !n.is_dead && n.categorySlug === sn.categorySlug && n.id !== sn.id && n.signal_score > sn.signal_score)
            .sort((a, b) => b.signal_score - a.signal_score)
            .slice(0, 3) as RGNode[]
          const deadComps = filteredData.nodes
            .filter(n => n.type === 'product' && n.is_dead && n.categorySlug === sn.categorySlug)
            .sort((a, b) => (b.lifespan_months ?? 0) - (a.lifespan_months ?? 0))
            .slice(0, 3) as RGNode[]
          return (
          <aside className="absolute right-0 top-0 z-20 flex h-full w-[340px] flex-col animate-in slide-in-from-right border-l border-white/10 bg-black/85 backdrop-blur-md duration-300 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                {sn.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sn.logo_url} alt={sn.name} className="h-11 w-11 shrink-0 rounded-lg border border-white/10 bg-white/5 object-cover" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-bold text-black text-sm" style={{ background: catColor }}>
                    {sn.name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{sn.name}</h3>
                  <Badge variant="outline" className="mt-1 border-white/20 text-[10px] text-white/60" style={{ borderColor: catColor }}>
                    {sn.category}
                  </Badge>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="ml-2 shrink-0 text-white/40 hover:text-white" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Signal score */}
            <div className="border-t border-white/10 px-5 py-3">
              <div className="mb-1 text-[9px] uppercase tracking-widest text-white/40">Signal Score</div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl font-bold text-white">{sn.signal_score.toFixed(1)}</span>
                {sn.signal_delta != null && (
                  <span className={`font-mono text-xs ${sn.signal_delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sn.signal_delta >= 0 ? '↑' : '↓'}{Math.abs(sn.signal_delta).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, sn.signal_score))}%`, background: catColor }} />
              </div>
            </div>

            {/* Mortality risk */}
            <div className="border-t border-white/10 px-5 py-3">
              <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-widest text-white/40">
                <span>Mortality Risk</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${riskBadgeClass(sn.mortality_risk)}`}>{riskLabel(sn.mortality_risk)}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold" style={{ color: riskColor(sn.mortality_risk) }}>{sn.mortality_risk}</span>
                <span className="text-xs text-white/30">/ 100</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${sn.mortality_risk}%`, background: riskColor(sn.mortality_risk) }} />
              </div>
              {sn.is_dead && sn.death_reason && (
                <p className="mt-1.5 text-[10px] text-red-400/70 capitalize">{sn.death_reason.replace(/_/g, ' ')}{sn.lifespan_months ? ` · ${Math.round(sn.lifespan_months / 12)}yr lifespan` : ''}</p>
              )}
            </div>

            {/* Competitive threats */}
            <div className="border-t border-white/10 px-5 py-3">
              <div className="mb-2 text-[9px] uppercase tracking-widest text-white/40">Competitive Threats</div>
              {threats.length === 0 ? (
                <p className="text-[11px] text-white/30">No higher-signal competitors tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {threats.map(t => (
                    <button key={t.id} onClick={() => setSelectedNode(t)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white/5">
                      <span className="block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colorForCategory(t.categorySlug) }} />
                      <span className="flex-1 truncate text-xs text-white/80">{t.name}</span>
                      <span className="font-mono text-[10px] text-white/50">{t.signal_score.toFixed(1)}</span>
                      <span className={`text-[10px] ${(t.signal_delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{(t.signal_delta ?? 0) >= 0 ? '↑' : '↓'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dead comparables */}
            <div className="border-t border-white/10 px-5 py-3">
              <div className="mb-2 text-[9px] uppercase tracking-widest text-white/40">Dead Comparables</div>
              {deadComps.length === 0 ? (
                <p className="text-[11px] text-white/30">No documented deaths in this category</p>
              ) : (
                <div className="space-y-2">
                  {deadComps.map(d => (
                    <button key={d.id} onClick={() => setSelectedNode(d)} className="flex w-full flex-col gap-0.5 rounded px-1 py-0.5 text-left hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">☠</span>
                        <span className="flex-1 truncate text-xs text-red-300/80">{d.name}</span>
                        {d.lifespan_months && <span className="font-mono text-[10px] text-white/30">{Math.round(d.lifespan_months / 12)}yr</span>}
                      </div>
                      {d.death_reason && <span className="pl-4 text-[9px] text-white/30 capitalize">{d.death_reason.replace(/_/g, ' ')}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto border-t border-white/10 p-5 space-y-2">
              <Link href={`/products/${sn.slug}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition hover:bg-white/10">
                View Full Profile
                <ExternalLink className="h-3.5 w-3.5 text-white/50" />
              </Link>
              <button onClick={handleCopyReport} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
                Copy Intelligence Report
                <Copy className="h-3.5 w-3.5 text-white/40" />
              </button>
            </div>
          </aside>
          )
        })()}

        {/* ── The graph ── */}
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
          width={dims.width}
          height={dims.height}
          backgroundColor="#0a0a0a"
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={20}
          onEngineStop={undefined}
          nodeRelSize={1}
          nodeVal={(n: RGNode) => (n.type === 'category' ? 40 : radiusForScore(n.signal_score))}
          nodeLabel={(n: RGNode) =>
            n.type === 'category'
              ? `<div style="font:600 12px Inter">${escapeHtml(n.name)}</div><div style="color:#aaa;font:11px Inter">${n.product_count} products</div>`
              : `<div style="font:600 12px Inter">${escapeHtml(n.name)}</div><div style="color:#aaa;font:11px Inter">${escapeHtml(n.category)} · signal ${n.signal_score.toFixed(1)}</div>`
          }
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(n: RGNode, color: string, ctx: CanvasRenderingContext2D) => {
            const x = n.x ?? 0
            const y = n.y ?? 0
            const r = n.type === 'category' ? 16 : radiusForScore(n.signal_score)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, r, 0, 2 * Math.PI, false)
            ctx.fill()
          }}
          linkColor={linkColor}
          linkWidth={linkWidth}
          onNodeHover={(node: RGNode | null) => setHoveredNode(node)}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          onBackgroundClick={() => setSelectedNode(null)}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={0.2}
          maxZoom={8}
        />
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function GraphSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-white/40">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        <div className="mt-3 text-xs">Loading graph…</div>
      </div>
    </div>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hexWithAlpha(hex: string, alpha: number): string {
  // Convert `#rrggbb` to `rgba(r,g,b,a)`. If alpha provided inline, we overwrite.
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`
}
