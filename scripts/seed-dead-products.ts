/**
 * scripts/seed-dead-products.ts
 *
 * Upserts known-dead products with accurate historical lifespan data.
 * Designed to grow indefinitely — add objects to DEAD_PRODUCTS and re-run.
 *
 * Usage:
 *   npm run seed:dead
 *
 * Safe to re-run — upserts on slug. Does NOT set lifespan_months (computed column).
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Types ────────────────────────────────────────────────────────────────────

type DeadSeed = {
  slug: string
  name: string
  category: string
  description: string
  launched_year: number
  launched_month: number
  discontinued_year: number
  discontinued_month: number
  death_reason: string
  postmortem: string
  website_url?: string
  era?: string
}

// ─── Dead Products — append forever ──────────────────────────────────────────
//
// death_reason must be one of:
//   outcompeted | acquired_shutdown | strategic_pivot | execution |
//   funding_failure | market_timing | platform_dependency | regulatory
//
// category slugs: social | productivity | media | hardware | gaming |
//   analytics | communication | dev-tools | health | e-commerce |
//   design | mobile | finance | entertainment | web

const DEAD_PRODUCTS: DeadSeed[] = [

  // ── Social ─────────────────────────────────────────────────────────────────

  {
    slug: 'vine',
    name: 'Vine',
    category: 'social',
    description: 'Twitter-owned short-form video platform famous for its 6-second looping videos. Spawned the creator economy before Instagram Reels and TikTok finished what it started.',
    launched_year: 2013, launched_month: 1,
    discontinued_year: 2016, discontinued_month: 10,
    death_reason: 'outcompeted',
    postmortem: 'Twitter killed Vine when Instagram launched 15-second video and Facebook opened its checkbook for creators. Twitter refused to pay top creators and the platform hollowed out within months.',
    website_url: 'https://vine.co',
    era: '2010s',
  },
  {
    slug: 'google-plus',
    name: 'Google+',
    category: 'social',
    description: "Google's attempt to unify its identity layer across products under a social network. Mandatory integration with YouTube and Gmail created backlash rather than adoption.",
    launched_year: 2011, launched_month: 6,
    discontinued_year: 2019, discontinued_month: 4,
    death_reason: 'execution',
    postmortem: "Google+ was a product designed by engineers for engineers — nobody wanted to be forced into circles. A 2018 data breach accelerated its shutdown, but it was functionally dead years before.",
    website_url: 'https://plus.google.com',
    era: '2010s',
  },
  {
    slug: 'myspace',
    name: 'MySpace',
    category: 'social',
    description: 'The dominant social network from 2005 to 2008, famous for custom HTML profiles, music discovery, and being the first mainstream social graph.',
    launched_year: 2003, launched_month: 8,
    discontinued_year: 2019, discontinued_month: 1,
    death_reason: 'outcompeted',
    postmortem: 'Facebook beat MySpace on simplicity and real identity. A 2016 server migration wiped 12 years of user-uploaded music — destroying the one remaining reason to visit.',
    website_url: 'https://myspace.com',
    era: '2000s',
  },
  {
    slug: 'friendster',
    name: 'Friendster',
    category: 'social',
    description: 'The first major social network, predating MySpace and Facebook. Pioneered the social graph concept but collapsed under its own scale.',
    launched_year: 2002, launched_month: 3,
    discontinued_year: 2015, discontinued_month: 6,
    death_reason: 'execution',
    postmortem: 'Friendster invented the social network but could not scale. While engineers struggled with servers buckling under load, MySpace and Facebook lapped them. Pivoted to gaming in Asia before shutting down entirely.',
    website_url: 'https://friendster.com',
    era: '2000s',
  },
  {
    slug: 'digg',
    name: 'Digg',
    category: 'social',
    description: 'Community news aggregator where users voted stories to the front page. Precursor to Reddit and a defining product of Web 2.0.',
    launched_year: 2004, launched_month: 11,
    discontinued_year: 2012, discontinued_month: 8,
    death_reason: 'outcompeted',
    postmortem: 'Digg v4 in 2010 stripped community features that power users loved and replaced them with a Facebook-integrated feed. Reddit absorbed the community overnight. The domain sold for $500K — down from a $200M acquisition offer it rejected.',
    website_url: 'https://digg.com',
    era: '2000s',
  },
  {
    slug: 'google-buzz',
    name: 'Google Buzz',
    category: 'social',
    description: "Google's social stream integrated directly into Gmail, auto-connecting users with frequent email contacts. Launched to immediate privacy backlash.",
    launched_year: 2010, launched_month: 2,
    discontinued_year: 2011, discontinued_month: 12,
    death_reason: 'execution',
    postmortem: 'Buzz auto-exposed email contact lists as public followers on launch, triggering an FTC investigation. Google settled for $8.5M and shut it down 22 months after launch.',
    website_url: 'https://buzz.google.com',
    era: '2010s',
  },
  {
    slug: 'path',
    name: 'Path',
    category: 'social',
    description: 'A beautifully designed private social network limited to 50 friends. Positioned as the antidote to Facebook oversharing.',
    launched_year: 2010, launched_month: 11,
    discontinued_year: 2018, discontinued_month: 10,
    death_reason: 'outcompeted',
    postmortem: "Path's limit-of-50 mechanic was innovative but impossible to monetize. Instagram Stories and WhatsApp absorbed its use case. Sold to Daum Kakao in 2015 for an undisclosed sum before finally shutting down.",
    website_url: 'https://path.com',
    era: '2010s',
  },
  {
    slug: 'yik-yak',
    name: 'Yik Yak',
    category: 'social',
    description: 'Anonymous hyperlocal social app for college campuses. Exploded to $400M valuation before cyberbullying backlash and school bans killed it.',
    launched_year: 2013, launched_month: 8,
    discontinued_year: 2017, discontinued_month: 4,
    death_reason: 'regulatory',
    postmortem: 'Yik Yak enabled anonymous campus harassment at scale. After hundreds of school bans and a DOE investigation, it forced real-name sign-up — destroying the only thing that made it different. Sold to Square for employee talent in 2017.',
    website_url: 'https://yikyak.com',
    era: '2010s',
  },
  {
    slug: 'meerkat',
    name: 'Meerkat',
    category: 'social',
    description: 'Live mobile streaming app that exploded at SXSW 2015, then was killed by Twitter cutting off its social graph access days later.',
    launched_year: 2015, launched_month: 2,
    discontinued_year: 2016, discontinued_month: 9,
    death_reason: 'platform_dependency',
    postmortem: 'Meerkat was entirely dependent on Twitter for discovery. When Twitter acquired Periscope and cut off Meerkat\'s social graph access, the app was dead within months. A textbook platform-risk disaster.',
    website_url: 'https://meerkatapp.co',
    era: '2010s',
  },
  {
    slug: 'periscope',
    name: 'Periscope',
    category: 'social',
    description: "Live video streaming platform acquired by Twitter before launch. Twitter's own integration eventually made it redundant.",
    launched_year: 2015, launched_month: 3,
    discontinued_year: 2021, discontinued_month: 3,
    death_reason: 'acquired_shutdown',
    postmortem: 'Twitter folded live video into its main app, making Periscope redundant. The standalone app was shut down March 2021. A rare case of an acquirer killing a product by absorbing it rather than neglecting it.',
    website_url: 'https://periscope.tv',
    era: '2010s',
  },
  {
    slug: 'orkut',
    name: 'Orkut',
    category: 'social',
    description: "Google's first social network, wildly popular in Brazil and India but ignored in the US. Survived a decade before Google pulled the plug.",
    launched_year: 2004, launched_month: 1,
    discontinued_year: 2014, discontinued_month: 9,
    death_reason: 'strategic_pivot',
    postmortem: 'Orkut dominated Brazil with 30M users but Google chose to abandon it for Google+ rather than invest in a Brazil-focused product. A strategic misread that handed Brazil to Facebook.',
    website_url: 'https://orkut.com',
    era: '2000s',
  },
  {
    slug: 'bebo',
    name: 'Bebo',
    category: 'social',
    description: "Dominant social network in the UK and Ireland, acquired by AOL for $850M in 2008 — one of the worst tech acquisitions ever.",
    launched_year: 2005, launched_month: 7,
    discontinued_year: 2013, discontinued_month: 6,
    death_reason: 'acquired_shutdown',
    postmortem: 'AOL bought Bebo for $850M at its peak, then neglected it while Facebook consumed the UK market. AOL sold it for $10M in 2010. The founders bought it back for $1M in 2013, but the audience was gone.',
    website_url: 'https://bebo.com',
    era: '2000s',
  },
  {
    slug: 'app-net',
    name: 'App.net',
    category: 'social',
    description: 'Paid, ad-free alternative to Twitter built on open APIs. Raised $750K via crowdfunding, attracted developers and power users, died when both groups moved on.',
    launched_year: 2012, launched_month: 8,
    discontinued_year: 2017, discontinued_month: 3,
    death_reason: 'market_timing',
    postmortem: 'App.net was a decade ahead of the decentralized social movement. Its subscription model was right but the mainstream audience was not ready. Shut down after 5 years of slowly declining engagement.',
    website_url: 'https://app.net',
    era: '2010s',
  },
  {
    slug: 'ello',
    name: 'Ello',
    category: 'social',
    description: 'The "no ads, no data selling" social network that went viral in 2014 when Facebook began enforcing real names for drag performers.',
    launched_year: 2014, launched_month: 3,
    discontinued_year: 2023, discontinued_month: 5,
    death_reason: 'market_timing',
    postmortem: 'Ello rode a wave of privacy backlash to 35K invite requests per hour in 2014, then could not convert curiosity into habit. The audience it attracted — artists and creatives — did not grow into the scale needed to sustain the platform.',
    website_url: 'https://ello.co',
    era: '2010s',
  },
  {
    slug: 'posterous',
    name: 'Posterous',
    category: 'social',
    description: 'Dead-simple blogging platform that let you publish by sending an email. Beloved by writers who hated configuration.',
    launched_year: 2008, launched_month: 5,
    discontinued_year: 2013, discontinued_month: 4,
    death_reason: 'acquired_shutdown',
    postmortem: 'Twitter acquired Posterous in 2012 for the team, then shut it down 13 months later. A classic acqui-hire where the product was simply an inconvenient side effect.',
    website_url: 'https://posterous.com',
    era: '2000s',
  },
  {
    slug: 'peach',
    name: 'Peach',
    category: 'social',
    description: 'Playful social app from the founder of Tumblr with unique "magic words" commands. Viral for one week, gone in six months.',
    launched_year: 2016, launched_month: 1,
    discontinued_year: 2017, discontinued_month: 7,
    death_reason: 'execution',
    postmortem: "Peach's magic words were charming but not a network. Without a discovery mechanism, the app ran on FOMO — once Twitter stopped covering it, the audience vanished. No retention loop survived past the first week.",
    website_url: 'https://peach.cool',
    era: '2010s',
  },
  {
    slug: 'google-reader',
    name: 'Google Reader',
    category: 'productivity',
    description: 'RSS reader and the primary way millions of people consumed the web. Its shutdown in 2013 was mourned louder than almost any tech product death.',
    launched_year: 2005, launched_month: 10,
    discontinued_year: 2013, discontinued_month: 7,
    death_reason: 'strategic_pivot',
    postmortem: 'Google killed Reader to consolidate resources on Google+, betting the future was social streams. The decision was catastrophically wrong — RSS outlived Google+ by years. The backlash galvanized the open web movement.',
    website_url: 'https://google.com/reader',
    era: '2000s',
  },
  {
    slug: 'xanga',
    name: 'Xanga',
    category: 'social',
    description: 'Blogging and social network popular with teenagers in the early 2000s. Competed with LiveJournal for the emo-blog demographic.',
    launched_year: 2000, launched_month: 1,
    discontinued_year: 2013, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: 'Xanga failed to evolve past blogs into a social feed. By the time it ran a Kickstarter to save itself in 2013, the audience had long since moved to Facebook, Tumblr, and Twitter.',
    website_url: 'https://xanga.com',
    era: '2000s',
  },

  // ── Communication ──────────────────────────────────────────────────────────

  {
    slug: 'google-allo',
    name: 'Google Allo',
    category: 'communication',
    description: "Google's AI-first messaging app with Smart Reply and Google Assistant integration. Launched as Google fragmented its messaging strategy across 4 simultaneous apps.",
    launched_year: 2016, launched_month: 9,
    discontinued_year: 2019, discontinued_month: 3,
    death_reason: 'execution',
    postmortem: 'Allo launched alongside Google Duo while Hangouts still existed and Google was planning Messages. No single messaging strategy meant no one committed. Allo had no SMS integration, limiting its addressable audience from day one.',
    website_url: 'https://allo.google.com',
    era: '2010s',
  },
  {
    slug: 'google-hangouts-classic',
    name: 'Google Hangouts',
    category: 'communication',
    description: "Google's unified messaging platform that replaced Google Talk. Eventually sunsetted to make way for Google Chat and Meet.",
    launched_year: 2013, launched_month: 5,
    discontinued_year: 2022, discontinued_month: 11,
    death_reason: 'strategic_pivot',
    postmortem: 'Hangouts tried to be everything — SMS, video, chat — and became nothing. Google fragmented its messaging stack so many times that Hangouts users did not know where to go next. Chat and Meet replaced it but Hangouts loyalists remained angry.',
    website_url: 'https://hangouts.google.com',
    era: '2010s',
  },
  {
    slug: 'aim',
    name: 'AIM (AOL Instant Messenger)',
    category: 'communication',
    description: 'The dominant instant messaging platform of the early internet. Away messages were a cultural institution. Killed by AOL after 20 years.',
    launched_year: 1997, launched_month: 5,
    discontinued_year: 2017, discontinued_month: 12,
    death_reason: 'outcompeted',
    postmortem: 'AIM owned the instant messaging market through the 2000s but failed to adapt to mobile. By the time AOL tried to salvage it, iMessage, WhatsApp, and Facebook Messenger had absorbed its users entirely.',
    website_url: 'https://aim.com',
    era: '2000s',
  },
  {
    slug: 'yahoo-messenger',
    name: 'Yahoo Messenger',
    category: 'communication',
    description: "Yahoo's instant messaging client with video calling, file sharing, and a massive user base in Asia. Shut down after Yahoo declined to compete with Slack and WhatsApp.",
    launched_year: 1998, launched_month: 3,
    discontinued_year: 2018, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: 'Yahoo Messenger survived longer than anyone expected by retaining users in Southeast Asia, but Yahoo never invested to compete with mobile-first messaging. The 2013 Marissa Mayer reset killed institutional investment in it.',
    website_url: 'https://messenger.yahoo.com',
    era: '2000s',
  },
  {
    slug: 'windows-live-messenger',
    name: 'Windows Live Messenger',
    category: 'communication',
    description: "Microsoft's wildly popular desktop instant messaging client, successor to MSN Messenger. Merged into Skype in 2013.",
    launched_year: 2006, launched_month: 11,
    discontinued_year: 2013, discontinued_month: 10,
    death_reason: 'acquired_shutdown',
    postmortem: 'After Microsoft acquired Skype for $8.5B, it shut down Live Messenger and forced 330M users to migrate. Many users left for WhatsApp instead, handing Microsoft a migration it never recovered from.',
    website_url: 'https://messenger.live.com',
    era: '2000s',
  },
  {
    slug: 'hipchat',
    name: 'HipChat',
    category: 'communication',
    description: "Atlassian's team messaging platform, popular with development teams before Slack rewrote the category.",
    launched_year: 2010, launched_month: 3,
    discontinued_year: 2019, discontinued_month: 2,
    death_reason: 'outcompeted',
    postmortem: 'Slack redefined team chat with a superior UX and faster iteration. Atlassian sold HipChat to Slack in 2018 — a concession that Slack had definitively won. All data migrated to Slack.',
    website_url: 'https://hipchat.com',
    era: '2010s',
  },
  {
    slug: 'google-talk',
    name: 'Google Talk',
    category: 'communication',
    description: "Google's first instant messaging client, based on open XMPP standards. Replaced by Hangouts.",
    launched_year: 2005, launched_month: 8,
    discontinued_year: 2013, discontinued_month: 5,
    death_reason: 'strategic_pivot',
    postmortem: 'Google Talk was simple, fast, and federated — everything Google later abandoned. Its replacement Hangouts was slower and more feature-bloated. The XMPP ecosystem was killed when Google closed federation.',
    website_url: 'https://talk.google.com',
    era: '2000s',
  },

  // ── Productivity / Tools ───────────────────────────────────────────────────

  {
    slug: 'google-wave',
    name: 'Google Wave',
    category: 'productivity',
    description: 'Real-time collaborative document and messaging hybrid. Demoed to a standing ovation at Google I/O 2009. Shut down 16 months later.',
    launched_year: 2009, launched_month: 9,
    discontinued_year: 2010, discontinued_month: 12,
    death_reason: 'execution',
    postmortem: 'Wave tried to replace email and documents simultaneously with a new paradigm nobody could explain. Invitation-only launch created hype; actual use created confusion. The concept was brilliant — 15 years early.',
    website_url: 'https://wave.google.com',
    era: '2000s',
  },
  {
    slug: 'google-notebook',
    name: 'Google Notebook',
    category: 'productivity',
    description: 'Web clipping and note-taking tool that predated Evernote. Shut down in 2012 as Google simplified its product lineup.',
    launched_year: 2006, launched_month: 5,
    discontinued_year: 2012, discontinued_month: 7,
    death_reason: 'strategic_pivot',
    postmortem: 'Google Notebook was early and promising but was abandoned as Google shifted to Keep. The core use case survived but in a different product. Data migrated to Docs.',
    website_url: 'https://notebook.google.com',
    era: '2000s',
  },
  {
    slug: 'igoogle',
    name: 'iGoogle',
    category: 'productivity',
    description: 'Customizable Google homepage with widgets. The original personal dashboard, used by 100M people at peak.',
    launched_year: 2005, launched_month: 5,
    discontinued_year: 2013, discontinued_month: 11,
    death_reason: 'strategic_pivot',
    postmortem: 'iGoogle was killed as Google shifted its personalization efforts to Google+ and its social strategy. Users who relied on it for 8 years had no equivalent replacement. Sparked the "Google is not your friend" era of backlash.',
    website_url: 'https://igoogle.google.com',
    era: '2000s',
  },
  {
    slug: 'mailbox',
    name: 'Mailbox',
    category: 'productivity',
    description: 'Elegant mobile email app that popularized inbox-zero swipe gestures. Acquired by Dropbox for $100M.',
    launched_year: 2013, launched_month: 2,
    discontinued_year: 2015, discontinued_month: 12,
    death_reason: 'acquired_shutdown',
    postmortem: 'Dropbox acquired Mailbox to build a productivity suite, then pivoted strategy and killed it 22 months later. The team was integrated into Dropbox proper. Mailbox users went to Inbox by Gmail, which Google also killed.',
    website_url: 'https://mailboxapp.com',
    era: '2010s',
  },
  {
    slug: 'sunrise-calendar',
    name: 'Sunrise Calendar',
    category: 'productivity',
    description: 'Beautiful mobile calendar app with deep third-party integrations. Acquired by Microsoft and merged into Outlook.',
    launched_year: 2012, launched_month: 10,
    discontinued_year: 2016, discontinued_month: 8,
    death_reason: 'acquired_shutdown',
    postmortem: 'Microsoft acquired Sunrise for $100M to improve Outlook. The design talent and integration philosophy transferred, but the product was killed once its DNA was absorbed. Sunrise users accepted Outlook reluctantly.',
    website_url: 'https://sunrise.am',
    era: '2010s',
  },
  {
    slug: 'wunderlist',
    name: 'Wunderlist',
    category: 'productivity',
    description: 'The most beloved to-do list app in the App Store. Acquired by Microsoft for $100M and merged into Microsoft To Do.',
    launched_year: 2011, launched_month: 7,
    discontinued_year: 2020, discontinued_month: 5,
    death_reason: 'acquired_shutdown',
    postmortem: 'Microsoft acquired Wunderlist and rebuilt it as Microsoft To Do — a slower, less elegant clone. Users rated the replacement worse than the original for years. A cautionary tale of acqui-hiring a beloved consumer product.',
    website_url: 'https://wunderlist.com',
    era: '2010s',
  },
  {
    slug: 'springpad',
    name: 'Springpad',
    category: 'productivity',
    description: 'Evernote competitor with visual organization, barcode scanning, and smart recommendations. Shut down in 2014 when funding ran out.',
    launched_year: 2009, launched_month: 3,
    discontinued_year: 2014, discontinued_month: 6,
    death_reason: 'funding_failure',
    postmortem: 'Springpad had loyal users and smart features but could not raise enough to compete with Evernote at scale. Shut down in 2014 with 48 hours notice, data export only. A reminder that excellent product does not guarantee survival.',
    website_url: 'https://springpad.com',
    era: '2010s',
  },
  {
    slug: 'sparrow',
    name: 'Sparrow',
    category: 'productivity',
    description: 'The most acclaimed Mac and iOS email client of its era. Acquired by Google in 2012 for the team.',
    launched_year: 2010, launched_month: 4,
    discontinued_year: 2013, discontinued_month: 9,
    death_reason: 'acquired_shutdown',
    postmortem: 'Google acquired Sparrow for its design talent, immediately froze product development, and used the team to build Inbox by Gmail. Sparrow fans were furious. Google later killed Inbox too.',
    website_url: 'https://sparrowmailapp.com',
    era: '2010s',
  },
  {
    slug: 'rdio',
    name: 'Rdio',
    category: 'productivity',
    description: 'Music streaming service with a superior social discovery UI. Lost to Spotify on marketing budget and licensing costs.',
    launched_year: 2010, launched_month: 8,
    discontinued_year: 2015, discontinued_month: 11,
    death_reason: 'outcompeted',
    postmortem: 'Rdio built the best social music experience but was outmuscled on content deals and marketing. Spotify launched free tier and Pandora owned casual listening. Rdio filed for bankruptcy in 2015; key assets sold to Pandora for $75M.',
    website_url: 'https://rdio.com',
    era: '2010s',
  },
  {
    slug: 'grooveshark',
    name: 'Grooveshark',
    category: 'media',
    description: 'Music streaming service that allowed user-uploaded songs. Enormously popular before record labels won a $736M lawsuit that killed it.',
    launched_year: 2006, launched_month: 10,
    discontinued_year: 2015, discontinued_month: 4,
    death_reason: 'regulatory',
    postmortem: 'Grooveshark was music piracy wrapped in a streaming UI. It grew to 35M users before the major labels won a $736M copyright suit. Shut down immediately with a forced apology on the homepage.',
    website_url: 'https://grooveshark.com',
    era: '2000s',
  },
  {
    slug: 'everpix',
    name: 'Everpix',
    category: 'productivity',
    description: 'Automatic photo organization and intelligent deduplication service. Beloved by photographers, unable to survive on subscriptions alone.',
    launched_year: 2011, launched_month: 3,
    discontinued_year: 2013, discontinued_month: 11,
    death_reason: 'funding_failure',
    postmortem: 'Everpix had extraordinary product-market fit but burned through runway before it could scale. Its shutdown postmortem (published by The Verge) became a famous case study in why great products die: $500K ARR, $35K/month burn, no runway.',
    website_url: 'https://everpix.com',
    era: '2010s',
  },
  {
    slug: 'circa-news',
    name: 'Circa News',
    category: 'media',
    description: 'Mobile news app that atomized articles into digestible points and let users follow stories rather than publications.',
    launched_year: 2012, launched_month: 10,
    discontinued_year: 2015, discontinued_month: 6,
    death_reason: 'funding_failure',
    postmortem: 'Circa reimagined mobile news consumption and attracted a loyal audience, but could not find a monetization model that outpaced its content curation costs. Shut down six days before launch of its 2.0 version.',
    website_url: 'https://circa.com',
    era: '2010s',
  },
  {
    slug: 'songza',
    name: 'Songza',
    category: 'media',
    description: 'Playlist curation service organized by mood and activity. "What are you doing right now?" Acquired by Google and folded into Google Play Music.',
    launched_year: 2007, launched_month: 5,
    discontinued_year: 2015, discontinued_month: 8,
    death_reason: 'acquired_shutdown',
    postmortem: 'Google acquired Songza for its mood-based playlist methodology, integrated it into Google Play Music, then killed both Google Play Music and Songza when YouTube Music became the focus.',
    website_url: 'https://songza.com',
    era: '2000s',
  },

  // ── Hardware ───────────────────────────────────────────────────────────────

  {
    slug: 'microsoft-zune',
    name: 'Microsoft Zune',
    category: 'hardware',
    description: "Microsoft's answer to the iPod, featuring a social music-sharing mechanic and subscription model. Outsold by iPod 30:1 at its peak.",
    launched_year: 2006, launched_month: 11,
    discontinued_year: 2011, discontinued_month: 10,
    death_reason: 'outcompeted',
    postmortem: 'The Zune had genuinely superior audio quality and the Zune Pass subscription model was ahead of its time. But it launched two years after iPod + iTunes had locked in the ecosystem. Microsoft killed hardware in 2011 while keeping the software briefly alive.',
    website_url: 'https://zune.net',
    era: '2000s',
  },
  {
    slug: 'amazon-fire-phone',
    name: 'Amazon Fire Phone',
    category: 'hardware',
    description: "Amazon's 3D display smartphone with Dynamic Perspective and Firefly object recognition. Launched at $199 with contract, discontinued in 13 months.",
    launched_year: 2014, launched_month: 7,
    discontinued_year: 2015, discontinued_month: 8,
    death_reason: 'execution',
    postmortem: 'Fire Phone was designed around Amazon shopping rather than user needs. Price dropped to $0.99 in weeks. Amazon took a $170M writedown. Jeff Bezos publicly called it a useful failure. The UI was too alien and the app store too thin.',
    website_url: 'https://amazon.com/firephone',
    era: '2010s',
  },
  {
    slug: 'microsoft-kin',
    name: 'Microsoft Kin',
    category: 'hardware',
    description: "Social-focused feature phone for teens, launched and discontinued in 48 days — one of the fastest product deaths in consumer electronics history.",
    launched_year: 2010, launched_month: 5,
    discontinued_year: 2010, discontinued_month: 7,
    death_reason: 'execution',
    postmortem: 'Kin was developed for 3 years by a team of 900 engineers and killed 48 days after launch. The data plan was priced like a smartphone ($70/month) with features worse than a basic phone. Microsoft lost an estimated $240M.',
    website_url: 'https://microsoft.com/kin',
    era: '2010s',
  },
  {
    slug: 'google-glass',
    name: 'Google Glass',
    category: 'hardware',
    description: 'Augmented reality smart glasses that inspired a decade of wearable computing but failed commercially due to privacy concerns and $1,500 price.',
    launched_year: 2013, launched_month: 4,
    discontinued_year: 2023, discontinued_month: 3,
    death_reason: 'market_timing',
    postmortem: 'Glass was the right product concept 10 years early. The always-on camera caused "Glassholes" backlash. Enterprise pivoted better than consumer but eventually Meta and Apple overtook the concept with better hardware.',
    website_url: 'https://google.com/glass',
    era: '2010s',
  },
  {
    slug: 'pebble-smartwatch',
    name: 'Pebble',
    category: 'hardware',
    description: 'The Kickstarter-launched smartwatch that proved wearable demand before Apple Watch. Acquired by Fitbit in 2016.',
    launched_year: 2012, launched_month: 1,
    discontinued_year: 2016, discontinued_month: 12,
    death_reason: 'outcompeted',
    postmortem: 'Pebble created the smartwatch category with a $10M Kickstarter, but Apple Watch and Android Wear erased its hardware advantage. Sold to Fitbit for parts; Fitbit later acquired by Google. A pioneer that became a footnote.',
    website_url: 'https://pebble.com',
    era: '2010s',
  },
  {
    slug: 'jawbone-up',
    name: 'Jawbone UP',
    category: 'health',
    description: 'Fitness tracker wristband that competed with Fitbit. Jawbone raised $930M and went bankrupt without selling a single share publicly.',
    launched_year: 2011, launched_month: 11,
    discontinued_year: 2017, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: 'Jawbone spent a decade in hardware, raised $930M, and liquidated without ever going public. Hardware quality issues plagued early bands. Fitbit dominated the mass market while Apple Watch took the premium tier.',
    website_url: 'https://jawbone.com',
    era: '2010s',
  },
  {
    slug: 'amazon-dash-button',
    name: 'Amazon Dash Button',
    category: 'hardware',
    description: 'Physical WiFi button for one-click reordering of household supplies. A clever IoT experiment discontinued when voice ordering and Subscribe & Save made it redundant.',
    launched_year: 2015, launched_month: 3,
    discontinued_year: 2019, discontinued_month: 8,
    death_reason: 'strategic_pivot',
    postmortem: 'Dash Button was a clever hack for Amazon loyalty but created EU regulatory problems (pre-purchase price confirmation required). Alexa and Subscribe & Save made it unnecessary. Discontinued after 4 years.',
    website_url: 'https://amazon.com/dash',
    era: '2010s',
  },

  // ── Gaming ─────────────────────────────────────────────────────────────────

  {
    slug: 'google-stadia',
    name: 'Google Stadia',
    category: 'gaming',
    description: 'Cloud gaming platform that promised console-quality streaming from any device. Shut down 3 years after launch despite $200M+ investment.',
    launched_year: 2019, launched_month: 11,
    discontinued_year: 2023, discontinued_month: 1,
    death_reason: 'execution',
    postmortem: 'Stadia had the infrastructure advantage (Google owns the internet backbone) but launched without exclusive games and at a premium price. Streaming latency was solved; the game library never was. Refunded all purchases on shutdown — a rare act of grace.',
    website_url: 'https://stadia.google.com',
    era: '2010s',
  },
  {
    slug: 'onlive',
    name: 'OnLive',
    category: 'gaming',
    description: 'Cloud gaming pioneer that launched years before the technology and infrastructure could support it. Went bankrupt in 2012.',
    launched_year: 2010, launched_month: 6,
    discontinued_year: 2015, discontinued_month: 4,
    death_reason: 'market_timing',
    postmortem: 'OnLive had the right idea 10 years early. Broadband in 2010 could not reliably deliver the latency cloud gaming requires. The company collapsed under debt before fiber made the concept viable.',
    website_url: 'https://onlive.com',
    era: '2010s',
  },
  {
    slug: 'ouya',
    name: 'Ouya',
    category: 'gaming',
    description: '$99 Android-powered microconsole that raised $8.6M on Kickstarter. Failed to attract developers or compete with established consoles.',
    launched_year: 2013, launched_month: 6,
    discontinued_year: 2015, discontinued_month: 7,
    death_reason: 'execution',
    postmortem: 'Ouya proved Kickstarter funding ≠ product-market fit. The controller had dead zones, the app store was sparse, and the $99 price was too high for casual games but too low for serious titles. Acquired by Razer and immediately killed.',
    website_url: 'https://ouya.tv',
    era: '2010s',
  },
  {
    slug: 'microsoft-mixer',
    name: 'Microsoft Mixer',
    category: 'gaming',
    description: "Microsoft's game streaming platform with interactive features and low latency. Signed Ninja and Shroud for $10M+, then shut down 2 years later.",
    launched_year: 2016, launched_month: 5,
    discontinued_year: 2020, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: "Microsoft paid Ninja $20-30M to leave Twitch, generating enormous press — then couldn't grow the platform around him. Twitch's network effect was unassailable. Mixer merged with Facebook Gaming upon shutdown.",
    website_url: 'https://mixer.com',
    era: '2010s',
  },

  // ── Mobile ─────────────────────────────────────────────────────────────────

  {
    slug: 'windows-phone',
    name: 'Windows Phone',
    category: 'mobile',
    description: "Microsoft's mobile operating system with a distinctive live tile UI. Peaked at 3% global market share before collapsing under app gap.",
    launched_year: 2010, launched_month: 10,
    discontinued_year: 2017, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: 'Windows Phone had a genuinely innovative UI but launched 3 years after iPhone and 2 after Android. Microsoft acquired Nokia for $7.2B and wrote it down for $7.6B two years later. The app gap was fatal: major apps came 2-3 years late or never.',
    website_url: 'https://microsoft.com/windowsphone',
    era: '2010s',
  },
  {
    slug: 'blackberry-10',
    name: 'BlackBerry 10',
    category: 'mobile',
    description: "BlackBerry's final attempt to compete in smartphones. Launched to strong reviews but arrived 2 years too late to reverse market share collapse.",
    launched_year: 2013, launched_month: 1,
    discontinued_year: 2022, discontinued_month: 1,
    death_reason: 'outcompeted',
    postmortem: 'BB10 was technically excellent but enterprise IT had already standardized on iOS and Android. When governments and banks stopped mandating BlackBerry, the audience evaporated. Software support ended Jan 2022.',
    website_url: 'https://blackberry.com',
    era: '2010s',
  },
  {
    slug: 'firefox-os',
    name: 'Firefox OS',
    category: 'mobile',
    description: 'Mozilla-backed open web mobile OS targeting emerging markets with $25 smartphones. Abandoned after carriers failed to distribute at scale.',
    launched_year: 2013, launched_month: 7,
    discontinued_year: 2016, discontinued_month: 5,
    death_reason: 'execution',
    postmortem: 'Firefox OS had noble goals — open web as platform — but the hardware was too underpowered and carrier partnerships too slow. Android One solved the same emerging market problem more effectively.',
    website_url: 'https://mozilla.org/firefox-os',
    era: '2010s',
  },
  {
    slug: 'palm-webos',
    name: 'Palm webOS',
    category: 'mobile',
    description: 'Critically acclaimed mobile OS known for card-based multitasking and gesture navigation. Acquired by HP for $1.2B, killed 49 days after launch.',
    launched_year: 2009, launched_month: 6,
    discontinued_year: 2011, discontinued_month: 8,
    death_reason: 'acquired_shutdown',
    postmortem: 'WebOS was ahead of iOS in multitasking and gestures. HP acquired Palm for $1.2B, launched the TouchPad tablet, then discontinued all webOS hardware 49 days later after slow sales. Sold to LG for smart TVs.',
    website_url: 'https://palm.com',
    era: '2000s',
  },

  // ── Media / Entertainment ──────────────────────────────────────────────────

  {
    slug: 'quibi',
    name: 'Quibi',
    category: 'media',
    description: 'Mobile-first short-form video streaming platform backed by $1.75B and Jeffrey Katzenberg. Shut down 6 months after launch.',
    launched_year: 2020, launched_month: 4,
    discontinued_year: 2020, discontinued_month: 10,
    death_reason: 'execution',
    postmortem: 'Quibi launched during COVID when everyone was home on large screens — not commuting on phones. The content was polished but indistinguishable from Netflix shorts. No social features, no free tier, no casting. Returned $350M to investors on shutdown.',
    website_url: 'https://quibi.com',
    era: '2020s',
  },
  {
    slug: 'turntable-fm',
    name: 'Turntable.fm',
    category: 'media',
    description: 'Collaborative DJ room app where users took turns playing music for a crowd of avatars. A cult product killed by music licensing costs.',
    launched_year: 2011, launched_month: 5,
    discontinued_year: 2014, discontinued_month: 12,
    death_reason: 'regulatory',
    postmortem: 'Turntable.fm was so fun it felt illegal — because it nearly was. Music licensing costs were 100%+ of revenue. DMCA compliance made it US-only. Shut down after 3.5 years with a beloved community and zero financial path forward.',
    website_url: 'https://turntable.fm',
    era: '2010s',
  },
  {
    slug: 'lala',
    name: 'Lala',
    category: 'media',
    description: 'Pioneering cloud music service that let users stream any song once free and purchase web songs for $0.10. Acquired by Apple and shut down.',
    launched_year: 2006, launched_month: 11,
    discontinued_year: 2010, discontinued_month: 5,
    death_reason: 'acquired_shutdown',
    postmortem: 'Apple acquired Lala for $80M and shut it down 6 months later to prevent Amazon and Google from licensing the technology. The team went to iCloud. iTunes Match was the spiritual successor.',
    website_url: 'https://lala.com',
    era: '2000s',
  },
  {
    slug: 'yahoo-screen',
    name: 'Yahoo Screen',
    category: 'media',
    description: "Yahoo's video streaming platform that briefly hosted Community Season 6. A $42M content bet that failed to generate meaningful viewership.",
    launched_year: 2009, launched_month: 1,
    discontinued_year: 2016, discontinued_month: 1,
    death_reason: 'execution',
    postmortem: 'Yahoo spent $42M to rescue Community then found nobody watched it on their platform. The content was good; Yahoo had no audience for long-form video. Marissa Mayer admitted the investment did not work.',
    website_url: 'https://screen.yahoo.com',
    era: '2010s',
  },
  {
    slug: 'google-video',
    name: 'Google Video',
    category: 'media',
    description: "Google's own video platform before it acquired YouTube. Allowed paid video downloads including NBA games and CBS shows.",
    launched_year: 2005, launched_month: 1,
    discontinued_year: 2012, discontinued_month: 8,
    death_reason: 'acquired_shutdown',
    postmortem: 'Google launched its own video platform, watched YouTube achieve escape velocity, and then acquired YouTube for $1.65B. Google Video was quietly wound down as YouTube became the definitive answer.',
    website_url: 'https://video.google.com',
    era: '2000s',
  },

  // ── Finance / Commerce ─────────────────────────────────────────────────────

  {
    slug: 'wesabe',
    name: 'Wesabe',
    category: 'finance',
    description: 'Personal finance app competing with Mint. Had more privacy protections but a worse user experience. Lost to Mint and shut down in 2010.',
    launched_year: 2006, launched_month: 11,
    discontinued_year: 2010, discontinued_month: 7,
    death_reason: 'outcompeted',
    postmortem: 'Wesabe built a more private, community-driven Mint but lost on UX. Mint automatically categorized transactions; Wesabe required manual tagging. The founder published a famous postmortem: "Mint focused on the problem. We focused on the community." Wrong order.',
    website_url: 'https://wesabe.com',
    era: '2000s',
  },
  {
    slug: 'blippy',
    name: 'Blippy',
    category: 'social',
    description: 'Social network for sharing purchases — every credit card transaction posted publicly. Shut down after a data breach exposed full credit card numbers.',
    launched_year: 2009, launched_month: 11,
    discontinued_year: 2011, discontinued_month: 7,
    death_reason: 'execution',
    postmortem: 'Blippy was a product that should not exist — social credit card sharing is a privacy nightmare. A 2010 Google bug cached full card numbers in search results. The premise was invalidated before the idea was ever proven.',
    website_url: 'https://blippy.com',
    era: '2000s',
  },

  // ── Dev Tools / Analytics ──────────────────────────────────────────────────

  {
    slug: 'parse-platform',
    name: 'Parse',
    category: 'dev-tools',
    description: 'Mobile Backend-as-a-Service acquired by Facebook for $85M. Shut down 4 years later as Facebook focused on its own infrastructure.',
    launched_year: 2011, launched_month: 7,
    discontinued_year: 2017, discontinued_month: 1,
    death_reason: 'acquired_shutdown',
    postmortem: 'Parse was the gold standard for mobile backend tooling. Facebook killed it in 2017 after failing to monetize it. Open-sourced before shutdown — the community maintained Parse Server. A rare graceful acqui-kill.',
    website_url: 'https://parseplatform.org',
    era: '2010s',
  },
  {
    slug: 'google-code',
    name: 'Google Code',
    category: 'dev-tools',
    description: "Google's source code hosting and bug tracking platform. Predated GitHub and was once the standard for open source project hosting.",
    launched_year: 2006, launched_month: 7,
    discontinued_year: 2016, discontinued_month: 1,
    death_reason: 'outcompeted',
    postmortem: "GitHub's superior UX and social features made Google Code redundant within 4 years of GitHub's launch. Google redirected users to GitHub. A product that was winning until a better one arrived.",
    website_url: 'https://code.google.com',
    era: '2000s',
  },
  {
    slug: 'yahoo-pipes',
    name: 'Yahoo Pipes',
    category: 'dev-tools',
    description: 'Visual programming environment for remixing and aggregating web feeds. A cult developer tool killed in the 2014 Yahoo cleanup.',
    launched_year: 2007, launched_month: 2,
    discontinued_year: 2015, discontinued_month: 9,
    death_reason: 'strategic_pivot',
    postmortem: 'Yahoo Pipes was genuinely innovative — a visual no-code data pipeline 15 years before Zapier mainstreamed the concept. Yahoo killed it as part of 2014 austerity cuts, frustrating its loyal developer base.',
    website_url: 'https://pipes.yahoo.com',
    era: '2000s',
  },
  {
    slug: 'google-url-shortener',
    name: 'Google URL Shortener',
    category: 'dev-tools',
    description: "Google's goo.gl URL shortening service. Had analytics, QR code generation, and massive scale. Shut down in favor of Firebase Dynamic Links.",
    launched_year: 2009, launched_month: 12,
    discontinued_year: 2019, discontinued_month: 3,
    death_reason: 'strategic_pivot',
    postmortem: 'Google deprecated goo.gl to push Firebase Dynamic Links for app developers. Consumer users had no migration path. Bit.ly survived the transition; Google\'s own shortener did not.',
    website_url: 'https://goo.gl',
    era: '2000s',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Dead Products Seeder ===`)
  console.log(`Products to upsert: ${DEAD_PRODUCTS.length}\n`)

  const rows = DEAD_PRODUCTS.map(p => ({
    slug: p.slug ?? slugify(p.name),
    name: p.name,
    category: p.category,
    description: p.description,
    launched_year: p.launched_year,
    launched_month: p.launched_month,
    discontinued_year: p.discontinued_year,
    discontinued_month: p.discontinued_month,
    status: 'dead' as const,
    death_reason: p.death_reason,
    postmortem: p.postmortem,
    ...(p.website_url ? { website_url: p.website_url } : {}),
    ...(p.era ? { era: p.era } : {}),
    updated_at: new Date().toISOString(),
  }))

  let totalUpserted = 0
  let totalErrors = 0

  for (const batch of chunk(rows, 50)) {
    const { error, count } = await db
      .from('products')
      .upsert(batch, { onConflict: 'slug', count: 'exact' })

    if (error) {
      console.error(`  ✗ Batch error:`, error.message)
      totalErrors += batch.length
    } else {
      totalUpserted += batch.length
      console.log(`  ✓ Upserted batch of ${batch.length} (total: ${totalUpserted})`)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Upserted: ${totalUpserted}`)
  console.log(`Errors:   ${totalErrors}`)
  console.log(`\nRun "npm run mark:dead" to compute any additional products from signals.`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
