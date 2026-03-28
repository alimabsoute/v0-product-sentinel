'use client'

import { useState, useEffect } from 'react'
import { Search, Command, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onSearch: (query: string) => void
  onOpenSearch: () => void
}

export function Header({ onSearch, onOpenSearch }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-[var(--sentinel-accent)] opacity-20 blur-sm" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--sentinel-accent)] to-[var(--sentinel-accent-dim)]">
                <TrendingUp className="h-5 w-5 text-background" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Product Sentinel
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Track the Buzz
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <button
            onClick={onOpenSearch}
            className={cn(
              'group flex h-10 flex-1 max-w-md items-center gap-3 rounded-xl px-4',
              'bg-secondary/50 border border-border/50',
              'transition-all duration-200',
              'hover:bg-secondary hover:border-[var(--sentinel-accent)]/30',
              'focus:outline-none focus:ring-2 focus:ring-[var(--sentinel-accent)]/50'
            )}
          >
            <Search className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            <span className="flex-1 text-left text-sm text-muted-foreground">
              Search products...
            </span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--sentinel-rising)]" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
