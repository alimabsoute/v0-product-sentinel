'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, TrendingUp, Zap, BookOpen } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { products, articles, categories } from '@/lib/mock-data'

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  const filteredProducts = useMemo(() => {
    if (!search) return products.filter(p => p.status === 'active').slice(0, 5)
    return products
      .filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tagline.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
      .slice(0, 8)
  }, [search])

  const filteredArticles = useMemo(() => {
    if (!search) return articles.slice(0, 3)
    return articles
      .filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 3)
  }, [search])

  const filteredCategories = useMemo(() => {
    if (!search) return []
    return categories
      .filter(c => c !== 'All' && c.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 4)
  }, [search])

  const handleSelect = (value: string) => {
    onOpenChange(false)
    setSearch('')
    router.push(value)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search products, articles, categories..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredProducts.length > 0 && (
          <CommandGroup heading="Products">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={`product-${product.id}`}
                onSelect={() => handleSelect(`/products/${product.slug}`)}
                className="flex items-center gap-3"
              >
                <img
                  src={product.logo}
                  alt={product.name}
                  className="h-8 w-8 rounded-md object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {product.tagline}
                  </span>
                </div>
                {product.buzz.trend === 'rising' && (
                  <TrendingUp className="h-4 w-4 text-[var(--sentinel-rising)]" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredArticles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Insights">
              {filteredArticles.map((article) => (
                <CommandItem
                  key={article.id}
                  value={`article-${article.id}`}
                  onSelect={() => handleSelect(`/insights/${article.slug}`)}
                  className="flex items-center gap-3"
                >
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{article.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {article.readTime} min read
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredCategories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Categories">
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category}
                  value={`category-${category}`}
                  onSelect={() => handleSelect(`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="flex items-center gap-3"
                >
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <span>{category}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => handleSelect('/products')}>
                <Search className="mr-2 h-4 w-4" />
                Browse all products
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/explore')}>
                <Zap className="mr-2 h-4 w-4" />
                Explore the graph
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/insights')}>
                <BookOpen className="mr-2 h-4 w-4" />
                Read latest insights
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
