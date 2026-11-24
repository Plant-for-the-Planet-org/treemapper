'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { EMBED_HEIGHT_MESSAGE, EMBED_PING_MESSAGE } from './embed'

/**
 * The widget's half of the iframe conversation. Two jobs:
 *
 *  1. Tell the parent page how tall the content is, whenever that changes, so
 *     `public/embed.js` can size the iframe with no scrollbar and no gap. The
 *     height is posted to `*`: it is not sensitive, and the widget cannot know
 *     which site embeds it. The parent checks the sender, not us.
 *     `embed.js` can load after the widget has already posted, so it pings on
 *     start and the widget answers.
 *  2. Open links in a new tab. Inside an iframe a plain link would load our
 *     page inside the partner's box. In-page `#` links are left alone.
 */
export function EmbedBridge({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || window.parent === window) return

    let last = 0
    const post = (force = false) => {
      const height = Math.ceil(node.getBoundingClientRect().height)
      if (!force && height === last) return
      last = height
      window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, height }, '*')
    }

    const observer = new ResizeObserver(() => post())
    observer.observe(node)
    post(true)

    const onMessage = (event: MessageEvent) => {
      if (event.source === window.parent && event.data?.type === EMBED_PING_MESSAGE) post(true)
    }
    window.addEventListener('message', onMessage)

    return () => {
      observer.disconnect()
      window.removeEventListener('message', onMessage)
    }
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('#')) return
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return <div ref={ref}>{children}</div>
}
