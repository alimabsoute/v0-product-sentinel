"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
// Profile page is a placeholder until auth lands — use empty product stubs
const products: never[] = []
import { 
  Settings, 
  Bookmark, 
  Clock, 
  TrendingUp,
  Bell,
  Edit,
  ExternalLink,
  Calendar,
  MapPin,
  LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Mock user data
const mockUser = {
  name: "Alex Thompson",
  email: "alex@example.com",
  avatar: null,
  bio: "Product enthusiast. Always on the lookout for the next big thing.",
  location: "San Francisco, CA",
  website: "https://alexthompson.dev",
  joinedDate: "2024-03-15",
  stats: {
    saved: 24,
    upvoted: 156,
    collections: 5,
    following: 12
  }
}

// Mock saved/upvoted products
const savedProducts = products.slice(0, 6)
const upvotedProducts = products.slice(3, 9)
const recentlyViewed = products.slice(6, 12)

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("saved")

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-serif text-primary">
              {mockUser.name[0]}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl mb-1">{mockUser.name}</h1>
                <p className="text-muted-foreground mb-3">{mockUser.bio}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {mockUser.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {mockUser.location}
                    </span>
                  )}
                  {mockUser.website && (
                    <a 
                      href={mockUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      {mockUser.website.replace("https://", "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(mockUser.joinedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-serif">{mockUser.stats.saved}</div>
                <div className="text-xs text-muted-foreground">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif">{mockUser.stats.upvoted}</div>
                <div className="text-xs text-muted-foreground">Upvoted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif">{mockUser.stats.collections}</div>
                <div className="text-xs text-muted-foreground">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif">{mockUser.stats.following}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="upvoted" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Upvoted
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">Saved Products</h2>
              <Button variant="outline" size="sm">
                Create Collection
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upvoted" className="mt-6">
            <h2 className="font-serif text-2xl mb-6">Products You&apos;ve Upvoted</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upvotedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <h2 className="font-serif text-2xl mb-6">Recently Viewed</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyViewed.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl mb-1">Buzz Alerts</h2>
                <p className="text-muted-foreground">
                  Get notified when products you follow have significant buzz changes.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure Alerts
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Alert items — empty until auth+saved products land */}
              {([] as { product: null; type: string; change: string; time: string }[]).map((alert, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-4 bg-card border rounded-xl"
                >
                  <img
                    src={alert.product.logo}
                    alt={alert.product.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.product.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {alert.type === "spike" && "Buzz Spike"}
                        {alert.type === "milestone" && "Milestone"}
                        {alert.type === "news" && "News"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.change}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{alert.time}</div>
                  <Link href={`/products/${alert.product.slug}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 p-6 bg-secondary/50 rounded-xl text-center">
              <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">Track More Products</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save products to get alerts when their buzz score changes significantly.
              </p>
              <Button asChild>
                <Link href="/products">Explore Products</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  )
}
