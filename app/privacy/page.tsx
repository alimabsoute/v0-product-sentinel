import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { brandTitle } from '@/lib/branding'

export const metadata = { title: brandTitle('Privacy Policy') }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground font-mono">Effective date: April 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <p className="text-muted-foreground">
              Launch Sentinel is operated by Launch Sentinel Inc. This policy explains what data
              we collect, why we collect it, and how we handle it. We&apos;ve written it to be
              readable — not to hide anything in legal boilerplate.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              1. What We Collect
            </h2>
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200">
              {[
                {
                  label: 'Account data',
                  desc: 'Your email address, collected when you create an account or subscribe to our newsletter. We do not collect a name unless you volunteer it.',
                },
                {
                  label: 'Usage data',
                  desc: 'Anonymous analytics — pages visited, session duration, general geographic region (country/city). No persistent identifiers tied to individuals.',
                },
                {
                  label: 'Product submissions',
                  desc: 'If you submit a product via the Submit form, we store the product name, URL, category, and your user ID.',
                },
                {
                  label: 'Watchlist & collections',
                  desc: 'Products you save or list, stored under your user ID.',
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
              2. How We Use It
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>To provide the service: showing your watchlist, personalized product views, and submitted content.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>To send our weekly newsletter, if you opted in. You can unsubscribe at any time via the link in each email.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>To improve the product: anonymous usage analytics help us understand which features are working.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span>To detect abuse: spam submissions, scraping, or account misuse.</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              We do not use your data for advertising targeting, sell it to third parties, or use
              it to train AI models.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              3. Data Sharing
            </h2>
            <p className="text-muted-foreground mb-3">
              We do not sell your data. We share it only with the infrastructure providers
              necessary to run the service:
            </p>
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200">
              {[
                ['Supabase', 'Database and authentication processor. Data hosted on AWS in the US-East-1 region.'],
                ['Vercel', 'Hosting and edge network. Standard Vercel privacy terms apply.'],
              ].map(([vendor, desc]) => (
                <div key={vendor} className="flex gap-4 px-4 py-3">
                  <span className="font-mono text-xs text-foreground w-24 shrink-0 pt-0.5">{vendor}</span>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-muted-foreground">
              Both providers act as data processors under GDPR — they process data on our behalf
              and are bound by their own data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              4. Cookies
            </h2>
            <p className="text-muted-foreground mb-2">
              We use one category of cookies:
            </p>
            <div className="border border-zinc-200 rounded-md px-4 py-3">
              <div className="font-mono text-xs text-foreground mb-1">Analytics cookies (anonymous)</div>
              <div className="text-muted-foreground">
                Used to count page views and sessions. No persistent identifiers. No cross-site tracking.
                We do not use advertising or tracking cookies.
              </div>
            </div>
            <p className="mt-3 text-muted-foreground">
              Your browser can block or delete cookies without affecting core functionality.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              5. Your GDPR Rights
            </h2>
            <p className="text-muted-foreground mb-3">
              If you are in the EEA, UK, or Switzerland, you have the following rights under GDPR:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span><strong className="text-foreground font-medium">Access</strong>: request a copy of the personal data we hold about you.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span><strong className="text-foreground font-medium">Rectification</strong>: ask us to correct inaccurate data.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span><strong className="text-foreground font-medium">Erasure</strong>: ask us to delete your account and associated data. We will comply within 30 days.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span><strong className="text-foreground font-medium">Portability</strong>: request your data in a machine-readable format.</li>
              <li className="flex gap-2"><span className="font-mono shrink-0">—</span><strong className="text-foreground font-medium">Objection</strong>: opt out of analytics or newsletter processing at any time.</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              To exercise any of these rights, email{' '}
              <a href="mailto:privacy@launchsentinel.com" className="text-foreground underline underline-offset-2">
                privacy@launchsentinel.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              6. Data Retention
            </h2>
            <p className="text-muted-foreground">
              Account data is retained until you delete your account. Anonymous analytics data is
              retained for 24 months and then purged. Product submissions are retained indefinitely
              as part of the platform data.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-3">
              7. Contact
            </h2>
            <p className="text-muted-foreground">
              Privacy questions and requests:{' '}
              <a href="mailto:privacy@launchsentinel.com" className="text-foreground underline underline-offset-2">
                privacy@launchsentinel.com
              </a>
            </p>
          </section>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
