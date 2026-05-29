import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  if (process.env.APP_ENV === 'production') {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://dash.treemapper.app/sitemap.xml',
    }
  }

  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
