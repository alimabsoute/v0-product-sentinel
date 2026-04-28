import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { brandTitle } from '@/lib/branding'

export const metadata = { title: brandTitle('About') }

const stats = [
  { value: '23,420+', label: 'Products tracked' },
  { value: '18', label: 'Categories' },
  { value: '337K+', label: 'Signal readings' },
  { value: 'Daily', label: 'Update frequency' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Company</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight mb-4">
            About Launch Sentinel
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            We track the full lifecycle of tech products — from launch buzz to signal decay
            to digital death — so founders, analysts, and investors don&apos;t have to.
          </p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4 border border-zinc-200 rounded-md overflow-hidden mb-12">
          {stats.map((s) => (
            <div key={s.label} className="bg-background px-5 py-4">
              <div className="font-mono text-xl font-semibold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-12">

          {/* What We Track */}
          <section>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              What We Track
            </h2>
            <p className="text-sm leading-relaxed text-foreground mb-4">
              Launch Sentinel monitors over 23,420 tech products across every major launch channel
              and community signal — continuously, not just at launch day.
            </p>
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200">
              {[
                ['Product Hunt', 'Launch votes, comments, and maker activity'],
                ['Hacker News', 'Show HN posts, discussion threads, sentiment'],
                ['GitHub', 'Stars, forks, commit velocity, contributor growth'],
                ['Reddit', 'Mentions across relevant subreddits'],
                ['Press', 'News coverage from tech publications and blogs'],
                ['10+ sources total', 'Aggregated into a single 0–100 signal score'],
              ].map(([source, desc]) => (
                <div key={source} className="flex gap-4 px-4 py-3">
                  <span className="font-mono text-xs text-foreground w-40 shrink-0 pt-0.5">{source}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Why We Built This */}
          <section>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Why We Built This
            </h2>
            <p className="text-sm leading-relaxed text-foreground mb-3">
              Product Hunt shows launches — but not what happens six months later. Bloomberg covers
              public markets — but not early-stage products. There was no tool that tracked both
              the momentum of a new launch and the long-term signal decay (or growth) that followed.
            </p>
            <p className="text-sm leading-relaxed text-foreground mb-3">
              We built Launch Sentinel to fill that gap. The goal is a Bloomberg Terminal for the
              product layer: dense, precise, and updated continuously.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Whether you&apos;re a founder sizing a market, an analyst tracking a category, or an
              investor doing due diligence on a team&apos;s traction history — Launch Sentinel gives you
              the signal that matters.
            </p>
          </section>

          {/* Data Methodology */}
          <section>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Data Methodology
            </h2>
            <p className="text-sm leading-relaxed text-foreground mb-4">
              Every product on Launch Sentinel is assigned a signal score — a single number from
              0 to 100 — updated daily.
            </p>
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200 mb-4">
              {[
                ['Signal Score (0–100)', 'Composite of press velocity, GitHub star growth, HN/Reddit mention frequency, and upvote momentum — normalized and weighted by recency.'],
                ['Score History', 'Full time-series history stored per product. Score charts show trajectory, not just current state.'],
                ['Death Detection', 'A product is flagged as "dead" when its signal score drops below threshold and remains there for 90+ consecutive days. Confirmed with secondary checks against GitHub activity and domain status.'],
                ['Update Frequency', 'Signal scores recomputed daily. Press and social mentions ingested hourly. GitHub snapshots taken daily at 04:00 UTC.'],
              ].map(([label, desc]) => (
                <div key={label} className="px-4 py-3">
                  <div className="font-mono text-xs text-foreground mb-1">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Signal scores are algorithmic estimates derived from public data. They are not
              financial advice and do not reflect private funding status or revenue.
            </p>
          </section>

          {/* Team */}
          <section>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Team
            </h2>
            <p className="text-sm leading-relaxed text-foreground">
              Built by a small team passionate about product intelligence. We believe the best
              tools for understanding tech markets are still being built — and this is our
              contribution to that stack.
            </p>
          </section>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
