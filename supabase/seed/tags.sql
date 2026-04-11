-- ═══════════════════════════════════════════════════════════════════
-- tags.sql — attribute vocabulary seed (Day 3.5 Layer 2)
-- Date: 2026-04-10
-- Sources:
--   docs/STRATEGIC-PLAN.md  § Attribute / Taxonomy System (Layer 2)
--   docs/wireframes         /products sidebar "10 attribute groups"
--
-- 10 tag groups × controlled vocabularies. Each value has:
--   name       — display string, kebab-case
--   slug       — URL-safe, same as name for simplicity; powers
--                /attributes/[group]/[slug] SEO pages
--   tag_group  — which facet bucket it belongs to
--
-- These are the ONLY valid values the Claude extraction prompt is
-- allowed to return. Any AI-produced value not in this list gets
-- dropped + logged as a "vocabulary miss" for human review.
--
-- Safe to re-run: uses ON CONFLICT (slug) DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════

-- capability ─────────────────────────────────────────────────────────
-- What the product CAN do, technically.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('collaborative',       'collaborative',       'capability'),
  ('real-time',           'real-time',           'capability'),
  ('offline-capable',     'offline-capable',     'capability'),
  ('version-history',     'version-history',     'capability'),
  ('ai-assist',           'ai-assist',           'capability'),
  ('api-first',           'api-first',           'capability'),
  ('webhook-support',     'webhook-support',     'capability'),
  ('mobile-sync',         'mobile-sync',         'capability'),
  ('e2e-encrypted',       'e2e-encrypted',       'capability'),
  ('local-first',         'local-first',         'capability')
ON CONFLICT (slug) DO NOTHING;

-- audience ───────────────────────────────────────────────────────────
-- WHO the product is built for.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('developers',          'developers',          'audience'),
  ('designers',           'designers',           'audience'),
  ('marketers',           'marketers',           'audience'),
  ('solopreneurs',        'solopreneurs',        'audience'),
  ('smb',                 'smb',                 'audience'),
  ('enterprise',          'enterprise',          'audience'),
  ('students',            'students',            'audience'),
  ('researchers',         'researchers',         'audience'),
  ('creators',            'creators',            'audience'),
  ('consumers',           'consumers',           'audience')
ON CONFLICT (slug) DO NOTHING;

-- pricing_model ──────────────────────────────────────────────────────
-- How you pay for it.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('free',                'free',                'pricing_model'),
  ('freemium',            'freemium',            'pricing_model'),
  ('free-trial',          'free-trial',          'pricing_model'),
  ('paid-only',           'paid-only',           'pricing_model'),
  ('open-source',         'open-source',         'pricing_model'),
  ('perpetual',           'perpetual',           'pricing_model'),
  ('pay-per-use',         'pay-per-use',         'pricing_model'),
  ('open-core',           'open-core',           'pricing_model'),
  ('subscription',        'subscription',        'pricing_model'),
  ('marketplace-fee',     'marketplace-fee',     'pricing_model')
ON CONFLICT (slug) DO NOTHING;

-- deployment ─────────────────────────────────────────────────────────
-- WHERE it runs.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('cloud',               'cloud',               'deployment'),
  ('self-hosted',         'self-hosted',         'deployment'),
  ('desktop-app',         'desktop-app',         'deployment'),
  ('mobile-app',          'mobile-app',          'deployment'),
  ('browser-extension',   'browser-extension',   'deployment'),
  ('cli',                 'cli',                 'deployment'),
  ('api-only',            'api-only',            'deployment'),
  ('hardware',            'hardware',            'deployment'),
  ('embedded',            'embedded',            'deployment'),
  ('hybrid',              'hybrid',              'deployment')
ON CONFLICT (slug) DO NOTHING;

-- integration ────────────────────────────────────────────────────────
-- Popular third-party integrations (powers "works with X" SEO pages).
INSERT INTO tags (name, slug, tag_group) VALUES
  ('slack',               'slack',               'integration'),
  ('notion',              'notion',              'integration'),
  ('zapier',              'zapier',              'integration'),
  ('google-workspace',    'google-workspace',    'integration'),
  ('github',              'github',              'integration'),
  ('vscode',              'vscode',              'integration'),
  ('obsidian',            'obsidian',            'integration'),
  ('linear',              'linear',              'integration'),
  ('figma',               'figma',               'integration'),
  ('stripe',              'stripe',              'integration'),
  ('salesforce',          'salesforce',          'integration'),
  ('hubspot',             'hubspot',             'integration')
