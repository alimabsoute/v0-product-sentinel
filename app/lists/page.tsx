import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getPublicCollections, type Collection } from '@/lib/db/collections'

export const revalidate = 3600
export const metadata = { title: 'Community Lists | Prism' }

function CollectionCard({ collection: c }: { collection: Collection }) {
  return (
    <Link
      href={`/lists/${c.id}`}
      className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col gap-3"
    >
      <div className="flex-1">
        <h2 className="font-semibold leading-snug">{c.name}</h2>
        {c.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {c.product_count ?? 0} products
        </span>
        <span className="text-primary font-medium">View →</span>
      </div>
    </Link>
  )
}

export default async function ListsPage() {
  const collections = await getPublicCollections(30)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold">Product Lists</h1>
          <p className="text-muted-foreground mt-1">Curated collections by the Prism community</p>
        </div>
        {collections.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No public lists yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
