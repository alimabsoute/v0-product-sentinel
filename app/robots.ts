import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/profile', '/login', '/signup'] },
    sitemap: 'https://v0-product-sentinel.vercel.app/sitemap.xml',
  }
}