ON CONFLICT (slug) DO NOTHING;

-- compliance ─────────────────────────────────────────────────────────
-- Enterprise filtering.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('soc2',                'soc2',                'compliance'),
  ('hipaa',               'hipaa',               'compliance'),
  ('gdpr',                'gdpr',                'compliance'),
  ('ccpa',                'ccpa',                'compliance'),
  ('iso27001',            'iso27001',            'compliance'),
  ('pci-dss',             'pci-dss',             'compliance'),
  ('fedramp',             'fedramp',             'compliance'),
  ('hitrust',             'hitrust',             'compliance')
ON CONFLICT (slug) DO NOTHING;

-- tech_stack ─────────────────────────────────────────────────────────
-- What the product is built with (dev-tool filters).
INSERT INTO tags (name, slug, tag_group) VALUES
  ('react',               'react',               'tech_stack'),
  ('rust',                'rust',                'tech_stack'),
  ('python',              'python',              'tech_stack'),
  ('go',                  'go',                  'tech_stack'),
  ('typescript',          'typescript',          'tech_stack'),
  ('wasm',                'wasm',                'tech_stack'),
  ('postgresql',          'postgresql',          'tech_stack'),
  ('sqlite',              'sqlite',              'tech_stack'),
  ('elixir',              'elixir',              'tech_stack'),
  ('swift',               'swift',               'tech_stack')
ON CONFLICT (slug) DO NOTHING;

-- data_format ────────────────────────────────────────────────────────
-- What input/output formats the product natively speaks.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('markdown',            'markdown',            'data_format'),
  ('json',                'json',                'data_format'),
  ('csv',                 'csv',                 'data_format'),
  ('sql',                 'sql',                 'data_format'),
  ('images',              'images',              'data_format'),
  ('video',               'video',               'data_format'),
  ('audio',               'audio',               'data_format'),
  ('3d-models',           '3d-models',           'data_format'),
  ('code',                'code',                'data_format'),
  ('pdf',                 'pdf',                 'data_format')
ON CONFLICT (slug) DO NOTHING;

-- ux_pattern ─────────────────────────────────────────────────────────
-- Interaction / UI paradigm.
INSERT INTO tags (name, slug, tag_group) VALUES
  ('keyboard-first',      'keyboard-first',      'ux_pattern'),
  ('command-palette',     'command-palette',     'ux_pattern'),
  ('no-code',             'no-code',             'ux_pattern'),
  ('low-code',            'low-code',            'ux_pattern'),
  ('drag-drop',           'drag-drop',           'ux_pattern'),
  ('visual-builder',      'visual-builder',      'ux_pattern'),
  ('ai-chat-ui',          'ai-chat-ui',          'ux_pattern'),
  ('kanban',              'kanban',              'ux_pattern'),
  ('calendar',            'calendar',            'ux_pattern'),
  ('timeline',            'timeline',            'ux_pattern')
ON CONFLICT (slug) DO NOTHING;

-- business_model ─────────────────────────────────────────────────────
-- How the COMPANY makes money (distinct from pricing_model which is
-- how a single product is priced).
INSERT INTO tags (name, slug, tag_group) VALUES
  ('saas',                'saas',                'business_model'),
  ('marketplace',         'marketplace',         'business_model'),
  ('ads',                 'ads',                 'business_model'),
  ('open-source-funded',  'open-source-funded',  'business_model'),
  ('hardware-sales',      'hardware-sales',      'business_model'),
  ('data-licensing',      'data-licensing',      'business_model'),
  ('transaction-fee',     'transaction-fee',     'business_model'),
  ('services-led',        'services-led',        'business_model')
ON CONFLICT (slug) DO NOTHING;

-- Sanity check: count per group (uncomment to verify after apply)
-- SELECT tag_group, COUNT(*) FROM tags GROUP BY tag_group ORDER BY tag_group;
