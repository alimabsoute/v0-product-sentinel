"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { products, categories, CATEGORY_INFO } from "@/lib/mock-data"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  Filter,
  ChevronDown,
  Skull,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Decades for view selection
const decades = [
  { label: "1970s", start: 1970, end: 1979 },
  { label: "1980s", start: 1980, end: 1989 },
  { label: "1990s", start: 1990, end: 1999 },
  { label: "2000s", start: 2000, end: 2009 },
  { label: "2010s", start: 2010, end: 2019 },
  { label: "2020s", start: 2020, end: 2029 },
]

// Mock historical data showing how characteristics evolved through decades
const characteristicEvolution = [
  {
    characteristic: "Pricing Model",
    timeline: [
      { year: 1975, dominant: "One-Time License", percentage: 95, description: "Software sold as perpetual license, often bundled with hardware" },
      { year: 1985, dominant: "Retail Box", percentage: 88, description: "Shrink-wrapped software sold in stores" },
      { year: 1995, dominant: "Enterprise License", percentage: 72, description: "Per-seat licensing for businesses" },
      { year: 2000, dominant: "Shareware", percentage: 45, description: "Try before you buy, honor system" },
      { year: 2005, dominant: "Freemium Web", percentage: 38, description: "Free basic, paid premium emerged" },
      { year: 2010, dominant: "SaaS Monthly", percentage: 52, description: "Monthly subscription model takes hold" },
      { year: 2015, dominant: "Freemium", percentage: 61, description: "Free tiers became expected" },
      { year: 2020, dominant: "Usage-Based", percentage: 45, description: "Pay-per-use models emerged" },
      { year: 2023, dominant: "AI Credits", percentage: 48, description: "Token/credit systems for AI products" },
      { year: 2025, dominant: "Outcome-Based", percentage: 35, description: "Pay for results, not usage" },
    ]
  },
  {
    characteristic: "Target User",
    timeline: [
      { year: 1975, dominant: "Engineers", percentage: 95, description: "Only technical experts could use computers" },
      { year: 1985, dominant: "Business Users", percentage: 65, description: "Spreadsheets brought PCs to offices" },
      { year: 1995, dominant: "Home Users", percentage: 55, description: "Windows 95 brought PCs mainstream" },
      { year: 2000, dominant: "Web Surfers", percentage: 62, description: "Everyone got online" },
      { year: 2005, dominant: "Creators", percentage: 48, description: "YouTube, blogs democratized content" },
      { year: 2010, dominant: "Mobile Users", percentage: 71, description: "Smartphones changed everything" },
      { year: 2015, dominant: "Developers", percentage: 55, description: "Dev tools renaissance" },
      { year: 2020, dominant: "Remote Workers", percentage: 68, description: "COVID shifted to distributed teams" },
      { year: 2023, dominant: "Everyone", percentage: 82, description: "AI democratized complex tools" },
      { year: 2025, dominant: "Individuals", percentage: 44, description: "Personal AI assistants" },
    ]
  },
  {
    characteristic: "Core Technology",
    timeline: [
      { year: 1975, dominant: "Mainframe", percentage: 92, description: "Centralized computing, time-sharing" },
      { year: 1985, dominant: "Personal Computer", percentage: 78, description: "IBM PC and clones dominate" },
      { year: 1995, dominant: "Client-Server", percentage: 65, description: "Networked applications" },
      { year: 2000, dominant: "Web 1.0", percentage: 72, description: "Static websites, e-commerce" },
      { year: 2005, dominant: "Web 2.0", percentage: 68, description: "Dynamic, social, user-generated" },
      { year: 2010, dominant: "Mobile/Cloud", percentage: 75, description: "Apps and cloud services" },
      { year: 2015, dominant: "API-First", percentage: 58, description: "Microservices, composability" },
      { year: 2020, dominant: "No-Code", percentage: 52, description: "Visual builders proliferated" },
      { year: 2023, dominant: "LLMs", percentage: 71, description: "ChatGPT sparked AI revolution" },
      { year: 2025, dominant: "Multi-Modal AI", percentage: 63, description: "Text, image, video unified" },
    ]
  },
  {
    characteristic: "Distribution",
    timeline: [
      { year: 1975, dominant: "Direct Sales", percentage: 90, description: "Salespeople and consultants" },
      { year: 1985, dominant: "Retail Stores", percentage: 72, description: "Computer stores, mail order" },
      { year: 1995, dominant: "OEM Bundling", percentage: 65, description: "Pre-installed on new PCs" },
      { year: 2000, dominant: "Download Sites", percentage: 58, description: "CNET, Tucows, direct downloads" },
      { year: 2005, dominant: "App Stores", percentage: 62, description: "iTunes, later mobile stores" },
      { year: 2010, dominant: "Viral/Social", percentage: 55, description: "Facebook apps, social sharing" },
      { year: 2015, dominant: "Content Marketing", percentage: 48, description: "Blogs, SEO, inbound" },
      { year: 2020, dominant: "PLG", percentage: 52, description: "Product-led growth dominated" },
      { year: 2023, dominant: "Viral Demos", percentage: 55, description: "Show, don't tell worked best" },
      { year: 2025, dominant: "AI Discovery", percentage: 47, description: "AI recommends tools" },
    ]
  }
]

