// Prism — Comprehensive Mock Data (codename)

export type ProductStatus = 'active' | 'inactive' | 'dead'
export type PricingModel = 'free' | 'freemium' | 'paid' | 'enterprise' | 'open-source'
export type Platform = 'web' | 'ios' | 'android' | 'mac' | 'windows' | 'linux' | 'api'
export type TeamSize = 'solo' | '2-5' | '5-20' | '20-100' | '100+'
export type FundingStage = 'bootstrapped' | 'pre-seed' | 'seed' | 'series-a' | 'series-b+' | 'public' | 'acquired'
export type TargetAudience = 'consumers' | 'creators' | 'developers' | 'smb' | 'enterprise'
export type Badge = 'verified' | 'responsive-founder' | 'transparent-pricing' | 'active-development' | 'open-source'
export type BuzzTrend = 'rising' | 'stable' | 'falling'

export interface ProductCharacteristics {
  pricing: PricingModel
  pricingDetails?: string
  platforms: Platform[]
  teamSize: TeamSize
  funding: FundingStage
  founded: number
  openSource: boolean
  hasAPI: boolean
  aiPowered: boolean
  targetAudience: TargetAudience[]
}

export interface BuzzData {
  score: number
  trend: BuzzTrend
  weeklyChange: number
  sparkline: number[]
  sources: {
    twitter: number
    reddit: number
    hackerNews: number
    news: number
  }
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  logo: string
  url: string
  source_url?: string | null
  category: Category
  tags: string[]
  characteristics: ProductCharacteristics
  launchDate: string
  lastUpdated: string
  status: ProductStatus
  statusReason?: string
  buzz: BuzzData
  videoUrl?: string
  screenshots: string[]
  competitors: string[]
  integrations: string[]
  badges: Badge[]
  saves: number
  views: number
}

export interface NewsItem {
  id: string
  title: string
  source: 'techcrunch' | 'hackernews' | 'reddit' | 'twitter' | 'theverge' | 'wired' | 'other'
  sourceName: string
  url: string
  publishedAt: string
  excerpt?: string
  productMentions: string[]
  author?: string
  category?: 'insights' | 'design' | 'ecommerce' | 'engineering' | 'ai' | 'startup' | 'funding' | 'product'
  engagement?: {
    points?: number
    comments?: number
    upvotes?: number
  }
}

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: {
    name: string
    avatar: string
    role: string
  }
  publishedAt: string
  readTime: number
  category: 'market-analysis' | 'teardown' | 'trend-report' | 'comparison' | 'interview'
  featuredProducts: string[]
  coverImage: string
  tags: string[]
}

export interface CategoryEvolution {
  category: Category
  timeline: {
    year: number
    events: string[]
    newProducts: string[]
    deadProducts: string[]
    trends: string[]
  }[]
  stats: {
    totalProducts: number
    avgPricing: string
    openSourceShare: number
    enterpriseShare: number
  }
}

export const categories = [
  'All',
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design',
  'Marketing',
  'Analytics',
  'Automation',
  'Finance',
  'Communication',
] as const

export type Category = (typeof categories)[number]

// Category information with colors and icons
export const CATEGORY_INFO: Record<string, { color: string; label: string }> = {
  'ai-tools': { color: 'bg-violet-500', label: 'AI Tools' },
  'developer-tools': { color: 'bg-blue-500', label: 'Developer Tools' },
  'productivity': { color: 'bg-green-500', label: 'Productivity' },
  'design': { color: 'bg-pink-500', label: 'Design' },
  'marketing': { color: 'bg-orange-500', label: 'Marketing' },
  'analytics': { color: 'bg-cyan-500', label: 'Analytics' },
  'automation': { color: 'bg-amber-500', label: 'Automation' },
  'finance': { color: 'bg-emerald-500', label: 'Finance' },
  'communication': { color: 'bg-indigo-500', label: 'Communication' },
}

// Generate realistic sparkline data
const generateSparkline = (base: number, trend: BuzzTrend): number[] => {
  const data: number[] = []
  let value = base
  for (let i = 0; i < 7; i++) {
    const variance = Math.random() * 40 - 20
    if (trend === 'rising') value += Math.random() * 15
    else if (trend === 'falling') value -= Math.random() * 15
    data.push(Math.max(0, Math.round(value + variance)))
  }
  return data
}

