/**
 * Branding — single source of truth.
 *
 * Prism is a CODENAME. When the final product name is locked, update the
 * constants in this file and every user-facing string flips in one commit.
 *
 * Rules:
 * - Never hardcode the brand name in components, pages, or metadata.
 * - Import BRAND.name, BRAND.tagline, etc. instead.
 * - The `dossier` sub-brand is a separate concept (route `/dossier/[slug]`,
 *   monetizable unit) and stays stable even if the parent brand renames.
 */

export const BRAND = {
  /** Display name shown in header, footer, logo text, metadata titles. */
  name: 'Prism',

  /** Single-letter monogram used in the logo tile (e.g. "P" inside the gradient square). */
  initial: 'P',

  /** Short marketing tagline. Used in hero copy and signup testimonials. */
  tagline: 'Product intelligence, from launch to legacy',

  /** SEO meta title — shown in browser tabs and search results. */
  metaTitle: 'Prism — Product intelligence',

  /** SEO meta description — 1-2 sentences. */
  metaDescription:
    'Track tech products across their entire lifecycle. Signal scoring, historical timelines, attribute taxonomy, and market analytics in one place.',

  /** Year used in copyright lines. */
  copyrightYear: 2026,

  /** True while the brand name is still a placeholder codename. */
  isCodename: true,
} as const

/**
 * Sub-brand: the full product intelligence file served at `/dossier/[slug]`.
 * Stays stable across any parent-brand rename.
 */
export const DOSSIER = {
  label: 'Dossier',
  labelPlural: 'Dossiers',
  routeBase: '/dossier',
} as const

/** Convenience: "© 2026 Prism. All rights reserved." */
export const BRAND_COPYRIGHT = `© ${BRAND.copyrightYear} ${BRAND.name}. All rights reserved.`

/** Convenience for metadata title templates: "Insights | Prism" */
export const brandTitle = (pageTitle: string): string => `${pageTitle} | ${BRAND.name}`
