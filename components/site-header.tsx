'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Menu, X, User, Bookmark, Bell, LogOut } from 'lucide-react'
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
import { BRAND } from '@/lib/branding'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/products',  label: 'Products'  },
  { href: '/markets',   label: 'Markets'   },
  { href: '/trending',  label: 'Trending'  },
  { href: '/explore',   label: 'Explore'   },
  { href: '/insights',  label: 'Insights'  },
  { href: '/evolution', label: 'Evolution' },
  { href: '/graveyard', label: 'Graveyard' },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)

    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
  }

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
              <span className="font-serif text-lg font-bold text-primary-foreground">{BRAND.initial}</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
            </div>
            <span className="hidden font-serif text-xl font-semibold tracking-tight sm:inline-block">
              {BRAND.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((item, i) => (
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
                    {user
                      ? <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{user.email?.[0].toUpperCase()}</div>
                      : <User className="h-4 w-4" />
                    }
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 glass rounded-xl">
                  {user ? (
                    <>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="w-full">My Watchlist</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/api/docs" className="w-full">API Docs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="w-full">Sign in</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/signup" className="w-full">Create account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/api/docs" className="w-full">API Docs</Link>
                      </DropdownMenuItem>
                    </>
                  )}
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
              {NAV_LINKS.map((item) => (
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
              {user ? (
                <>
                  <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <Link href="/profile" className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5" onClick={() => setMobileMenuOpen(false)}>
                    My Watchlist
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false) }} className="rounded-xl px-3 py-2.5 text-sm font-medium text-destructive text-left transition-colors hover:bg-primary/5">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/signup" className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5" onClick={() => setMobileMenuOpen(false)}>
                    Create account
                  </Link>
                </>
              )}
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