export const products: Product[] = [
  {
    id: 'cursor',
    slug: 'cursor',
    name: 'Cursor',
    tagline: 'The AI-first code editor',
    description: 'Cursor is a code editor built for programming with AI. It features AI-powered code completion, chat, and edit capabilities that understand your entire codebase. Built on top of VS Code, it provides a familiar environment with powerful AI features that help developers write, debug, and understand code faster.',
    logo: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop',
    url: 'https://cursor.sh',
    category: 'Developer Tools',
    tags: ['AI', 'Code Editor', 'IDE', 'Programming', 'VS Code'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Pro at $20/mo',
      platforms: ['mac', 'windows', 'linux'],
      teamSize: '20-100',
      funding: 'series-a',
      founded: 2022,
      openSource: false,
      hasAPI: false,
      aiPowered: true,
      targetAudience: ['developers'],
    },
    launchDate: '2023-03-14',
    lastUpdated: '2026-03-25',
    status: 'active',
    buzz: {
      score: 892,
      trend: 'rising',
      weeklyChange: 23,
      sparkline: generateSparkline(800, 'rising'),
      sources: { twitter: 340, reddit: 220, hackerNews: 180, news: 152 },
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    screenshots: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
    ],
    competitors: ['windsurf', 'github-copilot', 'codeium'],
    integrations: ['github', 'gitlab', 'linear'],
    badges: ['verified', 'responsive-founder', 'active-development'],
    saves: 12453,
    views: 89234,
  },
  {
    id: 'windsurf',
    slug: 'windsurf',
    name: 'Windsurf',
    tagline: 'AI-powered IDE by Codeium',
    description: 'Windsurf is a full IDE with deep AI integration, offering intelligent code suggestions, automated refactoring, and natural language to code capabilities. Built by the team behind Codeium, it represents the next evolution of AI-assisted development.',
    logo: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=100&h=100&fit=crop',
    url: 'https://codeium.com/windsurf',
    category: 'Developer Tools',
    tags: ['AI', 'IDE', 'Code Editor', 'Codeium'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Teams at $15/mo',
      platforms: ['mac', 'windows', 'linux'],
      teamSize: '20-100',
      funding: 'series-b+',
      founded: 2021,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers'],
    },
    launchDate: '2024-11-01',
    lastUpdated: '2026-03-20',
    status: 'active',
    buzz: {
      score: 756,
      trend: 'rising',
      weeklyChange: 18,
      sparkline: generateSparkline(700, 'rising'),
      sources: { twitter: 280, reddit: 190, hackerNews: 156, news: 130 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=450&fit=crop',
    ],
    competitors: ['cursor', 'github-copilot', 'codeium'],
    integrations: ['github', 'jira'],
    badges: ['verified', 'transparent-pricing', 'active-development'],
    saves: 8234,
    views: 67123,
  },
  {
    id: 'v0',
    slug: 'v0',
    name: 'v0',
    tagline: 'Generate UI with AI',
    description: 'v0 by Vercel is a generative UI tool that creates React components from text descriptions. It uses AI to generate beautiful, functional UI code using shadcn/ui and Tailwind CSS. From landing pages to complex dashboards, v0 can build it from a simple prompt.',
    logo: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=100&h=100&fit=crop',
    url: 'https://v0.dev',
    category: 'AI Tools',
    tags: ['AI', 'UI Generation', 'React', 'Vercel', 'No-Code'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Premium at $20/mo',
      platforms: ['web'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2023,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'creators'],
    },
    launchDate: '2023-09-01',
    lastUpdated: '2026-03-27',
    status: 'active',
    buzz: {
      score: 823,
      trend: 'rising',
      weeklyChange: 15,
      sparkline: generateSparkline(750, 'rising'),
      sources: { twitter: 320, reddit: 200, hackerNews: 175, news: 128 },
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    screenshots: [
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop',
    ],
    competitors: ['bolt', 'lovable', 'claude-artifacts'],
    integrations: ['vercel', 'github', 'figma'],
    badges: ['verified', 'responsive-founder', 'active-development'],
    saves: 15678,
    views: 124567,
  },
  {
    id: 'notion',
    slug: 'notion',
    name: 'Notion',
    tagline: 'All-in-one workspace',
    description: 'Notion is an all-in-one workspace that combines notes, docs, wikis, and project management into a single, flexible tool. With databases, kanban boards, calendars, and powerful templates, teams can customize Notion to fit any workflow.',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop',
    url: 'https://notion.so',
    category: 'Productivity',
    tags: ['Productivity', 'Notes', 'Wiki', 'Project Management', 'Collaboration'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free for personal, Plus at $10/mo',
      platforms: ['web', 'mac', 'windows', 'ios', 'android', 'api'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2013,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['consumers', 'creators', 'smb', 'enterprise'],
    },
    launchDate: '2016-06-01',
    lastUpdated: '2026-03-26',
    status: 'active',
    buzz: {
      score: 876,
      trend: 'stable',
      weeklyChange: 2,
      sparkline: generateSparkline(870, 'stable'),
      sources: { twitter: 350, reddit: 220, hackerNews: 170, news: 136 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop',
    ],
    competitors: ['obsidian', 'coda', 'roam'],
    integrations: ['slack', 'figma', 'github', 'jira'],
    badges: ['verified', 'responsive-founder', 'transparent-pricing', 'active-development'],
    saves: 45678,
    views: 567890,
  },
  {
    id: 'linear',
    slug: 'linear',
    name: 'Linear',
    tagline: 'The issue tracking tool you will enjoy using',
    description: 'Linear is a better way to build software. Meet the system designed for modern software development. Streamline issues, projects, and product roadmaps with a tool that is fast, beautiful, and a joy to use.',
    logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop',
    url: 'https://linear.app',
    category: 'Developer Tools',
    tags: ['Project Management', 'Issue Tracking', 'Software Development', 'Agile'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free for small teams, Standard at $8/mo',
      platforms: ['web', 'mac', 'ios', 'api'],
      teamSize: '20-100',
      funding: 'series-b+',
      founded: 2019,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'smb', 'enterprise'],
    },
    launchDate: '2019-12-01',
    lastUpdated: '2026-03-24',
    status: 'active',
    buzz: {
      score: 812,
      trend: 'stable',
      weeklyChange: 5,
      sparkline: generateSparkline(800, 'stable'),
      sources: { twitter: 310, reddit: 200, hackerNews: 182, news: 120 },
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    screenshots: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
    ],
    competitors: ['jira', 'asana', 'shortcut'],
    integrations: ['github', 'gitlab', 'slack', 'figma'],
    badges: ['verified', 'responsive-founder', 'active-development'],
    saves: 23456,
    views: 234567,
  },
  {
    id: 'figma',
    slug: 'figma',
    name: 'Figma',
    tagline: 'The collaborative interface design tool',
    description: 'Figma is a cloud-based design tool that allows teams to collaborate in real-time on interface design, prototyping, and design systems. With powerful features like auto-layout, components, and plugins, it has become the industry standard for product design.',
    logo: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=100&h=100&fit=crop',
    url: 'https://figma.com',
    category: 'Design',
    tags: ['Design', 'UI/UX', 'Collaboration', 'Prototyping', 'Design Systems'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Professional at $15/mo',
      platforms: ['web', 'mac', 'windows'],
      teamSize: '100+',
      funding: 'acquired',
      founded: 2012,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['creators', 'smb', 'enterprise'],
    },
    launchDate: '2016-09-01',
    lastUpdated: '2026-03-27',
    status: 'active',
    buzz: {
      score: 934,
      trend: 'stable',
      weeklyChange: 1,
      sparkline: generateSparkline(930, 'stable'),
      sources: { twitter: 370, reddit: 230, hackerNews: 194, news: 140 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
    ],
    competitors: ['sketch', 'adobe-xd', 'framer'],
    integrations: ['slack', 'jira', 'notion', 'linear'],
    badges: ['verified', 'responsive-founder', 'transparent-pricing', 'active-development'],
    saves: 67890,
    views: 890123,
  },
  {
    id: 'claude',
    slug: 'claude',
    name: 'Claude',
    tagline: 'AI assistant by Anthropic',
    description: 'Claude is an AI assistant created by Anthropic to be helpful, harmless, and honest. It excels at analysis, coding, math, creative tasks, and extended conversations. With a focus on safety and reliability, Claude represents a new approach to AI assistance.',
    logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop',
    url: 'https://claude.ai',
    category: 'AI Tools',
    tags: ['AI', 'Assistant', 'LLM', 'Anthropic', 'Chat'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Pro at $20/mo',
      platforms: ['web', 'ios', 'android', 'api'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2021,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['consumers', 'creators', 'developers', 'enterprise'],
    },
    launchDate: '2023-03-01',
    lastUpdated: '2026-03-28',
    status: 'active',
    buzz: {
      score: 978,
      trend: 'rising',
      weeklyChange: 28,
      sparkline: generateSparkline(900, 'rising'),
      sources: { twitter: 410, reddit: 260, hackerNews: 178, news: 130 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=450&fit=crop',
    ],
    competitors: ['chatgpt', 'gemini', 'perplexity'],
    integrations: ['slack', 'notion', 'zapier'],
    badges: ['verified', 'responsive-founder', 'active-development'],
    saves: 89012,
    views: 1234567,
  },
  {
    id: 'chatgpt',
    slug: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'AI language model by OpenAI',
    description: 'ChatGPT is an AI-powered language model developed by OpenAI, capable of generating human-like text based on context and past conversations. With GPT-4 and beyond, it can handle complex reasoning, coding, analysis, and creative tasks.',
    logo: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=100&h=100&fit=crop',
    url: 'https://chat.openai.com',
    category: 'AI Tools',
    tags: ['AI', 'LLM', 'OpenAI', 'Chat', 'GPT'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Plus at $20/mo',
      platforms: ['web', 'ios', 'android', 'mac', 'api'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2015,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['consumers', 'creators', 'developers', 'enterprise'],
    },
    launchDate: '2022-11-30',
    lastUpdated: '2026-03-27',
    status: 'active',
    buzz: {
      score: 998,
      trend: 'stable',
      weeklyChange: 3,
      sparkline: generateSparkline(990, 'stable'),
      sources: { twitter: 420, reddit: 270, hackerNews: 168, news: 140 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1675557009483-e74ac53a8fb1?w=800&h=450&fit=crop',
    ],
    competitors: ['claude', 'gemini', 'perplexity'],
    integrations: ['slack', 'zapier', 'microsoft'],
    badges: ['verified'],
    saves: 123456,
    views: 2345678,
  },
  {
    id: 'supabase',
    slug: 'supabase',
    name: 'Supabase',
    tagline: 'The open source Firebase alternative',
    description: 'Supabase is an open source Firebase alternative providing all the backend features you need to build a product: PostgreSQL database, auth, instant APIs, edge functions, realtime subscriptions, and storage.',
    logo: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop',
    url: 'https://supabase.com',
    category: 'Developer Tools',
    tags: ['Database', 'Auth', 'Backend', 'PostgreSQL', 'Open Source'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Pro at $25/mo',
      platforms: ['web', 'api'],
      teamSize: '20-100',
      funding: 'series-b+',
      founded: 2020,
      openSource: true,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'smb', 'enterprise'],
    },
    launchDate: '2020-01-01',
    lastUpdated: '2026-03-26',
    status: 'active',
    buzz: {
      score: 834,
      trend: 'rising',
      weeklyChange: 12,
      sparkline: generateSparkline(780, 'rising'),
      sources: { twitter: 320, reddit: 210, hackerNews: 184, news: 120 },
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    screenshots: [
      'https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?w=800&h=450&fit=crop',
    ],
    competitors: ['firebase', 'planetscale', 'neon'],
    integrations: ['vercel', 'netlify', 'github'],
    badges: ['verified', 'responsive-founder', 'transparent-pricing', 'active-development', 'open-source'],
    saves: 34567,
    views: 456789,
  },
  {
    id: 'vercel',
    slug: 'vercel',
    name: 'Vercel',
    tagline: 'Develop. Preview. Ship.',
    description: 'Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration. Deploy web projects with zero configuration, automatic HTTPS, and global CDN.',
    logo: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=100&h=100&fit=crop',
    url: 'https://vercel.com',
    category: 'Developer Tools',
    tags: ['Hosting', 'Deployment', 'Frontend', 'Next.js', 'Serverless'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Pro at $20/mo',
      platforms: ['web', 'api'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2015,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'smb', 'enterprise'],
    },
    launchDate: '2015-11-01',
    lastUpdated: '2026-03-28',
    status: 'active',
    buzz: {
      score: 889,
      trend: 'stable',
      weeklyChange: 4,
      sparkline: generateSparkline(880, 'stable'),
      sources: { twitter: 350, reddit: 220, hackerNews: 189, news: 130 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    ],
    competitors: ['netlify', 'cloudflare-pages', 'railway'],
    integrations: ['github', 'gitlab', 'bitbucket'],
    badges: ['verified', 'responsive-founder', 'transparent-pricing', 'active-development'],
    saves: 56789,
    views: 678901,
  },
  // Dead/Inactive Products
  {
    id: 'atom',
    slug: 'atom',
    name: 'Atom',
    tagline: 'A hackable text editor',
    description: 'Atom was a free and open-source text editor developed by GitHub. It was discontinued in December 2022 as resources shifted to VS Code.',
    logo: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=100&h=100&fit=crop',
    url: 'https://atom.io',
    category: 'Developer Tools',
    tags: ['Code Editor', 'Open Source', 'GitHub', 'Discontinued'],
    characteristics: {
      pricing: 'open-source',
      platforms: ['mac', 'windows', 'linux'],
      teamSize: '20-100',
      funding: 'acquired',
      founded: 2014,
      openSource: true,
      hasAPI: true,
      aiPowered: false,
      targetAudience: ['developers'],
    },
    launchDate: '2014-02-26',
    lastUpdated: '2022-12-15',
    status: 'dead',
    statusReason: 'Officially sunset by GitHub in December 2022. VS Code became the focus.',
    buzz: {
      score: 45,
      trend: 'falling',
      weeklyChange: -8,
      sparkline: generateSparkline(100, 'falling'),
      sources: { twitter: 15, reddit: 12, hackerNews: 10, news: 8 },
    },
    screenshots: [],
    competitors: ['vscode', 'sublime-text'],
    integrations: [],
    badges: ['open-source'],
    saves: 1234,
    views: 12345,
  },
  {
    id: 'sunrise-calendar',
    slug: 'sunrise-calendar',
    name: 'Sunrise Calendar',
    tagline: 'The calendar app you will love',
    description: 'Sunrise was a popular calendar application acquired by Microsoft in 2015 and subsequently shut down in 2016 as its features were integrated into Outlook.',
    logo: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=100&h=100&fit=crop',
    url: 'https://sunrise.am',
    category: 'Productivity',
    tags: ['Calendar', 'Productivity', 'Discontinued', 'Acquired'],
    characteristics: {
      pricing: 'free',
      platforms: ['web', 'ios', 'android', 'mac'],
      teamSize: '5-20',
      funding: 'acquired',
      founded: 2012,
      openSource: false,
      hasAPI: false,
      aiPowered: false,
      targetAudience: ['consumers'],
    },
    launchDate: '2013-02-01',
    lastUpdated: '2016-08-31',
    status: 'dead',
    statusReason: 'Acquired by Microsoft in 2015, sunset in 2016. Features absorbed into Outlook.',
    buzz: {
      score: 12,
      trend: 'falling',
      weeklyChange: -2,
      sparkline: generateSparkline(30, 'falling'),
      sources: { twitter: 3, reddit: 4, hackerNews: 2, news: 3 },
    },
    screenshots: [],
    competitors: ['google-calendar', 'apple-calendar', 'fantastical'],
    integrations: [],
    badges: [],
    saves: 234,
    views: 3456,
  },
  {
    id: 'perplexity',
    slug: 'perplexity',
    name: 'Perplexity',
    tagline: 'AI-powered search engine',
    description: 'Perplexity is an AI-powered search engine that provides direct answers to questions with cited sources, combining search and AI chat for research and discovery.',
    logo: 'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=100&h=100&fit=crop',
    url: 'https://perplexity.ai',
    category: 'AI Tools',
    tags: ['AI', 'Search', 'Research', 'LLM'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free tier, Pro at $20/mo',
      platforms: ['web', 'ios', 'android', 'api'],
      teamSize: '20-100',
      funding: 'series-b+',
      founded: 2022,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['consumers', 'creators', 'developers'],
    },
    launchDate: '2022-12-01',
    lastUpdated: '2026-03-27',
    status: 'active',
    buzz: {
      score: 867,
      trend: 'rising',
      weeklyChange: 19,
      sparkline: generateSparkline(800, 'rising'),
      sources: { twitter: 350, reddit: 220, hackerNews: 167, news: 130 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=450&fit=crop',
    ],
    competitors: ['chatgpt', 'claude', 'you-com'],
    integrations: ['slack', 'discord'],
    badges: ['verified', 'active-development'],
    saves: 45678,
    views: 567890,
  },
  {
    id: 'stripe',
    slug: 'stripe',
    name: 'Stripe',
    tagline: 'Financial infrastructure for the internet',
    description: 'Stripe is a technology company that builds economic infrastructure for the internet. Millions of companies use Stripe to accept payments, manage subscriptions, and handle their finances online.',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop',
    url: 'https://stripe.com',
    category: 'Finance',
    tags: ['Payments', 'Finance', 'API', 'E-commerce', 'Subscriptions'],
    characteristics: {
      pricing: 'paid',
      pricingDetails: '2.9% + 30¢ per transaction',
      platforms: ['web', 'api'],
      teamSize: '100+',
      funding: 'series-b+',
      founded: 2010,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'smb', 'enterprise'],
    },
    launchDate: '2011-09-01',
    lastUpdated: '2026-03-26',
    status: 'active',
    buzz: {
      score: 912,
      trend: 'stable',
      weeklyChange: 2,
      sparkline: generateSparkline(910, 'stable'),
      sources: { twitter: 360, reddit: 225, hackerNews: 192, news: 135 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop',
    ],
    competitors: ['paddle', 'lemonsqueezy', 'paypal'],
    integrations: ['shopify', 'woocommerce', 'quickbooks'],
    badges: ['verified', 'transparent-pricing'],
    saves: 78901,
    views: 901234,
  },
  {
    id: 'midjourney',
    slug: 'midjourney',
    name: 'Midjourney',
    tagline: 'AI image generation',
    description: 'Midjourney is an AI-powered tool that generates images from natural language descriptions, known for its artistic and high-quality outputs. It operates primarily through Discord.',
    logo: 'https://images.unsplash.com/photo-1686191128892-3b37add4d6bd?w=100&h=100&fit=crop',
    url: 'https://midjourney.com',
    category: 'AI Tools',
    tags: ['AI', 'Image Generation', 'Art', 'Creative', 'Discord'],
    characteristics: {
      pricing: 'paid',
      pricingDetails: 'Basic at $10/mo, Standard at $30/mo',
      platforms: ['web'],
      teamSize: '5-20',
      funding: 'bootstrapped',
      founded: 2021,
      openSource: false,
      hasAPI: false,
      aiPowered: true,
      targetAudience: ['creators', 'consumers'],
    },
    launchDate: '2022-07-01',
    lastUpdated: '2026-03-25',
    status: 'active',
    buzz: {
      score: 967,
      trend: 'stable',
      weeklyChange: -2,
      sparkline: generateSparkline(970, 'stable'),
      sources: { twitter: 400, reddit: 250, hackerNews: 167, news: 150 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
    ],
    competitors: ['dall-e', 'stable-diffusion', 'leonardo'],
    integrations: ['discord'],
    badges: ['active-development'],
    saves: 67890,
    views: 789012,
  },
  {
    id: 'raycast',
    slug: 'raycast',
    name: 'Raycast',
    tagline: 'Your shortcut to everything',
    description: 'Raycast is a blazingly fast, totally extendable launcher for Mac that lets you complete tasks, calculate, share common links, and much more. With an extensive extension store, it becomes the command center for your computer.',
    logo: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&h=100&fit=crop',
    url: 'https://raycast.com',
    category: 'Productivity',
    tags: ['Productivity', 'Mac', 'Launcher', 'Automation', 'Extensions'],
    characteristics: {
      pricing: 'freemium',
      pricingDetails: 'Free for personal, Pro at $10/mo',
      platforms: ['mac'],
      teamSize: '20-100',
      funding: 'series-a',
      founded: 2020,
      openSource: false,
      hasAPI: true,
      aiPowered: true,
      targetAudience: ['developers', 'creators'],
    },
    launchDate: '2020-08-01',
    lastUpdated: '2026-03-27',
    status: 'active',
    buzz: {
      score: 723,
      trend: 'stable',
      weeklyChange: 6,
      sparkline: generateSparkline(710, 'stable'),
      sources: { twitter: 280, reddit: 185, hackerNews: 158, news: 100 },
    },
    screenshots: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
    ],
    competitors: ['alfred', 'spotlight'],
    integrations: ['github', 'linear', 'notion', 'slack'],
    badges: ['verified', 'responsive-founder', 'active-development'],
    saves: 23456,
    views: 345678,
  },
]

// News items for the live feed
export const newsItems: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Why Venture Capital is pivoting back to hard-tech and defense',
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/example',
    publishedAt: '2026-03-28T10:30:00Z',
    excerpt: 'After a decade of SaaS dominance, investors are looking for "atoms" over "bits" in the new geopolitical landscape.',
    productMentions: [],
    author: 'Mark Thorne',
    category: 'insights',
    engagement: { comments: 234 },
  },
  {
    id: 'news-2',
    title: "The death of the 'Glassmorphism' trend in modern SaaS UI",
    source: 'other',
    sourceName: 'Medium',
    url: 'https://medium.com/example',
    publishedAt: '2026-03-28T09:15:00Z',
    excerpt: 'Designers are returning to high-contrast, brutalist-inspired layouts as accessibility becomes paramount.',
    productMentions: [],
    author: 'Elena Rossi',
    category: 'design',
    engagement: { comments: 156 },
  },
  {
    id: 'news-3',
    title: "Stripe's new billing components: A threat to SaaS wrapper startups?",
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/example2',
    publishedAt: '2026-03-27T22:00:00Z',
    excerpt: 'As the infrastructure giant moves up the stack, niche billing tools face an existential crisis.',
    productMentions: [],
    author: 'James Park',
    category: 'ecommerce',
    engagement: { comments: 89 },
  },
  {
    id: 'news-4',
    title: 'Cursor raises $60M as AI coding tools heat up',
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/example3',
    publishedAt: '2026-03-27T18:30:00Z',
    excerpt: 'The AI-powered code editor has seen massive adoption among developers looking for alternatives to traditional IDEs.',
    productMentions: ['cursor', 'github-copilot'],
    author: 'Sarah Chen',
    category: 'funding',
    engagement: { comments: 312 },
  },
  {
    id: 'news-5',
    title: 'Show HN: I built an AI agent that writes entire features',
    source: 'hackernews',
    sourceName: 'Hacker News',
    url: 'https://news.ycombinator.com/example',
    publishedAt: '2026-03-27T15:00:00Z',
    productMentions: ['v0', 'cursor'],
    author: 'dev_builder',
    category: 'engineering',
    engagement: { points: 342, comments: 156 },
  },
  {
    id: 'news-6',
    title: 'Claude 4 Opus benchmarks suggest major leap in reasoning',
    source: 'theverge',
    sourceName: 'The Verge',
    url: 'https://theverge.com/example',
    publishedAt: '2026-03-27T12:00:00Z',
    excerpt: 'Anthropic releases new benchmarks showing Claude 4 outperforming competitors on complex reasoning tasks.',
    productMentions: ['claude', 'chatgpt'],
    author: 'Alex Holloway',
    category: 'ai',
    engagement: { comments: 445 },
  },
  {
    id: 'news-7',
    title: 'Is Perplexity the Google killer everyone predicted?',
    source: 'reddit',
    sourceName: 'r/technology',
    url: 'https://reddit.com/r/technology/example',
    publishedAt: '2026-03-27T08:45:00Z',
    productMentions: ['perplexity'],
    category: 'ai',
    engagement: { upvotes: 1234, comments: 567 },
  },
  {
    id: 'news-8',
    title: 'Figma announces AI-powered design generation features',
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/example4',
    publishedAt: '2026-03-27T06:30:00Z',
    excerpt: 'New features will let designers generate layouts and components from text descriptions.',
    productMentions: ['figma'],
    author: 'Nina Patel',
    category: 'design',
    engagement: { comments: 178 },
  },
  {
    id: 'news-9',
    title: 'Why we switched from Firebase to Supabase',
    source: 'hackernews',
    sourceName: 'Hacker News',
    url: 'https://news.ycombinator.com/example2',
    publishedAt: '2026-03-26T22:00:00Z',
    excerpt: 'A deep dive into our migration journey and the lessons learned along the way.',
    productMentions: ['supabase'],
    author: 'tech_lead_42',
    category: 'engineering',
    engagement: { points: 456, comments: 234 },
  },
  {
    id: 'news-10',
    title: 'Linear hits $100M ARR without traditional sales team',
    source: 'twitter',
    sourceName: '@linear',
    url: 'https://twitter.com/linear/example',
    publishedAt: '2026-03-26T18:30:00Z',
    excerpt: 'The project management tool shares its product-led growth playbook.',
    productMentions: ['linear'],
    author: 'Karri Saarinen',
    category: 'startup',
  },
  {
    id: 'news-11',
    title: 'Midjourney v7 introduces video generation capabilities',
    source: 'wired',
    sourceName: 'WIRED',
    url: 'https://wired.com/example',
    publishedAt: '2026-03-26T14:00:00Z',
    excerpt: 'The AI art generator expands beyond static images into short video clips.',
    productMentions: ['midjourney'],
    author: 'David Pierce',
    category: 'ai',
  },
  {
    id: 'news-12',
    title: 'The unbundling of Notion has begun',
    source: 'other',
    sourceName: 'Every',
    url: 'https://every.to/example',
    publishedAt: '2026-03-26T10:00:00Z',
    excerpt: 'Specialized tools are chipping away at the all-in-one workspace dominance.',
    productMentions: ['notion', 'linear'],
    author: 'Nathan Baschez',
    category: 'product',
  },
]

// Editorial articles
export const articles: Article[] = [
  {
    id: 'article-1',
    slug: 'state-of-ai-coding-tools-2026',
    title: 'The State of AI Coding Tools in 2026',
    excerpt: 'From code completion to autonomous agents, we analyze the rapidly evolving landscape of AI-powered development tools.',
    content: `# The State of AI Coding Tools in 2026

The landscape of AI coding tools has transformed dramatically...

## The Rise of AI-Native IDEs

Tools like Cursor and Windsurf have challenged the traditional IDE paradigm...

## Code Completion is Table Stakes

What was revolutionary in 2023 is now expected...

## The Agent Era Begins

We're seeing the emergence of AI agents that can handle entire features...`,
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      role: 'Editor',
    },
    publishedAt: '2026-03-25T12:00:00Z',
    readTime: 8,
    category: 'market-analysis',
    featuredProducts: ['cursor', 'windsurf', 'github-copilot', 'v0'],
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
    tags: ['AI', 'Developer Tools', 'Code Editors', 'Analysis'],
  },
  {
    id: 'article-2',
    slug: 'cursor-vs-windsurf-deep-dive',
    title: 'Cursor vs Windsurf: Which AI Editor Should You Choose?',
    excerpt: 'An in-depth comparison of the two leading AI-first code editors, including benchmarks, user experience, and pricing.',
    content: `# Cursor vs Windsurf

Both Cursor and Windsurf promise to revolutionize how developers write code...`,
    author: {
      name: 'Marcus Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      role: 'Senior Analyst',
    },
    publishedAt: '2026-03-22T10:00:00Z',
    readTime: 12,
    category: 'comparison',
    featuredProducts: ['cursor', 'windsurf'],
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop',
    tags: ['Comparison', 'Code Editors', 'AI'],
  },
  {
    id: 'article-3',
    slug: 'rise-and-fall-of-atom',
    title: 'The Rise and Fall of Atom: Lessons for Modern Tools',
    excerpt: 'How GitHub Atom went from revolutionary to deprecated, and what today builders can learn from its journey.',
    content: `# The Rise and Fall of Atom

In 2014, Atom was the future of text editors...`,
    author: {
      name: 'Elena Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      role: 'Contributing Writer',
    },
    publishedAt: '2026-03-18T14:00:00Z',
    readTime: 6,
    category: 'teardown',
    featuredProducts: ['atom'],
    coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&h=630&fit=crop',
    tags: ['History', 'Developer Tools', 'Lessons'],
  },
]

// Category evolution data
export const categoryEvolutions: CategoryEvolution[] = [
  {
    category: 'AI Tools',
    timeline: [
      {
        year: 2022,
        events: ['ChatGPT launches and changes everything', 'Midjourney gains viral popularity'],
        newProducts: ['chatgpt', 'midjourney'],
        deadProducts: [],
        trends: ['Generative AI becomes mainstream', 'Text-to-image explodes'],
      },
      {
        year: 2023,
        events: ['GPT-4 released', 'Claude launches publicly', 'AI coding tools proliferate'],
        newProducts: ['claude', 'v0', 'cursor'],
        deadProducts: [],
        trends: ['Multimodal AI', 'AI assistants in every app', 'Code generation matures'],
      },
      {
        year: 2024,
        events: ['AI agents emerge', 'Open source models catch up', 'AI regulation debates heat up'],
        newProducts: ['bolt', 'lovable', 'windsurf'],
        deadProducts: [],
        trends: ['Agentic AI', 'Local LLMs', 'AI safety concerns'],
      },
      {
        year: 2025,
        events: ['AI agents become practical', 'Video generation matures'],
        newProducts: [],
        deadProducts: [],
        trends: ['Autonomous coding', 'AI-native workflows'],
      },
      {
        year: 2026,
        events: ['AI writes full features', 'Human-AI collaboration normalized'],
        newProducts: [],
        deadProducts: [],
        trends: ['AI teammates', 'Hybrid development'],
      },
    ],
    stats: {
      totalProducts: 156,
      avgPricing: '$22/mo',
      openSourceShare: 18,
      enterpriseShare: 34,
    },
  },
  {
    category: 'Developer Tools',
    timeline: [
      {
        year: 2020,
        events: ['GitHub Copilot technical preview'],
        newProducts: ['supabase'],
        deadProducts: [],
        trends: ['AI-assisted coding begins', 'Serverless databases'],
      },
      {
        year: 2021,
        events: ['Copilot general availability', 'Low-code/no-code boom'],
        newProducts: [],
        deadProducts: [],
        trends: ['AI pair programming', 'Developer experience focus'],
      },
      {
        year: 2022,
        events: ['AI tools multiply'],
        newProducts: ['cursor'],
        deadProducts: ['atom'],
        trends: ['AI-first editors emerge', 'Legacy editors decline'],
      },
    ],
    stats: {
      totalProducts: 234,
      avgPricing: '$18/mo',
      openSourceShare: 32,
      enterpriseShare: 28,
    },
  },
]

// Helper functions
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductsByCategory(category: Category): Product[] {
  if (category === 'All') return products
  return products.filter(p => p.category === category)
}

export function getActiveProducts(): Product[] {
  return products.filter(p => p.status === 'active')
}

export function getDeadProducts(): Product[] {
  return products.filter(p => p.status === 'dead')
}

export function getTrendingProducts(limit = 10): Product[] {
  return [...products]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.buzz.weeklyChange - a.buzz.weeklyChange)
    .slice(0, limit)
}

export function getFeaturedProducts(limit = 4): Product[] {
  return products
    .filter(p => p.status === 'active' && p.badges.includes('verified'))
    .slice(0, limit)
}

export function getCompetitors(productId: string): Product[] {
  const product = getProductById(productId)
  if (!product) return []
  return product.competitors
    .map(id => getProductById(id))
    .filter((p): p is Product => p !== undefined)
}

export function getRecentNews(limit = 8): NewsItem[] {
  return [...newsItems]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
