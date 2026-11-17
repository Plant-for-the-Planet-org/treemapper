'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Every externally hosted image on the public page renders through this one
 * component. A file that fails to load swaps to `fallback` (or disappears)
 * instead of leaving the browser's broken-image glyph on a page whose whole
 * job is looking credible; whatever sits behind it - a tile's placeholder
 * colour, the hero's dark wash, an initials chip - carries the space instead.
 */
export function BlockImage({
  src,
  alt,
  className,
  style,
  loading,
  fallback = null,
}: {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  loading?: 'lazy' | 'eager'
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>

  return (
    // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
