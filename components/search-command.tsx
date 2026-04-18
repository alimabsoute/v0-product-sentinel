'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, BookOpen } from 'lucide-react'
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
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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

  // Load default results when dialog opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/products/search?minimal=true&limit=5')
      .then((r) => r.json())
      .then((data) => setResults(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // Debounced search as user types
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!search.trim()) {
      // Reset to default when cleared
      fetch('/api/products/search?minimal=true&limit=5')
        .then((r) => r.json())
        .then((data) => setResults(data.products ?? []))
        .catch(() => {})
      return
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ q: search.trim(), minimal: 'true', limit: '8' })
      fetch(`/api/products/search?${params}`)
        .then((r) => r.json())
        .then((data) => setResults(data.products ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch('')
      setResults([])
    }
  }, [open])

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
        <CommandEmpty>{loading ? 'Searching…' : 'No results found.'}</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Products">
            {results.map((product) => (
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

        {search.trim() && results.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => handleSelect(`/products?q=${encodeURIComponent(search.trim())}`)}>
                <Search className="mr-2 h-4 w-4" />
                Search all for &quot;{search.trim()}&quot;
              </CommandItem>
            </CommandGroup>
          </>
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
