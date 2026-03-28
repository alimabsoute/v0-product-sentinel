'use client'

import { cn } from '@/lib/utils'
import { categories, type Category } from '@/lib/mock-data'

interface CategoryFilterProps {
  selected: Category
  onSelect: (category: Category) => void
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
            selected === category
              ? 'text-[var(--sentinel-accent)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {selected === category && (
            <span className="absolute inset-0 rounded-full bg-[var(--sentinel-accent)]/10 ring-1 ring-[var(--sentinel-accent)]/30" />
          )}
          <span className="relative">{category}</span>
        </button>
      ))}
    </div>
  )
}
