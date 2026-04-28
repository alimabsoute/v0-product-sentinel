import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { brandTitle } from '@/lib/branding'

export const metadata = { title: brandTitle('Terms of Service') }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground font-mono">Effective date: April 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <p className="text-muted-foreground">
              By accessing or using Launch Sentinel (&quot;the Service&quot;), you agree to these Terms of
              Service. If you don&apos;t agree, please don&apos;t use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              1. Service Description
            </h2>
            <p className="text-muted-foreground">
              Launch Sentinel is a tech product intelligence platform that tracks signal scores,
              press mentions, community activity, and lifecycle data for over 23,000 software
              products. The Service is provided for informational purposes to founders, analysts,
              investors, and developers.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              2. Acceptable Use
            </h2>
            <p className="text-muted-foreground mb-3">
              You agree to use the Service only for lawful purposes. The following are prohibited:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-mono shrink-0">—</span>
                Automated scraping or bulk downloading of product data without prior written permission.
                Our API tier exists for this use case — use it.
              </li>
              <li className="flex gap-2">
                <span className="font-mono shrink-0">—</span>
                Submitting spam, fake products, or products you do not have the right to represent.
              </li>
              <li className="flex gap-2">
                <span className="font-mono shrink-0">—</span>
                Attempting to reverse-engineer, disrupt, or overload the platform or its infrastructure.
              </li>
              <li className="flex gap-2">
                <span className="font-mono shrink-0">—</span>
                Using the Service to collect personal data about other users.
              </li>
              <li className="flex gap-2">
                <span className="font-mono shrink-0">—</span>
                Impersonating another user, company, or person.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              We reserve the right to suspend or terminate any account that violates these terms
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              3. Content and Data Ownership
            </h2>
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200">
              {[
                {
                  label: 'Your submitted content',
                  desc: 'Product submissions, comments, and list curation you create remain yours. By submitting content, you grant Launch Sentinel a non-exclusive, royalty-free license to display and distribute it as part of the platform.',
                },
                {
                  label: 'Platform data',
                  desc: 'Signal scores, aggregated metrics, press mention indexing, death model outputs, and the product database are owned by Launch Sentinel. You may not reproduce or redistribute this data without permission.',
                },
                {
                  label: 'Third-party data',
                  desc: 'Some data (e.g., GitHub stars, Product Hunt vote counts) is sourced from third parties. We display it under fair use; their respective terms apply.',
                },
              ].map(({ label, desc }) => (
                <div key={label} className="px-4 py-3">
                  <div className="font-mono text-xs text-foreground mb-1">{label}</div>
                  <div className="text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              4. Signal Scores and Disclaimers
            </h2>
            <p className="text-muted-foreground mb-3">
              Signal scores are algorithmic estimates computed from publicly available data — press
              velocity, GitHub activity, community mentions, and vote counts. They are updated daily
              and reflect current data availability.
            </p>
            <p className="text-muted-foreground mb-3">
              Signal scores are <strong className="text-foreground font-medium">not financial advice</strong>,
              investment recommendations, or valuations. They do not reflect private funding
              status, revenue, or any non-public information.
            </p>
            <p className="text-muted-foreground">
              Death detection flags are similarly algorithmic. A &quot;dead&quot; flag means signal has
              decayed below threshold for 90+ days — it does not constitute a formal business
              assessment. Companies or founders who believe a flag is in error may contact us for
              review.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              5. Account Termination
            </h2>
            <p className="text-muted-foreground mb-2">
              You may delete your account at any time from your profile settings. We may suspend
              or terminate accounts for:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>Violation of these Terms</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>Prolonged inactivity (accounts inactive for more than 24 months)</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>Activity that harms other users or the platform</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              On termination, your submitted content may be retained as part of the historical
              product record, but your personal account data will be deleted per our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground mb-3">
              The Service is provided &quot;as is&quot; without warranty of any kind, express or implied.
              We do not guarantee uptime, data accuracy, or completeness of the product database.
            </p>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Launch Sentinel and its operators shall not
              be liable for any indirect, incidental, special, or consequential damages arising
              from your use of or inability to use the Service — including but not limited to
              reliance on signal scores for investment or business decisions.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              7. Changes to These Terms
            </h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. We will notify registered users by
              email when changes are material. Continued use of the Service after the effective
              date of updated Terms constitutes your acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              8. Contact
            </h2>
            <p className="text-muted-foreground">
              Legal questions and notices:{' '}
              <a href="mailto:legal@launchsentinel.com" className="text-foreground underline underline-offset-2">
                legal@launchsentinel.com
              </a>
            </p>
          </section>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
