"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { products, categories, CATEGORY_INFO } from "@/lib/mock-data"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  Filter,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Mock historical data showing how characteristics evolved
const characteristicEvolution = [
  {
    characteristic: "Pricing Model",
    timeline: [
      { year: 2020, dominant: "Freemium", percentage: 45, description: "Free tiers with paid upgrades dominated" },
      { year: 2021, dominant: "Subscription", percentage: 52, description: "Monthly subscriptions became standard" },
      { year: 2022, dominant: "Usage-Based", percentage: 38, description: "Pay-per-use models emerged with AI tools" },
      { year: 2023, dominant: "Hybrid", percentage: 41, description: "Mix of subscription + usage credits" },
      { year: 2024, dominant: "AI Credits", percentage: 48, description: "Token/credit systems for AI products" },
      { year: 2025, dominant: "Outcome-Based", percentage: 35, description: "Pay for results, not usage" },
    ]
  },
  {
    characteristic: "Target User",
    timeline: [
      { year: 2020, dominant: "Developers", percentage: 55, description: "Dev tools led the market" },
      { year: 2021, dominant: "Designers", percentage: 42, description: "No-code design tools surged" },
      { year: 2022, dominant: "Marketers", percentage: 48, description: "Content & growth tools exploded" },
      { year: 2023, dominant: "Everyone", percentage: 62, description: "AI democratized complex tools" },
      { year: 2024, dominant: "SMBs", percentage: 51, description: "Small business focus increased" },
      { year: 2025, dominant: "Individuals", percentage: 44, description: "Personal productivity renaissance" },
    ]
  },
  {
    characteristic: "Core Technology",
    timeline: [
      { year: 2020, dominant: "Cloud SaaS", percentage: 68, description: "Cloud-first everything" },
      { year: 2021, dominant: "No-Code", percentage: 45, description: "Visual builders proliferated" },
      { year: 2022, dominant: "API-First", percentage: 52, description: "Composable architectures" },
      { year: 2023, dominant: "LLMs", percentage: 71, description: "ChatGPT sparked AI revolution" },
      { year: 2024, dominant: "Agents", percentage: 58, description: "Autonomous AI agents emerged" },
      { year: 2025, dominant: "Multi-Modal", percentage: 63, description: "Text, image, video, audio unified" },
    ]
  },
  {
    characteristic: "Distribution",
    timeline: [
      { year: 2020, dominant: "PLG", percentage: 48, description: "Product-led growth dominated" },
      { year: 2021, dominant: "Community", percentage: 42, description: "Discord/Slack communities drove adoption" },
      { year: 2022, dominant: "Influencers", percentage: 38, description: "Tech Twitter became key channel" },
      { year: 2023, dominant: "Viral Demos", percentage: 55, description: "Show, don't tell worked best" },
      { year: 2024, dominant: "AI Discovery", percentage: 41, description: "AI assistants recommend tools" },
      { year: 2025, dominant: "Embedded", percentage: 47, description: "Tools embedded in workflows" },
    ]
  }
]

// Category growth over time
const categoryGrowthData = [
  { category: "ai-tools", years: { 2020: 45, 2021: 89, 2022: 156, 2023: 412, 2024: 687, 2025: 890 } },
  { category: "developer-tools", years: { 2020: 234, 2021: 267, 2022: 298, 2023: 345, 2024: 389, 2025: 412 } },
  { category: "productivity", years: { 2020: 189, 2021: 212, 2022: 245, 2023: 278, 2024: 312, 2025: 356 } },
  { category: "design", years: { 2020: 134, 2021: 156, 2022: 178, 2023: 201, 2024: 223, 2025: 245 } },
  { category: "analytics", years: { 2020: 98, 2021: 112, 2022: 128, 2023: 145, 2024: 167, 2025: 189 } },
  { category: "finance", years: { 2020: 67, 2021: 78, 2022: 89, 2023: 102, 2024: 118, 2025: 134 } },
]

