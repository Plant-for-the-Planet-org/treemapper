import { PP_CONTAINER } from '../primitives'
import { ShareActions } from './ShareActions'
import type { BlockProps } from './types'

/**
 * The share row.
 *
 * A server component that renders the text and hands only four plain strings
 * to the one interactive piece, so none of the rest of the page's copy crosses
 * the client boundary.
 *
 * Three variants, all the same content: a rule above it, a full-width inverse
 * band, or a rounded card.
 */
export function ShareBlock({ data, copy, spec }: BlockProps) {
  const variant = spec.variant ?? 'wide'
  const slug = data.project.slug ?? data.project.uid
  const fallbackUrl = `https://treemapper.app/p/${slug}`
  const inverse = variant === 'inverse' || variant === 'card'

  const inner = (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
      <div>
        <div className="pp-display" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)', fontWeight: 400 }}>
          {copy.shareHeading}
        </div>
        <div className="mt-2 text-[0.9375rem] opacity-80">{fallbackUrl.replace(/^https?:\/\//, '')}</div>
      </div>
      <ShareActions subject={data.project.name} fallbackUrl={fallbackUrl} inverse={inverse} />
    </div>
  )

  if (variant === 'inverse') {
    return (
      <section id="pp-share" className="pp-inverse pp-no-print">
        <div className={`${PP_CONTAINER} py-12`}>{inner}</div>
      </section>
    )
  }

  if (variant === 'card') {
    return (
      <section id="pp-share" className="pp-no-print">
        <div className={PP_CONTAINER}>
          <div
            className="px-8 py-11 sm:px-12"
            style={{
              background: 'var(--pp-inverse-bg)',
              color: 'var(--pp-inverse-ink)',
              borderRadius: 'var(--pp-radius-lg)',
            }}
          >
            {inner}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pp-share" className="pp-no-print">
      <div className={PP_CONTAINER}>
        <div className="pt-10" style={{ borderTop: '1px solid var(--pp-line)' }}>
          {inner}
        </div>
      </div>
    </section>
  )
}
