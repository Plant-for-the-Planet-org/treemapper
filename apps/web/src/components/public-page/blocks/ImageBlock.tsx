import { cdnUrl } from '@/lib/cdn'
import { BlockImage } from '../BlockImage'
import { Section } from '../primitives'
import { isPublicPageImage } from '../types'
import type { BlockProps } from './types'

/**
 * An image the project uploaded itself, with an optional caption.
 *
 * The filename is checked again here, not only on the server: `cdnUrl` passes
 * any `http(s)://` value straight through, so a value that is not an uploaded
 * filename renders nothing rather than whatever it points at. An empty block
 * renders nothing too, so a half-finished one never reaches a visitor, the
 * same rule the text block follows.
 *
 * The image keeps its own proportions. Cropping someone's photo to a fixed box
 * would cut off whatever they chose it for; the height is only capped so a tall
 * portrait cannot fill several screens.
 */
export function ImageBlock({ spec }: BlockProps) {
  const image = spec.content?.image
  if (!isPublicPageImage(image)) return null

  const url = cdnUrl('project', image)
  if (!url) return null

  const caption = spec.content?.caption?.trim() ?? ''
  const alt = spec.content?.alt?.trim() || caption
  const wide = spec.variant === 'wide'

  return (
    <Section>
      <figure className={wide ? 'm-0' : 'mx-auto m-0 max-w-[880px]'}>
        <div
          className="overflow-hidden"
          style={{ borderRadius: 'var(--pp-radius)', background: 'var(--pp-placeholder)' }}
        >
          <BlockImage
            src={url}
            alt={alt}
            loading="lazy"
            className="block h-auto max-h-[720px] w-full object-cover"
          />
        </div>
        {caption ? (
          <figcaption className="mt-3 text-sm" style={{ color: 'var(--pp-muted)' }}>
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </Section>
  )
}
