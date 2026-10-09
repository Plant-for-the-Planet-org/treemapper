import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  if (process.env.APP_ENV === 'production') {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        // Public page previews are owner-or-admin only and show pages that
        // are not published. They carry noindex headers of their own; this
        // keeps a crawler from spending requests finding that out.
        disallow: ['/preview/'],
      },
      sitemap: 'https://dash.treemapper.app/sitemap.xml',
    }
  }

  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
