'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * The copy-link and email buttons.
 *
 * The only genuinely interactive part of the page, so it is kept as small as
 * possible: it takes four strings, not the page payload. Everything a client
 * component receives is serialised into the HTML, and an earlier version that
 * took the whole copy object shipped every heading on the page, including the
 * ones its theme never renders.
 *
 * The URL is read from the browser rather than built from an env var, so a
 * page reached through a custom domain shares the link the reader actually has.
 */
export function ShareActions({
  subject,
  fallbackUrl,
  inverse,
}: {
  subject: string
  /** Shown until the browser URL is known, and used in the mail link. */
  fallbackUrl: string
  inverse: boolean
}) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setUrl(window.location.href.split('?')[0])
  }, [])

  const copyLink = useCallback(async () => {
    const target = url || window.location.href
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked in some embedded browsers. The URL is printed
      // next to the button, so there is always a way to get it by hand.
      setCopied(false)
    }
  }, [url])

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(url || fallbackUrl)}`

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-[44px] items-center gap-2.5 px-6 py-3 text-sm font-semibold"
        style={{
          background: inverse ? 'var(--pp-inverse-ink)' : 'var(--pp-accent)',
          color: inverse ? 'var(--pp-inverse-bg)' : 'var(--pp-on-accent)',
          borderRadius: 'var(--pp-radius-pill)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <LinkIcon />
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <a
        href={mailto}
        className="inline-flex min-h-[44px] items-center gap-2.5 px-6 py-3 text-sm font-semibold no-underline"
        style={{ border: '1px solid currentColor', borderRadius: 'var(--pp-radius-pill)' }}
      >
        Send by email
      </a>
    </div>
  )
}

function LinkIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  )
}