// Category growth over time (modern era)
const categoryGrowthData = [
  { category: "ai-tools", years: { 2020: 45, 2021: 89, 2022: 156, 2023: 412, 2024: 687, 2025: 890 } },
  { category: "developer-tools", years: { 2020: 234, 2021: 267, 2022: 298, 2023: 345, 2024: 389, 2025: 412 } },
  { category: "productivity", years: { 2020: 189, 2021: 212, 2022: 245, 2023: 278, 2024: 312, 2025: 356 } },
  { category: "design", years: { 2020: 134, 2021: 156, 2022: 178, 2023: 201, 2024: 223, 2025: 245 } },
  { category: "analytics", years: { 2020: 98, 2021: 112, 2022: 128, 2023: 145, 2024: 167, 2025: 189 } },
  { category: "finance", years: { 2020: 67, 2021: 78, 2022: 89, 2023: 102, 2024: 118, 2025: 134 } },
]

// Comprehensive market milestones from 1970s to present
const milestones = [
  // 1970s - The Dawn
  { year: 1971, month: "Nov", event: "Intel 4004 Released", description: "First commercial microprocessor enables personal computing", impact: "critical", era: "1970s" },
  { year: 1975, month: "Jan", event: "Altair 8800", description: "First personal computer kit sparks hobbyist revolution", impact: "critical", era: "1970s" },
  { year: 1975, month: "Apr", event: "Microsoft Founded", description: "Gates and Allen start the software giant", impact: "critical", era: "1970s" },
  { year: 1976, month: "Apr", event: "Apple Computer Founded", description: "Jobs and Wozniak start in a garage", impact: "critical", era: "1970s" },
  { year: 1977, month: "Jun", event: "Apple II Ships", description: "First mass-produced personal computer", impact: "high", era: "1970s" },
  { year: 1978, month: "Jun", event: "VisiCalc Development Begins", description: "First spreadsheet would define business computing", impact: "high", era: "1970s" },
  { year: 1979, month: "Oct", event: "VisiCalc Released", description: "The killer app that sold computers to businesses", impact: "critical", era: "1970s" },
  
  // 1980s - The PC Revolution
  { year: 1981, month: "Aug", event: "IBM PC Launched", description: "IBM legitimizes personal computers for business", impact: "critical", era: "1980s" },
  { year: 1982, month: "Jan", event: "Lotus 1-2-3 Announced", description: "Spreadsheet that dominated business computing", impact: "high", era: "1980s" },
  { year: 1983, month: "Jan", event: "Lotus 1-2-3 Ships", description: "Becomes best-selling software, defines PC era", impact: "critical", era: "1980s" },
  { year: 1984, month: "Jan", event: "Macintosh Introduced", description: "GUI computing goes mainstream with iconic 1984 ad", impact: "critical", era: "1980s" },
  { year: 1985, month: "Nov", event: "Windows 1.0", description: "Microsoft enters GUI market, humble beginnings", impact: "medium", era: "1980s" },
  { year: 1985, month: "Jul", event: "PageMaker Released", description: "Desktop publishing revolution begins", impact: "high", era: "1980s" },
  { year: 1987, month: "Apr", event: "PowerPoint 1.0", description: "Presentation software changes business communication", impact: "high", era: "1980s" },
  { year: 1988, month: "Jun", event: "Photoshop Development", description: "Knoll brothers create the image editor", impact: "high", era: "1980s" },
  { year: 1989, month: "Mar", event: "World Wide Web Proposed", description: "Tim Berners-Lee proposes the web at CERN", impact: "critical", era: "1980s" },
  
  // 1990s - The Internet Age
  { year: 1990, month: "Feb", event: "Photoshop 1.0 Ships", description: "Adobe ships the tool that defines digital imaging", impact: "critical", era: "1990s" },
  { year: 1990, month: "May", event: "Windows 3.0", description: "Windows finally becomes usable, mass adoption begins", impact: "high", era: "1990s" },
  { year: 1991, month: "Aug", event: "Linux Announced", description: "Linus Torvalds posts about his hobby project", impact: "critical", era: "1990s" },
  { year: 1993, month: "Apr", event: "Mosaic Browser", description: "First popular web browser brings internet to masses", impact: "critical", era: "1990s" },
  { year: 1994, month: "Oct", event: "Netscape Founded", description: "Commercial web era begins", impact: "high", era: "1990s" },
  { year: 1995, month: "Aug", event: "Windows 95", description: "Computing goes truly mainstream, Start button era", impact: "critical", era: "1990s" },
  { year: 1995, month: "Jul", event: "Amazon.com Launches", description: "E-commerce era begins with online bookstore", impact: "critical", era: "1990s" },
  { year: 1995, month: "Sep", event: "eBay Founded", description: "Person-to-person e-commerce platform", impact: "high", era: "1990s" },
  { year: 1996, month: "Aug", event: "ICQ Released", description: "Instant messaging goes mainstream", impact: "high", era: "1990s" },
  { year: 1997, month: "Sep", event: "Google Domain Registered", description: "Page and Brin register google.com", impact: "critical", era: "1990s" },
  { year: 1998, month: "Sep", event: "Google Incorporated", description: "The search engine that changed everything", impact: "critical", era: "1990s" },
  { year: 1999, month: "Feb", event: "Salesforce Founded", description: "SaaS model begins, No Software", impact: "critical", era: "1990s" },
  { year: 1999, month: "Jun", event: "Napster Launches", description: "P2P file sharing disrupts music industry", impact: "high", era: "1990s" },
  
  // 2000s - Web 2.0 & Mobile
  { year: 2000, month: "Mar", event: "Dot-Com Bubble Peaks", description: "NASDAQ hits 5,048 before crash", impact: "critical", era: "2000s" },
  { year: 2001, month: "Jan", event: "Wikipedia Launches", description: "Collaborative knowledge platform", impact: "high", era: "2000s" },
  { year: 2001, month: "Oct", event: "iPod Released", description: "Apple enters consumer electronics", impact: "high", era: "2000s" },
  { year: 2003, month: "Feb", event: "LinkedIn Launches", description: "Professional networking goes online", impact: "medium", era: "2000s" },
  { year: 2004, month: "Feb", event: "Facebook Founded", description: "Social networking changes human connection", impact: "critical", era: "2000s" },
  { year: 2004, month: "Oct", event: "Web 2.0 Conference", description: "Term coined, user-generated content era", impact: "high", era: "2000s" },
  { year: 2005, month: "Feb", event: "YouTube Founded", description: "Video sharing democratizes broadcasting", impact: "critical", era: "2000s" },
  { year: 2006, month: "Mar", event: "Twitter Launches", description: "Microblogging changes communication", impact: "high", era: "2000s" },
  { year: 2006, month: "Aug", event: "AWS Launches EC2", description: "Cloud computing infrastructure begins", impact: "critical", era: "2000s" },
  { year: 2007, month: "Jan", event: "iPhone Announced", description: "Steve Jobs reveals the smartphone revolution", impact: "critical", era: "2000s" },
  { year: 2007, month: "Jun", event: "iPhone Ships", description: "Mobile computing goes mainstream", impact: "critical", era: "2000s" },
  { year: 2008, month: "Jul", event: "App Store Opens", description: "Mobile app economy begins", impact: "critical", era: "2000s" },
  { year: 2008, month: "Sep", event: "Android 1.0", description: "Google mobile OS creates competition", impact: "high", era: "2000s" },
  { year: 2008, month: "Oct", event: "GitHub Launches", description: "Social coding transforms development", impact: "high", era: "2000s" },
  { year: 2009, month: "Jan", event: "WhatsApp Founded", description: "Mobile messaging disrupts SMS", impact: "high", era: "2000s" },
  
  // 2010s - Cloud & Mobile First
  { year: 2010, month: "Apr", event: "iPad Released", description: "Tablet computing creates new category", impact: "high", era: "2010s" },
  { year: 2010, month: "Oct", event: "Instagram Launches", description: "Photo sharing goes mobile-first", impact: "high", era: "2010s" },
  { year: 2011, month: "Oct", event: "Siri Announced", description: "Voice assistants enter mainstream", impact: "medium", era: "2010s" },
  { year: 2012, month: "Apr", event: "Facebook Buys Instagram", description: "$1B acquisition shocks industry", impact: "medium", era: "2010s" },
  { year: 2012, month: "Sep", event: "Figma Founded", description: "Browser-based design tools begin", impact: "high", era: "2010s" },
  { year: 2013, month: "Mar", event: "Notion Founded", description: "All-in-one workspace concept", impact: "medium", era: "2010s" },
  { year: 2013, month: "Sep", event: "Slack Launches", description: "Team communication reimagined", impact: "high", era: "2010s" },
  { year: 2014, month: "Nov", event: "Amazon Echo", description: "Smart speakers create new platform", impact: "medium", era: "2010s" },
  { year: 2015, month: "Nov", event: "TensorFlow Open Sourced", description: "Google opens ML framework to all", impact: "high", era: "2010s" },
  { year: 2016, month: "Jul", event: "Pokemon GO", description: "AR goes mainstream overnight", impact: "medium", era: "2010s" },
  { year: 2017, month: "Jun", event: "Transformers Paper", description: "Attention Is All You Need changes AI", impact: "critical", era: "2010s" },
  { year: 2018, month: "Jun", event: "GPT-1 Released", description: "OpenAI releases first generative model", impact: "high", era: "2010s" },
  { year: 2018, month: "Oct", event: "BERT Released", description: "Google advances NLP significantly", impact: "high", era: "2010s" },
  { year: 2019, month: "Feb", event: "GPT-2 Released", description: "Too dangerous to release fully becomes meme", impact: "medium", era: "2010s" },
  { year: 2019, month: "Dec", event: "Linear Launches", description: "Issue tracking reimagined for speed", impact: "medium", era: "2010s" },
  
  // 2020s - AI Revolution
  { year: 2020, month: "Mar", event: "Remote Work Boom", description: "COVID accelerates digital tool adoption globally", impact: "critical", era: "2020s" },
  { year: 2020, month: "Jun", event: "GPT-3 Released", description: "Large language models show true potential", impact: "critical", era: "2020s" },
  { year: 2020, month: "Sep", event: "No-Code Summer", description: "Webflow, Notion, Airtable hit mainstream", impact: "high", era: "2020s" },
  { year: 2021, month: "Jan", event: "GitHub Copilot Preview", description: "AI pair programming begins", impact: "high", era: "2020s" },
  { year: 2021, month: "Apr", event: "Creator Economy Peak", description: "Tools for creators flood the market", impact: "medium", era: "2020s" },
  { year: 2021, month: "Nov", event: "Web3 Frenzy", description: "Crypto/NFT tools everywhere (most now dead)", impact: "low", era: "2020s" },
  { year: 2022, month: "Apr", event: "DALL-E 2 Released", description: "AI image generation shocks creatives", impact: "high", era: "2020s" },
  { year: 2022, month: "Jul", event: "Midjourney Beta", description: "AI art becomes accessible to all", impact: "high", era: "2020s" },
  { year: 2022, month: "Aug", event: "Stable Diffusion", description: "Open source AI image model releases", impact: "high", era: "2020s" },
  { year: 2022, month: "Nov", event: "ChatGPT Launch", description: "Everything changes overnight - fastest to 100M users", impact: "critical", era: "2020s" },
  { year: 2023, month: "Mar", event: "GPT-4 Released", description: "Multi-modal AI reaches new heights", impact: "critical", era: "2020s" },
  { year: 2023, month: "Mar", event: "AI Tool Explosion", description: "1000+ AI wrappers launch in weeks", impact: "high", era: "2020s" },
  { year: 2023, month: "Jul", event: "The Great Culling", description: "Undifferentiated AI tools start dying", impact: "medium", era: "2020s" },
  { year: 2023, month: "Sep", event: "Claude 2 Released", description: "Anthropic emerges as major AI player", impact: "high", era: "2020s" },
  { year: 2024, month: "Feb", event: "Sora Announced", description: "AI video generation preview stuns world", impact: "high", era: "2020s" },
  { year: 2024, month: "Feb", event: "Agent Era Begins", description: "Autonomous AI agents gain traction", impact: "high", era: "2020s" },
  { year: 2024, month: "May", event: "GPT-4o Released", description: "Real-time multimodal AI becomes reality", impact: "high", era: "2020s" },
  { year: 2024, month: "Aug", event: "Consolidation Wave", description: "Major acquisitions reshape landscape", impact: "medium", era: "2020s" },
  { year: 2025, month: "Jan", event: "Multi-Modal Standard", description: "Text+Image+Video becomes baseline", impact: "high", era: "2020s" },
]

