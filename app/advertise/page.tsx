import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { brandTitle } from '@/lib/branding'

export const metadata = { title: brandTitle('Advertise') }

const tiers = [
  {
    name: 'Featured Product',
    price: '$249',
    period: '/month',
    tagline: 'Best for: early-stage launches',
    description:
      'Promoted placement in the "Featured" section on the homepage and category pages. Includes your logo, tagline, and direct link.',
    features: [
      'Homepage featured slot',
      'Category page placement',
      'Logo + tagline + link',
      'Monthly performance report',
    ],
  },
  {
    name: 'Newsletter Sponsor',
    price: '$499',
    period: '/month',
    tagline: 'Best for: developer tools, analytics platforms',
    description:
      'Sole sponsor of the weekly Launch Sentinel digest — sent to an estimated 2,000 active subscribers. One placement per issue: headline, description, and CTA.',
    features: [
      'Exclusive weekly newsletter slot',
      'Est. 2,000 subscribers',
      'Headline + description + CTA',
      'Monthly performance report',
    ],
    highlighted: true,
  },
  {
    name: 'Data Package',
    price: '$1,499',
    period: '/month',
    tagline: 'Best for: research firms, VCs, competitive intelligence',
    description:
      'Full CSV export of the Launch Sentinel product database, REST API access, and complete signal score history. Custom queries available on request.',
    features: [
      'Full database CSV export',
      'REST API access',
      'Signal score history',
      'Custom queries on request',
      'Monthly performance report',
    ],
  },
]

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Advertise</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight mb-4">
            Reach 10,000+ Founders &amp; Analysts
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Launch Sentinel readers are product builders, VCs, and tech analysts — your ideal
            early adopters. Our audience skews technical, decision-maker, and acquisition-ready.
          </p>
        </div>

        {/* Audience stats */}
        <div className="grid grid-cols-3 gap-px border border-zinc-200 rounded-md overflow-hidden mb-14">
          {[
            ['10,000+', 'Monthly readers'],
            ['2,000+', 'Newsletter subscribers'],
            ['23,420+', 'Products indexed'],
          ].map(([val, label]) => (
            <div key={label} className="bg-background px-5 py-4">
              <div className="font-mono text-xl font-semibold tabular-nums">{val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tier cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-md p-6 flex flex-col ${
                tier.highlighted
                  ? 'border-foreground'
                  : 'border-zinc-200'
              }`}
            >
              {tier.highlighted && (
                <div className="mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest bg-foreground text-background px-2 py-0.5 rounded">
                    Most Popular
                  </span>
                </div>
              )}
              <h2 className="font-serif text-lg font-semibold mb-1">{tier.name}</h2>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="font-mono text-2xl font-semibold tabular-nums">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-4">{tier.tagline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                {tier.description}
              </p>
              <ul className="space-y-1.5 border-t border-zinc-200 pt-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-foreground mt-0.5 shrink-0">—</span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="border border-zinc-200 rounded-md p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-1">Ready to get started?</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Email us to discuss packages, timing, and custom arrangements. We respond within
              one business day.
            </p>
          </div>
          <a
            href="mailto:advertise@launchsentinel.com?subject=Advertising%20Inquiry"
            className="inline-block shrink-0 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Get in touch
          </a>
        </div>

        {/* Fine print */}
        <p className="text-xs text-muted-foreground mt-6">
          All packages include monthly reporting. Rates are introductory — locked in for your
          first 3 months. Minimum commitment: 1 month.
        </p>

      </main>
      <SiteFooter />
    </div>
  )
}
