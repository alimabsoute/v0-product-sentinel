"use client"

import { useState } from "react"
import Link from "next/link"
import { Bookmark, TrendingUp, Clock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/mock-data"

interface ProfileTabsProps {
  savedProducts: Product[]
  userId: string
}

export function ProfileTabs({ savedProducts, userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("saved")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-secondary/50">
        <TabsTrigger value="saved" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Saved
          {savedProducts.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {savedProducts.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="alerts" className="gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="saved" className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Saved Products</h2>
        </div>

        {savedProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Bookmark className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No saved products yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Bookmark products you want to keep an eye on.
            </p>
            <Button asChild>
              <Link href="/products">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="alerts" className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl mb-1">Buzz Alerts</h2>
            <p className="text-muted-foreground">
              Get notified when products you follow have significant buzz changes.
            </p>
          </div>
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
  )
}
