'use client'

import { useMemo } from 'react'
import { ProductRow } from './product-row'
import type { Product, Category } from '@/lib/mock-data'

interface ProductListProps {
  products: Product[]
  category: Category
  searchQuery: string
  onProductClick: (product: Product) => void
}

export function ProductList({
  products,
  category,
  searchQuery,
  onProductClick,
}: ProductListProps) {
  const filteredProducts = useMemo(() => {
    let result = products

    // Filter by category
    if (category !== 'All') {
      result = result.filter((p) => p.category === category)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.tagline.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Sort by buzz score
    return result.sort((a, b) => b.buzzScore - a.buzzScore)
  }, [products, category, searchQuery])

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-6xl opacity-20">0</div>
        <h3 className="text-lg font-medium text-foreground">No products found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredProducts.map((product, index) => (
        <ProductRow
          key={product.id}
          product={product}
          index={index}
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  )
}
