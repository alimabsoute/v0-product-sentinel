'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ZoomIn, ZoomOut, Maximize2, Filter, Search, Info, Play, Pause } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { products, categories, type Product, type Category } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface Node {
  id: string
  label: string
  type: 'product' | 'category' | 'tag'
  x: number
  y: number
  radius: number
  color: string
  product?: Product
}

interface Edge {
  source: string
  target: string
  strength: number
  type: 'category' | 'competitor' | 'similar'
}

export default function ExplorePage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('All')
  const [isAnimating, setIsAnimating] = useState(true)
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')

  // Generate graph data
  const { nodes, edges } = useMemo(() => {
    const activeProducts = products.filter(p => p.status === 'active')
    const filteredProducts = selectedCategory === 'All' 
      ? activeProducts 
      : activeProducts.filter(p => p.category === selectedCategory)

    // Create nodes
    const nodeMap: Record<string, Node> = {}
    const edgeList: Edge[] = []

    // Category nodes (center clusters)
    const categoryAngles: Record<string, number> = {}
    const usedCategories = [...new Set(filteredProducts.map(p => p.category))]
    usedCategories.forEach((cat, i) => {
      const angle = (i / usedCategories.length) * Math.PI * 2
      categoryAngles[cat] = angle
      
      nodeMap[`cat-${cat}`] = {
        id: `cat-${cat}`,
        label: cat,
        type: 'category',
        x: 400 + Math.cos(angle) * 180,
        y: 300 + Math.sin(angle) * 180,
        radius: 40,
        color: getCategoryColor(cat),
      }
    })

    // Product nodes (around categories)
    filteredProducts.forEach((product, i) => {
      const catAngle = categoryAngles[product.category] || 0
      const productsInCategory = filteredProducts.filter(p => p.category === product.category)
      const indexInCategory = productsInCategory.indexOf(product)
      const spreadAngle = catAngle + ((indexInCategory - productsInCategory.length / 2) * 0.3)
      const distance = 120 + (indexInCategory % 3) * 40

      const buzzRadius = Math.max(15, Math.min(35, product.buzz.score / 30))

      nodeMap[product.id] = {
        id: product.id,
        label: product.name,
        type: 'product',
        x: 400 + Math.cos(spreadAngle) * (180 + distance),
        y: 300 + Math.sin(spreadAngle) * (180 + distance),
        radius: buzzRadius,
        color: getBuzzColor(product.buzz.trend),
        product,
      }

      // Edge to category
      edgeList.push({
        source: product.id,
        target: `cat-${product.category}`,
        strength: 1,
        type: 'category',
      })

      // Edges between competitors (competitors array contains slugs)
      if (product.competitors) {
        product.competitors.forEach(compSlug => {
          // Find the product by slug
          const competitor = filteredProducts.find(p => p.slug === compSlug)
          if (competitor && nodeMap[competitor.id]) {
            edgeList.push({
              source: product.id,
              target: competitor.id,
              strength: 0.8,
              type: 'competitor',
            })
          }
        })
      }
    })

    return {
      nodes: Object.values(nodeMap),
      edges: edgeList,
    }
  }, [selectedCategory])

  // Filter nodes by search
  const visibleNodes = useMemo(() => {
    if (!searchQuery) return nodes
    const query = searchQuery.toLowerCase()
    return nodes.filter(n => n.label.toLowerCase().includes(query))
  }, [nodes, searchQuery])

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id))
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target))
  }, [edges, visibleNodes])

  // Find node by id for edges
  const getNode = useCallback((id: string) => {
    return nodes.find(n => n.id === id)
  }, [nodes])

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      if (direction === 'in') return Math.min(prev * 1.2, 3)
      return Math.max(prev / 1.2, 0.5)
    })
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="relative h-[calc(100vh-64px)]">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Filter by Category</p>
            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
              {['All', ...categories.filter(c => c !== 'All').slice(0, 6)].map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedCategory(cat as Category)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Zoom & Animation Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="rounded-xl border border-border bg-card p-1 shadow-lg flex flex-col">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom('in')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom('out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-1 shadow-lg flex flex-col">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", isAnimating && "text-primary")}
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-border bg-card p-3 shadow-lg max-w-[180px]">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide pt-1">Nodes</p>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--sentinel-rising)]" />
              <span className="text-xs">Rising buzz</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted-foreground/50" />
              <span className="text-xs">Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--sentinel-falling)]" />
              <span className="text-xs">Falling buzz</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary bg-muted" />
              <span className="text-xs">Category</span>
            </div>
            
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide pt-2 border-t border-border">Connections</p>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-primary rounded" />
              <span className="text-xs">Competitors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-muted-foreground/30" />
              <span className="text-xs">Same category</span>
            </div>
            
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide pt-2 border-t border-border">Animation</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <div className="h-px w-4 bg-primary/50" />
                <div className="h-1 w-1 rounded-full bg-primary/50" />
              </div>
              <span className="text-xs">Data flow</span>
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode?.product && (
          <div className="absolute bottom-4 right-4 z-10 w-72 rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <img
                src={selectedNode.product.logo}
                alt={selectedNode.product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{selectedNode.product.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedNode.product.category}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {selectedNode.product.tagline}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{selectedNode.product.buzz.score}</p>
                <p className="text-xs text-muted-foreground">Buzz Score</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/products/${selectedNode.product.slug}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Graph Canvas */}
        <svg
          ref={svgRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={{
            background: 'radial-gradient(circle at center, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)',
          }}
        >
          {/* Definitions for gradients and animations */}
          <defs>
            {/* Animated gradient for competitor edges */}
            <linearGradient id="competitorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
                {isAnimating && (
                  <animate 
                    attributeName="offset" 
                    values="0;1;0" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                )}
              </stop>
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>

            {/* Animated gradient for category edges */}
            <linearGradient id="categoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
            </linearGradient>

            {/* Glow filter for highlighted edges */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Animated dash pattern */}
            <pattern id="flowPattern" patternUnits="userSpaceOnUse" width="20" height="1">
              <line x1="0" y1="0" x2="10" y2="0" stroke="hsl(var(--primary))" strokeWidth="2">
                {isAnimating && (
                  <animate 
                    attributeName="x1" 
                    values="0;20" 
                    dur="1s" 
                    repeatCount="indefinite" 
                  />
                )}
              </line>
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Category Edges (subtle, behind everything) */}
            {visibleEdges.filter(e => e.type === 'category').map((edge, i) => {
              const source = getNode(edge.source)
              const target = getNode(edge.target)
              if (!source || !target) return null

              return (
                <line
                  key={`cat-edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="url(#categoryGradient)"
                  strokeWidth={0.5}
                  strokeOpacity={0.4}
                />
              )
            })}

            {/* Competitor Edges (animated, more prominent) */}
            {visibleEdges.filter(e => e.type === 'competitor').map((edge, i) => {
              const source = getNode(edge.source)
              const target = getNode(edge.target)
              if (!source || !target) return null

              const isHighlighted = hoveredNode && 
                (hoveredNode.id === edge.source || hoveredNode.id === edge.target)
              const isSelected = selectedNode &&
                (selectedNode.id === edge.source || selectedNode.id === edge.target)

              // Calculate edge length for animation timing
              const dx = target.x - source.x
              const dy = target.y - source.y
              const length = Math.sqrt(dx * dx + dy * dy)

              return (
                <g key={`comp-edge-${i}`}>
                  {/* Base line */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted || isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                    strokeWidth={isHighlighted || isSelected ? 2 : 1}
                    strokeOpacity={isHighlighted || isSelected ? 0.8 : 0.3}
                    className="transition-all duration-300"
                    filter={isHighlighted ? "url(#glow)" : undefined}
                  />
                  
                  {/* Animated flow dots */}
                  {isAnimating && (isHighlighted || isSelected) && (
                    <>
                      <circle r="3" fill="hsl(var(--primary))">
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M${source.x},${source.y} L${target.x},${target.y}`}
                        />
                        <animate
                          attributeName="opacity"
                          values="0;1;1;0"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="2" fill="hsl(var(--primary))" opacity="0.5">
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.5s"
                          path={`M${source.x},${source.y} L${target.x},${target.y}`}
                        />
                        <animate
                          attributeName="opacity"
                          values="0;0.5;0.5;0"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.5s"
                        />
                      </circle>
                    </>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {visibleNodes.map(node => {
              const isHovered = hoveredNode?.id === node.id
              const isSelected = selectedNode?.id === node.id
              const isCategory = node.type === 'category'

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelectedNode(node.type === 'product' ? node : null)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Node circle */}
                  <circle
                    r={node.radius}
                    fill={isCategory ? 'hsl(var(--muted))' : node.color}
                    stroke={isSelected ? 'hsl(var(--primary))' : isCategory ? node.color : 'transparent'}
                    strokeWidth={isSelected ? 3 : isCategory ? 2 : 0}
                    className="transition-all"
                    style={{
                      filter: isHovered ? 'brightness(1.2)' : undefined,
                      transform: isHovered ? 'scale(1.1)' : undefined,
                    }}
                  />

                  {/* Product logo */}
                  {node.product && (
                    <clipPath id={`clip-${node.id}`}>
                      <circle r={node.radius - 2} />
                    </clipPath>
                  )}
                  {node.product && (
                    <image
                      href={node.product.logo}
                      x={-(node.radius - 2)}
                      y={-(node.radius - 2)}
                      width={(node.radius - 2) * 2}
                      height={(node.radius - 2) * 2}
                      clipPath={`url(#clip-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  )}

                  {/* Label */}
                  {(isHovered || isSelected || isCategory) && (
                    <text
                      y={node.radius + 14}
                      textAnchor="middle"
                      fontSize={isCategory ? 12 : 10}
                      fontWeight={isCategory ? 600 : 500}
                      fill="currentColor"
                      className="pointer-events-none"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="rounded-full bg-card/80 backdrop-blur px-4 py-2 text-xs text-muted-foreground border border-border">
            Click a product to view details • Scroll to zoom • Drag to pan
          </div>
        </div>
      </main>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'AI Tools': 'hsl(280, 70%, 50%)',
    'Developer Tools': 'hsl(200, 70%, 50%)',
    'Productivity': 'hsl(150, 70%, 50%)',
    'Design': 'hsl(320, 70%, 50%)',
    'Marketing': 'hsl(30, 70%, 50%)',
    'Analytics': 'hsl(220, 70%, 50%)',
    'Collaboration': 'hsl(170, 70%, 50%)',
    'Finance': 'hsl(100, 70%, 50%)',
    'Communication': 'hsl(350, 70%, 50%)',
  }
  return colors[category] || 'hsl(var(--muted-foreground))'
}

function getBuzzColor(trend: 'rising' | 'falling' | 'stable'): string {
  switch (trend) {
    case 'rising':
      return 'var(--sentinel-rising)'
    case 'falling':
      return 'var(--sentinel-falling)'
    default:
      return 'var(--sentinel-stable)'
  }
}
