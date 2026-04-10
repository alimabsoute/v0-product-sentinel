import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BRAND, BRAND_COPYRIGHT } from '@/lib/branding'

const footerLinks = {
  product: [
    { label: 'Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'Explore Graph', href: '/explore' },
    { label: 'Graveyard', href: '/graveyard' },
  ],
  insights: [
    { label: 'All Articles', href: '/insights' },
    { label: 'Market Analysis', href: '/insights?category=market-analysis' },
    { label: 'Comparisons', href: '/insights?category=comparison' },
    { label: 'Trend Reports', href: '/insights?category=trend-report' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Submit a Product', href: '/submit' },
    { label: 'Advertise', href: '/advertise' },
    { label: 'API', href: '/api-docs' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-b from-background to-secondary/20">
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25">
                <span className="font-serif text-lg font-bold text-primary-foreground">{BRAND.initial}</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight">{BRAND.name}</span>
            </Link>
            
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Track the hottest products with real-time social buzz monitoring. 
              Discover what the internet is talking about.
            </p>

            {/* Newsletter */}
            <div className="mt-6 glass rounded-2xl p-4">
              <h3 className="text-sm font-medium">Stay updated</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Weekly digest of trending products and market insights.
              </p>
              <form className="mt-3 flex gap-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="max-w-[220px] rounded-xl"
                />
                <Button type="submit" size="sm" className="rounded-xl px-4">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium">Discover</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.product.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Insights</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.insights.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {BRAND_COPYRIGHT}
          </p>
          <div className="flex gap-4">
            {footerLinks.legal.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
