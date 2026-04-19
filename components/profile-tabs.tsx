"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, Activity, List, Send, Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/mock-data"
import type { Collection } from "@/lib/db/collections"

interface ProfileTabsProps {
  savedProducts: Product[]
  collections: Collection[]
  submissions: Array<{
    id: string
    slug: string
    name: string
    logo_url: string | null
    category: string
    status: string
    created_at: string
  }>
  userId: string
}

export function ProfileTabs({ savedProducts, collections: initialCollections, submissions, userId }: ProfileTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("saved")
  const [collections, setCollections] = useState(initialCollections)

  // Inline create form state
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [createLoading, setCreateLoading] = useState(false)

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreateLoading(true)
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), is_public: true }),
      })
      if (res.ok) {
        const { collection } = await res.json()
        setCollections((prev) => [collection, ...prev])
        setNewName("")
        setCreating(false)
        router.refresh()
      }
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDeleteCollection(id: string) {
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    }
  }

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
        <TabsTrigger value="collections" className="gap-2">
          <List className="h-4 w-4" />
          Collections
          {collections.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {collections.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="submitted" className="gap-2">
          <Send className="h-4 w-4" />
          Submitted
          {submissions.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {submissions.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="activity" className="gap-2">
          <Activity className="h-4 w-4" />
          Activity
        </TabsTrigger>
      </TabsList>

      {/* ── Saved ─────────────────────────────────────────────────────────── */}
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

      {/* ── Collections ───────────────────────────────────────────────────── */}
      <TabsContent value="collections" className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Collections</h2>
          {!creating && (
            <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          )}
        </div>

        {/* Inline create form */}
        {creating && (
          <div className="mb-6 rounded-xl border bg-secondary/30 p-4">
            <form onSubmit={handleCreateCollection} className="flex items-center gap-3">
              <Input
                autoFocus
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
                maxLength={80}
              />
              <Button type="submit" size="sm" disabled={createLoading || !newName.trim()}>
                {createLoading ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setCreating(false); setNewName("") }}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {collections.length === 0 && !creating ? (
          <div className="py-16 text-center">
            <List className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No collections yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first list to organize products.
            </p>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{col.name}</span>
                    {col.product_count !== undefined && (
                      <Badge variant="secondary" className="shrink-0">
                        {col.product_count} {col.product_count === 1 ? "product" : "products"}
                      </Badge>
                    )}
                    {col.is_public && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                  {col.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{col.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/lists/${col.id}`}>View</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCollection(col.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Submitted ─────────────────────────────────────────────────────── */}
      <TabsContent value="submitted" className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Submitted Products</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="py-16 text-center">
            <Send className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Submit a product to get it listed on Prism.
            </p>
            <Button asChild>
              <Link href="/submit">Submit a Product</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-4 rounded-xl border bg-card px-5 py-3 hover:bg-secondary/30 transition-colors"
              >
                {/* Logo */}
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {sub.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sub.logo_url} alt={sub.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {sub.name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.category}</p>
                </div>

                <Badge
                  variant={sub.status === "active" ? "default" : "secondary"}
                  className={
                    sub.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-0"
                      : sub.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0"
                        : ""
                  }
                >
                  {sub.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Activity ──────────────────────────────────────────────────────── */}
      <TabsContent value="activity" className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Activity</h2>
        </div>
        <div className="py-16 text-center">
          <Activity className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Activity feed coming soon</h3>
          <p className="text-sm text-muted-foreground">
            Your saves, comments, and upvotes will appear here.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  )
}
