import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User, Share2, Bookmark } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { articles, products, type Article } from '@/lib/mock-data'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = articles.find(a => a.slug === slug)

  if (!article) {
    notFound()
  }

  const mentionedProducts = products.filter(p => article.productMentions.includes(p.id))
  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/insights" 
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to insights
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{article.category}</Badge>
            <Badge variant="outline">
              {article.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {article.title}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            {article.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.author}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readTime} min read
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-8 aspect-video overflow-hidden rounded-xl bg-muted">
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <ArticleContent article={article} />
        </article>

        {/* Mentioned Products */}
        {mentionedProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="font-serif text-xl font-semibold mb-4">Mentioned Products</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {mentionedProducts.map(product => (
                <ProductCard key={product.id} product={product} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="font-serif text-xl font-semibold mb-4">Related Insights</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {relatedArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

function ArticleContent({ article }: { article: Article }) {
  // Generate realistic article content based on type
  const content = generateArticleContent(article)

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  )
}

function generateArticleContent(article: Article): string {
  // This would typically come from a CMS
  const intro = `
    <p class="lead">${article.excerpt}</p>
  `

  const body = `
    <h2>Key Takeaways</h2>
    <p>
      In the ever-evolving landscape of technology products, understanding market dynamics 
      is crucial for both builders and users. This analysis examines the current state of 
      the ${article.category} space and identifies emerging patterns that could shape the future.
    </p>
    
    <h3>Market Overview</h3>
    <p>
      The ${article.category} market has seen significant growth over the past year, with 
      new entrants challenging established players and innovative features becoming table stakes.
      Our analysis reveals several interesting trends worth monitoring.
    </p>
    
    <blockquote>
      <p>
        "The best products don't just solve problems—they anticipate needs users didn't 
        know they had."
      </p>
    </blockquote>
    
    <h3>What the Data Shows</h3>
    <p>
      Looking at buzz scores and engagement metrics across our tracked products, we see 
      clear patterns emerging. Products that prioritize user experience and transparent 
      pricing consistently outperform their competitors in long-term retention.
    </p>
    
    <ul>
      <li>User-centric design leads to 40% higher retention</li>
      <li>Transparent pricing correlates with 25% more positive sentiment</li>
      <li>Regular updates drive 35% more engagement</li>
    </ul>
    
    <h3>Looking Ahead</h3>
    <p>
      As we look to the future, several technologies and approaches are poised to reshape 
      this space. AI integration, cross-platform compatibility, and privacy-first design 
      are emerging as key differentiators.
    </p>
    
    <h2>Conclusion</h2>
    <p>
      The ${article.category} landscape continues to evolve rapidly. Staying informed about 
      these trends is essential for anyone building or evaluating products in this space. 
      Keep watching Product Sentinel for the latest updates and analysis.
    </p>
  `

  return intro + body
}