// Market milestones
const milestones = [
  { year: 2020, month: "Mar", event: "Remote Work Boom", description: "COVID accelerates digital tool adoption", impact: "high" },
  { year: 2020, month: "Sep", event: "No-Code Summer", description: "Webflow, Notion, Airtable hit mainstream", impact: "medium" },
  { year: 2021, month: "Apr", event: "Creator Economy Peak", description: "Tools for creators flood the market", impact: "medium" },
  { year: 2021, month: "Nov", event: "Web3 Frenzy", description: "Crypto/NFT tools everywhere (most now dead)", impact: "low" },
  { year: 2022, month: "Jun", event: "AI Art Emerges", description: "DALL-E, Midjourney change creative tools", impact: "high" },
  { year: 2022, month: "Nov", event: "ChatGPT Launch", description: "Everything changes overnight", impact: "critical" },
  { year: 2023, month: "Mar", event: "AI Tool Explosion", description: "1000+ AI wrappers launch in weeks", impact: "high" },
  { year: 2023, month: "Jul", event: "The Great Culling", description: "Undifferentiated AI tools start dying", impact: "medium" },
  { year: 2024, month: "Feb", event: "Agent Era Begins", description: "Autonomous AI agents gain traction", impact: "high" },
  { year: 2024, month: "Aug", event: "Consolidation Wave", description: "Major acquisitions reshape landscape", impact: "medium" },
  { year: 2025, month: "Jan", event: "Multi-Modal Standard", description: "Text+Image+Video becomes baseline", impact: "high" },
]

const years = [2020, 2021, 2022, 2023, 2024, 2025]

