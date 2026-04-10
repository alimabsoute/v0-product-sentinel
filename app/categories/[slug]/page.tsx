"use client"

import { use, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { products, CATEGORY_INFO, type Category } from "@/lib/mock-data"
import { 
  TrendingUp, 
  TrendingDown,
  Clock,
  Skull,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  ChevronDown,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Mock historical data for categories
const categoryHistory: Record<string, {
  years: { year: number; productCount: number; avgBuzz: number; topTrend: string }[]
  characteristics: { name: string; trend: "rising" | "falling" | "stable"; percentage: number }[]
  notableEvents: { date: string; event: string }[]
}> = {
  "ai-tools": {
    years: [
      { year: 2020, productCount: 45, avgBuzz: 120, topTrend: "NLP Assistants" },
      { year: 2021, productCount: 89, avgBuzz: 180, topTrend: "AI Writing" },
      { year: 2022, productCount: 156, avgBuzz: 340, topTrend: "Image Generation" },
      { year: 2023, productCount: 412, avgBuzz: 890, topTrend: "ChatGPT Wrappers" },
      { year: 2024, productCount: 687, avgBuzz: 720, topTrend: "AI Agents" },
      { year: 2025, productCount: 890, avgBuzz: 650, topTrend: "Multi-Modal AI" },
    ],
    characteristics: [
      { name: "API-based", trend: "falling", percentage: 45 },
      { name: "Multi-modal", trend: "rising", percentage: 68 },
      { name: "Agent-capable", trend: "rising", percentage: 52 },
      { name: "Self-hosted option", trend: "rising", percentage: 34 },
      { name: "Enterprise focus", trend: "stable", percentage: 41 },
    ],
    notableEvents: [
      { date: "Nov 2022", event: "ChatGPT launches, sparking AI tool explosion" },
      { date: "Mar 2023", event: "GPT-4 released, capabilities leap forward" },
      { date: "Jul 2023", event: "First wave of AI tool shutdowns begins" },
      { date: "Feb 2024", event: "Agent frameworks gain mainstream adoption" },
    ]
  },
  "developer-tools": {
    years: [
      { year: 2020, productCount: 234, avgBuzz: 280, topTrend: "JAMstack" },
      { year: 2021, productCount: 267, avgBuzz: 310, topTrend: "No-Code Backend" },
      { year: 2022, productCount: 298, avgBuzz: 290, topTrend: "Edge Computing" },
      { year: 2023, productCount: 345, avgBuzz: 420, topTrend: "AI Code Assistants" },
      { year: 2024, productCount: 389, avgBuzz: 380, topTrend: "AI-Native IDEs" },
      { year: 2025, productCount: 412, avgBuzz: 340, topTrend: "Vibe Coding" },
    ],
    characteristics: [
      { name: "AI-assisted", trend: "rising", percentage: 72 },
      { name: "Open source", trend: "stable", percentage: 45 },
      { name: "Cloud-native", trend: "stable", percentage: 88 },
      { name: "CLI-first", trend: "falling", percentage: 28 },
      { name: "TypeScript support", trend: "rising", percentage: 91 },
    ],
    notableEvents: [
      { date: "Jun 2021", event: "GitHub Copilot preview launches" },
      { date: "Mar 2023", event: "AI coding assistants become mainstream" },
      { date: "Jan 2024", event: "Devin sparks 'AI SWE' debate" },
    ]
  },
  "productivity": {
    years: [
      { year: 2020, productCount: 189, avgBuzz: 340, topTrend: "Remote Collaboration" },
      { year: 2021, productCount: 212, avgBuzz: 290, topTrend: "Async Work" },
      { year: 2022, productCount: 245, avgBuzz: 260, topTrend: "Knowledge Management" },
      { year: 2023, productCount: 278, avgBuzz: 380, topTrend: "AI Assistants" },
      { year: 2024, productCount: 312, avgBuzz: 350, topTrend: "AI Workflows" },
      { year: 2025, productCount: 356, avgBuzz: 320, topTrend: "Personal AI" },
    ],
    characteristics: [
      { name: "AI-powered", trend: "rising", percentage: 65 },
      { name: "Cross-platform", trend: "stable", percentage: 82 },
      { name: "Offline support", trend: "falling", percentage: 31 },
      { name: "Team features", trend: "stable", percentage: 74 },
      { name: "API/Integrations", trend: "rising", percentage: 89 },
    ],
    notableEvents: [
      { date: "Mar 2020", event: "Remote work boom drives adoption spike" },
      { date: "Nov 2023", event: "AI-first productivity tools dominate launches" },
    ]
  },
  "design": {
    years: [
      { year: 2020, productCount: 134, avgBuzz: 220, topTrend: "Figma Plugins" },
      { year: 2021, productCount: 156, avgBuzz: 280, topTrend: "Design Systems" },
      { year: 2022, productCount: 178, avgBuzz: 350, topTrend: "AI Image Gen" },
      { year: 2023, productCount: 201, avgBuzz: 420, topTrend: "AI Design Assist" },
      { year: 2024, productCount: 223, avgBuzz: 380, topTrend: "AI-Native Design" },
      { year: 2025, productCount: 245, avgBuzz: 340, topTrend: "Prompt-to-UI" },
    ],
    characteristics: [
      { name: "AI generation", trend: "rising", percentage: 58 },
      { name: "Figma integration", trend: "stable", percentage: 67 },
      { name: "Real-time collab", trend: "stable", percentage: 72 },
      { name: "Component libraries", trend: "rising", percentage: 81 },
      { name: "Code export", trend: "rising", percentage: 54 },
    ],
    notableEvents: [
      { date: "Sep 2022", event: "Adobe acquires Figma (later blocked)" },
      { date: "Aug 2022", event: "Stable Diffusion open-sourced" },
    ]
  },
  "analytics": {
    years: [
      { year: 2020, productCount: 98, avgBuzz: 180, topTrend: "Privacy-First" },
      { year: 2021, productCount: 112, avgBuzz: 200, topTrend: "Product Analytics" },
      { year: 2022, productCount: 128, avgBuzz: 220, topTrend: "Cookieless" },
      { year: 2023, productCount: 145, avgBuzz: 280, topTrend: "AI Insights" },
      { year: 2024, productCount: 167, avgBuzz: 310, topTrend: "Predictive" },
      { year: 2025, productCount: 189, avgBuzz: 290, topTrend: "Conversational BI" },
    ],
    characteristics: [
      { name: "Privacy-compliant", trend: "rising", percentage: 78 },
      { name: "AI-powered insights", trend: "rising", percentage: 62 },
      { name: "Real-time", trend: "stable", percentage: 84 },
      { name: "Self-hosted option", trend: "rising", percentage: 41 },
      { name: "No-code setup", trend: "rising", percentage: 56 },
    ],
    notableEvents: [
      { date: "Jul 2020", event: "Google Analytics 4 forces migration" },
      { date: "Jan 2024", event: "AI-powered analytics becomes standard" },
    ]
  },
  "finance": {
    years: [
      { year: 2020, productCount: 67, avgBuzz: 150, topTrend: "Personal Finance" },
      { year: 2021, productCount: 78, avgBuzz: 180, topTrend: "Crypto Tools" },
      { year: 2022, productCount: 89, avgBuzz: 140, topTrend: "Budgeting" },
      { year: 2023, productCount: 102, avgBuzz: 190, topTrend: "AI Bookkeeping" },
      { year: 2024, productCount: 118, avgBuzz: 220, topTrend: "SMB Finance" },
      { year: 2025, productCount: 134, avgBuzz: 200, topTrend: "AI CFO" },
    ],
    characteristics: [
      { name: "Bank integrations", trend: "stable", percentage: 72 },
      { name: "AI-powered", trend: "rising", percentage: 48 },
      { name: "SMB focus", trend: "rising", percentage: 56 },
      { name: "Crypto support", trend: "falling", percentage: 23 },
      { name: "Multi-currency", trend: "stable", percentage: 61 },
    ],
    notableEvents: [
      { date: "Nov 2021", event: "Crypto tool boom peaks" },
      { date: "Dec 2022", event: "Crypto winter kills many finance tools" },
    ]
  }
}

type SortOption = "buzz" | "newest" | "oldest" | "name"
type ViewMode = "grid" | "list"

export default function CategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = use(params)
  const { slug } = resolvedParams
  
  const [sortBy, setSortBy] = useState<SortOption>("buzz")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showHistory, setShowHistory] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "dead">("all")

  const categoryInfo = CATEGORY_INFO[slug as Category]
  
  if (!categoryInfo) {
    notFound()
  }

  const categoryProducts = products.filter(p => p.category === slug)
  
  // Apply filters
  let filteredProducts = categoryProducts
  if (statusFilter === "active") {
    filteredProducts = filteredProducts.filter(p => p.status === "active")
  } else if (statusFilter === "dead") {
    filteredProducts = filteredProducts.filter(p => p.status === "dead")
  }
  
  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "buzz":
        return b.buzz.score - a.buzz.score
      case "newest":
        return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
      case "oldest":
        return new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime()
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const history = categoryHistory[slug]
  const latestYear = history?.years[history.years.length - 1]
  const previousYear = history?.years[history.years.length - 2]
  const growthRate = latestYear && previousYear 
    ? ((latestYear.productCount - previousYear.productCount) / previousYear.productCount * 100).toFixed(0)
    : "0"

  const activeCount = categoryProducts.filter(p => p.status === "active").length
  const deadCount = categoryProducts.filter(p => p.status === "dead").length

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          <span>/</span>
          <span>{categoryInfo.name}</span>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
              {categoryInfo.icon}
            </div>
            <div>
              <h1 className="font-serif text-4xl font-medium">{categoryInfo.name}</h1>
              <p className="text-muted-foreground">{categoryInfo.description}</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="px-4 py-2 bg-card border rounded-lg">
              <span className="text-2xl font-serif">{categoryProducts.length}</span>
              <span className="text-sm text-muted-foreground ml-2">products tracked</span>
            </div>
            <div className="px-4 py-2 bg-card border rounded-lg flex items-center gap-2">
              <span className="text-2xl font-serif text-green-600">{activeCount}</span>
              <span className="text-sm text-muted-foreground">active</span>
            </div>
            <div className="px-4 py-2 bg-card border rounded-lg flex items-center gap-2">
              <Skull className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-serif text-muted-foreground">{deadCount}</span>
              <span className="text-sm text-muted-foreground">dead</span>
            </div>
            {Number(growthRate) !== 0 && (
              <div className="px-4 py-2 bg-card border rounded-lg flex items-center gap-2">
                {Number(growthRate) > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "text-2xl font-serif",
                  Number(growthRate) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {Number(growthRate) > 0 ? "+" : ""}{growthRate}%
                </span>
                <span className="text-sm text-muted-foreground">YoY growth</span>
              </div>
            )}
          </div>
        </div>

        {/* Historical Section */}
        {history && showHistory && (
          <div className="mb-10 space-y-6">
            {/* Evolution Chart */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl">Category Evolution</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHistory(false)}
                  className="text-muted-foreground"
                >
                  Hide
                </Button>
              </div>
              
              {/* Year progression */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                {history.years.map((yearData, i) => {
                  const prevYear = history.years[i - 1]
                  const change = prevYear 
                    ? ((yearData.productCount - prevYear.productCount) / prevYear.productCount * 100).toFixed(0)
                    : null
                  
                  return (
                    <div 
                      key={yearData.year}
                      className="p-4 bg-secondary/50 rounded-lg text-center"
                    >
                      <div className="text-lg font-medium mb-1">{yearData.year}</div>
                      <div className="text-2xl font-serif text-primary">{yearData.productCount}</div>
                      <div className="text-xs text-muted-foreground mb-2">products</div>
                      {change && (
                        <div className={cn(
                          "text-xs",
                          Number(change) > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {Number(change) > 0 ? "+" : ""}{change}%
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2 truncate">
                        {yearData.topTrend}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Characteristic Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Current Characteristics</h3>
                  <div className="space-y-3">
                    {history.characteristics.map(char => (
                      <div key={char.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{char.name}</span>
                            <span className="text-sm text-muted-foreground">{char.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                char.trend === "rising" && "bg-green-500",
                                char.trend === "falling" && "bg-red-400",
                                char.trend === "stable" && "bg-primary"
                              )}
                              style={{ width: `${char.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          char.trend === "rising" && "bg-green-500/10 text-green-600",
                          char.trend === "falling" && "bg-red-500/10 text-red-600",
                          char.trend === "stable" && "bg-muted text-muted-foreground"
                        )}>
                          {char.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Notable Events</h3>
                  <div className="space-y-3">
                    {history.notableEvents.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-20 text-sm text-muted-foreground shrink-0">
                          {event.date}
                        </div>
                        <div className="text-sm">{event.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {statusFilter === "all" ? "All Products" : statusFilter === "active" ? "Active Only" : "Dead Only"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("dead")}>
                  Dead Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SortAsc className="h-4 w-4" />
                  Sort: {sortBy === "buzz" ? "Buzz Score" : sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("buzz")}>Buzz Score</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Name A-Z</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {!showHistory && history && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Show History
              </Button>
            )}
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {sortedProducts.length} products
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} variant="list" />
            ))}
          </div>
        )}

        {sortedProducts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No products found matching your filters.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
