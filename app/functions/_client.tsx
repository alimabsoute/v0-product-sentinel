'use client'

import Link from 'next/link'
import type { TagGroupData } from '@/lib/db/tags'

const GROUP_LABELS: Record<string, string> = {
  audience: 'Audience',
  capability: 'Capabilities',
  business_model: 'Business Models',
  pricing_model: 'Pricing',
  deployment: 'Deployment',
  data_format: 'Data Formats',
  compliance: 'Compliance',
  integration: 'Integrations',
}

function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface FunctionsClientProps {
  tagGroups: TagGroupData[]
}

export function FunctionsClient({ tagGroups }: FunctionsClientProps) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold">Functions</h1>
        <p className="mt-2 text-muted-foreground">
          Browse products by capability, audience, pricing model, and more.
        </p>
      </div>

      {tagGroups.map(group => (
        <section key={group.group}>
          <h2 className="font-serif text-xl font-semibold mb-4">{groupLabel(group.group)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {group.tags.map(tag => (
              <Link key={tag.slug} href={`/products?tags=${tag.slug}`}>
                <div className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all h-full">
                  <p className="text-sm font-medium leading-snug">{tag.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tag.count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
