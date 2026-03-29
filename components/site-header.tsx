'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Menu, X, User, Bookmark, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchCommand } from './search-command'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header 
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl transition-all duration-500",
          scrolled 
            ? "glass shadow-lg shadow-black/5 rounded-2xl" 
            : "bg-transparent",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link 
            href="/" 
            className={cn(
              "flex items-center gap-2.5 transition-all duration-300",
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25">
              <span className="font-serif text-lg font-bold text-primary-foreground">S</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
            </div>
            <span className="hidden font-serif text-xl font-semibold tracking-tight sm:inline-block">
              Sentinel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: '/products', label: 'Products' },
              { href: '/explore', label: 'Explore' },
              { href: '/insights', label: 'Insights' },
              { href: '/evolution', label: 'Evolution' },
              { href: '/graveyard', label: 'Graveyard' },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground",
                  "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:rounded-full after:transition-all after:duration-300",
                  "hover:after:w-4",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                )}
                style={{ transitionDelay: `${150 + i * 50}ms` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div 
            className={cn(
              "flex items-center gap-1 transition-all duration-300",
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            )}
            style={{ transitionDelay: '400ms' }}
          >
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:text-foreground hover:bg-primary/5"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Desktop User Menu */}
            <div className="hidden items-center gap-1 md:flex">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:text-foreground hover:bg-primary/5"
              >
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:text-foreground hover:bg-primary/5"
              >
                <Bookmark className="h-4 w-4" />
                <span className="sr-only">Saved</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:text-foreground hover:bg-primary/5"
                  >
                    <User className="h-4 w-4" />
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass rounded-xl">
                  <DropdownMenuItem>
                    <Link href="/login" className="w-full">Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/signup" className="w-full">Create account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/submit" className="w-full">Submit a product</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 md:hidden animate-fade-in-up">
            <nav className="flex flex-col gap-1 p-3">
              {[
                { href: '/products', label: 'Products' },
                { href: '/explore', label: 'Explore' },
                { href: '/insights', label: 'Insights' },
                { href: '/evolution', label: 'Evolution' },
                { href: '/graveyard', label: 'Graveyard' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border/50" />
              <Link
                href="/login"
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24" />

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
