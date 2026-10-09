import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * Preview is an internal tool, not a second public URL for a project.
 *
 * The real protection is the authenticated, owner-or-admin API call the page
 * makes. These headers are the belt to that pair of braces: nothing here
 * should ever be indexed, cached by a shared proxy, or followed by a crawler
 * that happens to find the link.
 */
export const metadata: Metadata = {
  title: 'Public page preview',
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
