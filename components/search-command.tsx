'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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

type ProductResult = {
  id: string
  slug: string
  name: string
  tagline: string
  logo: string
  category: string
}

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [allProducts, setAllProducts] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)

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

  // Load products once when dialog opens
  useEffect(() => {
    if (!open || allProducts.length > 0) return
    setLoading(true)
    fetch('/api/products/search')
      .then((r) => r.json())
      .then((data) => setAllProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, allProducts.length])

  const filteredProducts = useMemo(() => {
    if (!search) return allProducts.slice(0, 5)
    const q = search.toLowerCase()
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [search, allProducts])

  const handleSelect = useCallback(
    (value: string) => {
      onOpenChange(false)
      setSearch('')
      router.push(value)
    },
    [onOpenChange, router],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search products, categories..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Loading…' : 'No results found.'}</CommandEmpty>

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
              </CommandItem>
            ))}
          </CommandGroup>
        )}

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
      </CommandList>
    </CommandDialog>
  )
}
