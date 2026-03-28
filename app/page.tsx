'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { CategoryFilter } from '@/components/category-filter'
import { ProductList } from '@/components/product-list'
import { Sidebar } from '@/components/sidebar'
import { SearchDialog } from '@/components/search-dialog'
import { ProductPanel } from '@/components/product-panel'
import { products, type Product, type Category } from '@/lib/mock-data'

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sort, setSort] = useState<'buzz' | 'trending' | 'newest' | 'hidden-gems'>('buzz')

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sort products based on selected sort option
  const sortedProducts = [...products].sort((a, b) => {
    switch (sort) {
      case 'buzz':
        return b.buzzScore - a.buzzScore
      case 'trending':
        const trendOrder = { rising: 0, stable: 1, falling: 2 }
        if (trendOrder[a.buzzTrend] !== trendOrder[b.buzzTrend]) {
          return trendOrder[a.buzzTrend] - trendOrder[b.buzzTrend]
        }
        return b.buzzScore - a.buzzScore
      case 'newest':
        return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
      case 'hidden-gems':
        // Products with lower buzz but high potential (verified, active development)
        const aGem = a.verified && a.badges.includes('active-development') ? 1 : 0
        const bGem = b.verified && b.badges.includes('active-development') ? 1 : 0
        if (aGem !== bGem) return bGem - aGem
        return a.buzzScore - b.buzzScore // Lower buzz first for hidden gems
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--sentinel-accent)]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--sentinel-accent)]/3 blur-3xl" />
      </div>

      <Header
        onSearch={setSearchQuery}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Hero section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Track the{' '}
            <span className="bg-gradient-to-r from-[var(--sentinel-accent)] to-[var(--sentinel-rising)] bg-clip-text text-transparent">
              Buzz
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground text-balance">
            Discover what the internet is talking about. Real-time social signals from Twitter, Reddit, Hacker News, and more.
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-6">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Main content */}
        <div className="flex gap-8">
          {/* Product list */}
          <div className="min-w-0 flex-1">
            <ProductList
              products={sortedProducts}
              category={selectedCategory}
              searchQuery={searchQuery}
              onProductClick={setSelectedProduct}
            />
          </div>

          {/* Sidebar */}
          <Sidebar sort={sort} onSortChange={setSort} />
        </div>
      </main>

      {/* Search dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(product) => {
          setSelectedProduct(product)
          setSearchOpen(false)
        }}
      />

      {/* Product detail panel */}
      <ProductPanel
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