// Historical products by era
const historicalProducts = {
  "1970s": [
    { name: "VisiCalc", year: 1979, status: "dead", note: "First spreadsheet, killed by Lotus 1-2-3", category: "Productivity" },
    { name: "WordStar", year: 1978, status: "dead", note: "Dominant word processor of early PC era", category: "Productivity" },
    { name: "CP/M", year: 1974, status: "dead", note: "Dominant OS before MS-DOS", category: "Operating System" },
    { name: "MITS Altair", year: 1975, status: "dead", note: "First personal computer kit, sparked revolution", category: "Hardware" },
  ],
  "1980s": [
    { name: "Lotus 1-2-3", year: 1983, status: "dead", note: "Dominated spreadsheets, killed by Excel", category: "Productivity" },
    { name: "dBase", year: 1980, status: "dead", note: "First major database, lost to Access/SQL", category: "Database" },
    { name: "PageMaker", year: 1985, status: "dead", note: "Desktop publishing pioneer, replaced by InDesign", category: "Design" },
    { name: "HyperCard", year: 1987, status: "dead", note: "Revolutionary multimedia tool, discontinued by Apple", category: "Development" },
    { name: "MacPaint", year: 1984, status: "dead", note: "First popular graphics program for consumers", category: "Design" },
    { name: "WordPerfect", year: 1980, status: "dead", note: "Word processor king, dethroned by MS Word", category: "Productivity" },
    { name: "CompuServe", year: 1979, status: "dead", note: "First major online service, obsoleted by web", category: "Communication" },
    { name: "Prodigy", year: 1984, status: "dead", note: "Early online service, could not adapt", category: "Communication" },
  ],
  "1990s": [
    { name: "Netscape Navigator", year: 1994, status: "dead", note: "Lost browser wars to Internet Explorer", category: "Browser" },
    { name: "AltaVista", year: 1995, status: "dead", note: "Search giant killed by Google", category: "Search" },
    { name: "Excite", year: 1995, status: "dead", note: "Major search portal, failed to adapt", category: "Search" },
    { name: "Lycos", year: 1994, status: "dead", note: "Early search leader, faded to obscurity", category: "Search" },
    { name: "ICQ", year: 1996, status: "dead", note: "Pioneered instant messaging, lost to newer platforms", category: "Communication" },
    { name: "AIM", year: 1997, status: "dead", note: "AOL Instant Messenger, killed by mobile messaging", category: "Communication" },
    { name: "RealPlayer", year: 1995, status: "dead", note: "Streaming pioneer, obsoleted by YouTube/Netflix", category: "Media" },
    { name: "Napster", year: 1999, status: "dead", note: "P2P music sharing, sued out of existence", category: "Media" },
    { name: "Winamp", year: 1997, status: "dead", note: "Iconic MP3 player, faded with streaming era", category: "Media" },
    { name: "GeoCities", year: 1994, status: "dead", note: "Web hosting giant, shut down by Yahoo", category: "Hosting" },
    { name: "Tripod", year: 1995, status: "dead", note: "Free web hosting, replaced by modern platforms", category: "Hosting" },
    { name: "Ask Jeeves", year: 1996, status: "dead", note: "Natural language search, never caught on", category: "Search" },
  ],
  "2000s": [
    { name: "MySpace", year: 2003, status: "dead", note: "Social network giant, killed by Facebook", category: "Social" },
    { name: "Friendster", year: 2002, status: "dead", note: "First major social network, poor scaling", category: "Social" },
    { name: "Digg", year: 2004, status: "dead", note: "Social news pioneer, imploded with v4 redesign", category: "Social" },
    { name: "Google Reader", year: 2005, status: "dead", note: "Beloved RSS reader, killed by Google", category: "Productivity" },
    { name: "Delicious", year: 2003, status: "dead", note: "Social bookmarking pioneer, mismanaged", category: "Productivity" },
    { name: "Google Wave", year: 2009, status: "dead", note: "Ambitious collaboration tool, too complex", category: "Productivity" },
    { name: "Google+", year: 2011, status: "dead", note: "Failed Facebook competitor", category: "Social" },
    { name: "Vine", year: 2012, status: "dead", note: "6-second video pioneer, shut by Twitter", category: "Social" },
    { name: "Path", year: 2010, status: "dead", note: "Intimate social network, could not scale", category: "Social" },
    { name: "Foursquare", year: 2009, status: "dead", note: "Location check-ins, pivoted to data business", category: "Social" },
    { name: "Ping", year: 2010, status: "dead", note: "Apple social music, nobody used it", category: "Social" },
    { name: "BlackBerry", year: 1999, status: "dead", note: "Business phone king, killed by iPhone", category: "Hardware" },
    { name: "Palm", year: 1996, status: "dead", note: "PDA pioneer, could not compete with smartphones", category: "Hardware" },
  ],
  "2010s": [
    { name: "Sunrise Calendar", year: 2013, status: "dead", note: "Best calendar app, killed by Microsoft acquisition", category: "Productivity" },
    { name: "Wunderlist", year: 2011, status: "dead", note: "Beloved to-do app, killed for Microsoft To Do", category: "Productivity" },
    { name: "Mailbox", year: 2013, status: "dead", note: "Revolutionary email, killed by Dropbox", category: "Productivity" },
    { name: "Periscope", year: 2015, status: "dead", note: "Live streaming pioneer, absorbed into Twitter", category: "Social" },
    { name: "Meerkat", year: 2015, status: "dead", note: "Live streaming app, outpaced by Periscope", category: "Social" },
    { name: "Yik Yak", year: 2013, status: "dead", note: "Anonymous local social, killed by harassment", category: "Social" },
    { name: "Secret", year: 2014, status: "dead", note: "Anonymous sharing, toxic community", category: "Social" },
    { name: "Quibi", year: 2020, status: "dead", note: "Short-form streaming, died in 6 months", category: "Media" },
    { name: "Mixer", year: 2016, status: "dead", note: "Microsoft streaming, could not beat Twitch", category: "Media" },
    { name: "Google Stadia", year: 2019, status: "dead", note: "Cloud gaming, shut down in 2023", category: "Gaming" },
  ],
}