export default function EvolutionPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<string>("Core Technology")
  const [view, setView] = useState<"timeline" | "characteristics" | "categories">("timeline")

  const currentCharData = characteristicEvolution.find(c => c.characteristic === selectedCharacteristic)
  const yearData = currentCharData?.timeline.find(t => t.year === selectedYear)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Market Evolution</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4 text-balance">
            How the Market Has Evolved
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Track how product categories, characteristics, and market dynamics have shifted over time. 
            Understand where we&apos;ve been to see where we&apos;re going.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={view === "timeline" ? "default" : "outline"}
            onClick={() => setView("timeline")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Timeline
          </Button>
          <Button
            variant={view === "characteristics" ? "default" : "outline"}
            onClick={() => setView("characteristics")}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Characteristics
          </Button>
          <Button
            variant={view === "categories" ? "default" : "outline"}
            onClick={() => setView("categories")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Category Growth
          </Button>
        </div>

        {/* Timeline View */}
        {view === "timeline" && (
          <div className="space-y-8">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">Market Milestones</h2>
              
              {/* Year selector */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
                      selectedYear === year
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                
                <div className="space-y-6">
                  {milestones
                    .filter(m => m.year === selectedYear)
                    .map((milestone, i) => (
                      <div key={i} className="relative pl-10">
                        <div className={cn(
                          "absolute left-2 top-2 w-4 h-4 rounded-full border-2 bg-background",
                          milestone.impact === "critical" && "border-red-500 bg-red-500/20",
                          milestone.impact === "high" && "border-primary bg-primary/20",
                          milestone.impact === "medium" && "border-yellow-500 bg-yellow-500/20",
                          milestone.impact === "low" && "border-muted-foreground bg-muted"
                        )} />
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {milestone.month} {milestone.year}
                                </span>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  milestone.impact === "critical" && "bg-red-500/20 text-red-600",
                                  milestone.impact === "high" && "bg-primary/20 text-primary",
                                  milestone.impact === "medium" && "bg-yellow-500/20 text-yellow-600",
                                  milestone.impact === "low" && "bg-muted text-muted-foreground"
                                )}>
                                  {milestone.impact} impact
                                </span>
                              </div>
                              <h3 className="font-serif text-xl mb-1">{milestone.event}</h3>
                              <p className="text-muted-foreground">{milestone.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Products from that year */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl">Products Launched in {selectedYear}</h2>
                <Link 
                  href={`/products?year=${selectedYear}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products
                  .filter(p => new Date(p.launchDate).getFullYear() === selectedYear)
                  .slice(0, 6)
                  .map(product => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">
                          {product.name[0]}
                        </div>
                        <div>
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(product.launchDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.tagline}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Characteristics View */}
        {view === "characteristics" && (
          <div className="space-y-8">
            {/* Characteristic selector */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">Explore:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedCharacteristic}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {characteristicEvolution.map(c => (
                    <DropdownMenuItem 
                      key={c.characteristic}
                      onClick={() => setSelectedCharacteristic(c.characteristic)}
                    >
                      {c.characteristic}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Evolution visualization */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">
                How {selectedCharacteristic} Has Changed
              </h2>

              {/* Year bars */}
              <div className="space-y-4">
                {currentCharData?.timeline.map((yearEntry, i) => (
                  <button
                    key={yearEntry.year}
                    onClick={() => setSelectedYear(yearEntry.year)}
                    className={cn(
                      "w-full text-left transition-all",
                      selectedYear === yearEntry.year && "scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-lg border-2 transition-colors",
                      selectedYear === yearEntry.year 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium">{yearEntry.year}</span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium">
                            {yearEntry.dominant}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {yearEntry.percentage}% of products
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${yearEntry.percentage}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {yearEntry.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-characteristic comparison */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">
                {selectedYear} Snapshot: All Characteristics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characteristicEvolution.map(char => {
                  const data = char.timeline.find(t => t.year === selectedYear)
                  if (!data) return null
                  
                  return (
                    <div 
                      key={char.characteristic}
                      className="p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{char.characteristic}</span>
                        <span className="text-sm font-medium">{data.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-primary whitespace-nowrap">
                          {data.dominant}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Category Growth View */}
        {view === "categories" && (
          <div className="space-y-8">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">Category Growth Over Time</h2>
              
              <div className="space-y-6">
                {categoryGrowthData.map(cat => {
                  const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                  const maxProducts = Math.max(...Object.values(cat.years))
                  const growth = ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100).toFixed(0)
                  
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-3">
                        <Link 
                          href={`/categories/${cat.category}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span className="text-xl">{info?.icon}</span>
                          <span className="font-medium">{info?.name || cat.category}</span>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "flex items-center gap-1 text-sm",
                            Number(growth) > 100 ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {Number(growth) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {growth}% since 2020
                          </span>
                        </div>
                      </div>
                      
                      {/* Year-by-year bars */}
                      <div className="flex items-end gap-1 h-16">
                        {years.map(year => {
                          const count = cat.years[year as keyof typeof cat.years]
                          const height = (count / maxProducts) * 100
                          
                          return (
                            <div key={year} className="flex-1 flex flex-col items-center">
                              <div 
                                className={cn(
                                  "w-full rounded-t transition-all",
                                  year === 2025 ? "bg-primary" : "bg-primary/40"
                                )}
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[10px] text-muted-foreground mt-1">{year}</span>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{cat.years[2020]} products</span>
                        <span>{cat.years[2025]} products</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rising vs Falling Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h2 className="font-serif text-xl">Fastest Growing</h2>
                </div>
                <div className="space-y-3">
                  {categoryGrowthData
                    .map(cat => ({
                      ...cat,
                      growth: ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100)
                    }))
                    .sort((a, b) => b.growth - a.growth)
                    .slice(0, 3)
                    .map((cat, i) => {
                      const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-lg font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <span className="text-xl">{info?.icon}</span>
                          <span className="flex-1">{info?.name}</span>
                          <span className="text-green-600 font-medium">
                            +{cat.growth.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-serif text-xl">Mature Categories</h2>
                </div>
                <div className="space-y-3">
                  {categoryGrowthData
                    .map(cat => ({
                      ...cat,
                      growth: ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100)
                    }))
                    .sort((a, b) => a.growth - b.growth)
                    .slice(0, 3)
                    .map((cat, i) => {
                      const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-lg font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <span className="text-xl">{info?.icon}</span>
                          <span className="flex-1">{info?.name}</span>
                          <span className="text-muted-foreground font-medium">
                            +{cat.growth.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