const allYears = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2023, 2025]

export default function EvolutionPage() {
  const [selectedDecade, setSelectedDecade] = useState<string>("2020s")
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<string>("Core Technology")
  const [view, setView] = useState<"timeline" | "characteristics" | "categories" | "graveyard">("timeline")

  const currentCharData = characteristicEvolution.find(c => c.characteristic === selectedCharacteristic)
  const yearData = currentCharData?.timeline.find(t => t.year === selectedYear)
  
  // Filter milestones by decade
  const decadeMilestones = milestones.filter(m => m.era === selectedDecade)
  
  // Get historical products for selected decade
  const decadeProducts = historicalProducts[selectedDecade as keyof typeof historicalProducts] || []

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Market Evolution</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4 text-balance">
            How the Market Has Evolved
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Track how product categories, characteristics, and market dynamics have shifted over time. 
            Understand where we&apos;ve been to see where we&apos;re going.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={view === "timeline" ? "default" : "outline"}
            onClick={() => setView("timeline")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Timeline
          </Button>
          <Button
            variant={view === "graveyard" ? "default" : "outline"}
            onClick={() => setView("graveyard")}
            className="gap-2"
          >
            <Skull className="h-4 w-4" />
            Fallen Giants
          </Button>
          <Button
            variant={view === "characteristics" ? "default" : "outline"}
            onClick={() => setView("characteristics")}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Characteristics
          </Button>
          <Button
            variant={view === "categories" ? "default" : "outline"}
            onClick={() => setView("categories")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Category Growth
          </Button>
        </div>

        {/* Timeline View */}
        {view === "timeline" && (
          <div className="space-y-8">
            {/* Decade selector */}
            <div className="flex flex-wrap gap-2">
              {decades.map(decade => (
                <button
                  key={decade.label}
                  onClick={() => setSelectedDecade(decade.label)}
                  className={cn(
                    "px-5 py-2.5 rounded-full font-medium transition-all border",
                    selectedDecade === decade.label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-secondary border-border text-foreground"
                  )}
                >
                  {decade.label}
                </button>
              ))}
            </div>

            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-2xl">The {selectedDecade}</h2>
              </div>
              
              {/* Decade summary */}
              <div className="bg-secondary/30 rounded-lg p-4 mb-8">
                <p className="text-muted-foreground">
                  {selectedDecade === "1970s" && "The dawn of personal computing. Hobbyists build the foundation for a revolution that would change everything."}
                  {selectedDecade === "1980s" && "The PC goes mainstream. IBM legitimizes personal computers, Apple introduces the GUI, and software becomes an industry."}
                  {selectedDecade === "1990s" && "The internet era begins. Browsers, e-commerce, search engines, and the dot-com boom transform how we connect and do business."}
                  {selectedDecade === "2000s" && "Web 2.0 and mobile computing. Social networks, smartphones, cloud infrastructure, and user-generated content reshape society."}
                  {selectedDecade === "2010s" && "The smartphone age matures. Mobile-first design, SaaS dominance, and the foundations of AI are laid."}
                  {selectedDecade === "2020s" && "The AI revolution explodes. Large language models, generative AI, and remote work transform every industry."}
                </p>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                
                <div className="space-y-4">
                  {decadeMilestones.map((milestone, i) => (
                    <div key={i} className="relative pl-10">
                      <div className={cn(
                        "absolute left-2 top-2 w-4 h-4 rounded-full border-2 bg-background",
                        milestone.impact === "critical" && "border-red-500 bg-red-500/20",
                        milestone.impact === "high" && "border-primary bg-primary/20",
                        milestone.impact === "medium" && "border-yellow-500 bg-yellow-500/20",
                        milestone.impact === "low" && "border-muted-foreground bg-muted"
                      )} />
                      <div className="bg-secondary/50 rounded-lg p-4 hover:bg-secondary/70 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-muted-foreground">
                                {milestone.month} {milestone.year}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                milestone.impact === "critical" && "bg-red-500/20 text-red-600",
                                milestone.impact === "high" && "bg-primary/20 text-primary",
                                milestone.impact === "medium" && "bg-yellow-500/20 text-yellow-600",
                                milestone.impact === "low" && "bg-muted text-muted-foreground"
                              )}>
                                {milestone.impact}
                              </span>
                            </div>
                            <h3 className="font-serif text-xl mb-1">{milestone.event}</h3>
                            <p className="text-muted-foreground">{milestone.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Products from that decade (modern products for 2020s, historical for older) */}
            {selectedDecade === "2020s" ? (
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl">Notable Products of the {selectedDecade}</h2>
                  <Link 
                    href="/products"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products
                    .filter(p => p.status === 'active')
                    .slice(0, 6)
                    .map(product => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">
                            {product.name[0]}
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
<p className="text-xs text-muted-foreground">
                                              {product.launchDate.slice(0, 4)}
                                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.tagline}
                        </p>
                      </Link>
                    ))}
                </div>
              </div>
            ) : decadeProducts.length > 0 && (
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Skull className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-serif text-2xl">Notable Products of the {selectedDecade}</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  Giants of their time that have since faded or been replaced.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decadeProducts.map((product, i) => (
                    <div
                      key={i}
                      className="p-4 bg-secondary/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-lg font-medium text-muted-foreground">
                          {product.name[0]}
                        </div>
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Launched {product.year}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallen Giants / Graveyard View */}
        {view === "graveyard" && (
          <div className="space-y-8">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Skull className="h-6 w-6 text-muted-foreground" />
                <h2 className="font-serif text-3xl">The Product Graveyard</h2>
              </div>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                Every generation has its giants that eventually fall. These products shaped their eras 
                but were ultimately replaced by newer technology, changing user needs, or better execution 
                by competitors. Their lessons remain valuable.
              </p>
              
              {Object.entries(historicalProducts).map(([era, prods]) => (
                <div key={era} className="mb-8 last:mb-0">
                  <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-secondary rounded text-sm">{era}</span>
                    <span className="text-muted-foreground text-base font-normal">
                      {prods.length} fallen
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prods.map((product, i) => (
                      <div
                        key={i}
                        className="group p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center text-xl font-serif text-muted-foreground shrink-0">
                            {product.name[0]}
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {product.year} - Sunset
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {product.note}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Modern dead products */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-secondary rounded text-sm">2010s-2020s</span>
                  <span className="text-muted-foreground text-base font-normal">
                    Recent casualties
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products
                    .filter(p => p.status === 'dead')
                    .map(product => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <img 
                            src={product.logo}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover grayscale opacity-60 shrink-0"
                          />
                          <div>
                            <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(product.launchDate).getFullYear()} - Sunset
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.statusReason || product.tagline}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Characteristics View */}
        {view === "characteristics" && (
          <div className="space-y-8">
            {/* Characteristic selector */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">Explore:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedCharacteristic}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {characteristicEvolution.map(c => (
                    <DropdownMenuItem 
                      key={c.characteristic}
                      onClick={() => setSelectedCharacteristic(c.characteristic)}
                    >
                      {c.characteristic}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Evolution visualization */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">
                How {selectedCharacteristic} Has Changed
              </h2>

              {/* Year bars */}
              <div className="space-y-4">
                {currentCharData?.timeline.map((yearEntry, i) => (
                  <button
                    key={yearEntry.year}
                    onClick={() => setSelectedYear(yearEntry.year)}
                    className={cn(
                      "w-full text-left transition-all",
                      selectedYear === yearEntry.year && "scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-lg border-2 transition-colors",
                      selectedYear === yearEntry.year 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium">{yearEntry.year}</span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium">
                            {yearEntry.dominant}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {yearEntry.percentage}% of products
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${yearEntry.percentage}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {yearEntry.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-characteristic comparison */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">
                {selectedYear} Snapshot: All Characteristics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characteristicEvolution.map(char => {
                  const data = char.timeline.find(t => t.year === selectedYear)
                  if (!data) return null
                  
                  return (
                    <div 
                      key={char.characteristic}
                      className="p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{char.characteristic}</span>
                        <span className="text-sm font-medium">{data.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-primary whitespace-nowrap">
                          {data.dominant}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Category Growth View */}
        {view === "categories" && (
          <div className="space-y-8">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-serif text-2xl mb-6">Category Growth Over Time</h2>
              
              <div className="space-y-6">
                {categoryGrowthData.map(cat => {
                  const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                  const maxProducts = Math.max(...Object.values(cat.years))
                  const growth = ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100).toFixed(0)
                  
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-3">
                        <Link 
                          href={`/categories/${cat.category}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span className="text-xl">{info?.icon}</span>
                          <span className="font-medium">{info?.name || cat.category}</span>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "flex items-center gap-1 text-sm",
                            Number(growth) > 100 ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {Number(growth) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {growth}% since 2020
                          </span>
                        </div>
                      </div>
                      
                      {/* Year-by-year bars */}
                      <div className="flex items-end gap-1 h-16">
                        {[2020, 2021, 2022, 2023, 2024, 2025].map(year => {
                          const count = cat.years[year as keyof typeof cat.years]
                          const height = (count / maxProducts) * 100
                          
                          return (
                            <div key={year} className="flex-1 flex flex-col items-center">
                              <div 
                                className={cn(
                                  "w-full rounded-t transition-all",
                                  year === 2025 ? "bg-primary" : "bg-primary/40"
                                )}
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[10px] text-muted-foreground mt-1">{year}</span>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{cat.years[2020]} products</span>
                        <span>{cat.years[2025]} products</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rising vs Falling Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h2 className="font-serif text-xl">Fastest Growing</h2>
                </div>
                <div className="space-y-3">
                  {categoryGrowthData
                    .map(cat => ({
                      ...cat,
                      growth: ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100)
                    }))
                    .sort((a, b) => b.growth - a.growth)
                    .slice(0, 3)
                    .map((cat, i) => {
                      const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-lg font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <span className="text-xl">{info?.icon}</span>
                          <span className="flex-1">{info?.name}</span>
                          <span className="text-green-600 font-medium">
                            +{cat.growth.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-serif text-xl">Mature Categories</h2>
                </div>
                <div className="space-y-3">
                  {categoryGrowthData
                    .map(cat => ({
                      ...cat,
                      growth: ((cat.years[2025] - cat.years[2020]) / cat.years[2020] * 100)
                    }))
                    .sort((a, b) => a.growth - b.growth)
                    .slice(0, 3)
                    .map((cat, i) => {
                      const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO]
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-lg font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <span className="text-xl">{info?.icon}</span>
                          <span className="flex-1">{info?.name}</span>
                          <span className="text-muted-foreground font-medium">
                            +{cat.growth.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
