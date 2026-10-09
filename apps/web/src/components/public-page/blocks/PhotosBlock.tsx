import { fmtMonthYear, humanizeType } from '../format'
import { PhotoTile, Section, SectionHeading } from '../primitives'
import type { PublicPagePhoto } from '../types'
import type { BlockProps } from './types'

/**
 * Field photographs.
 *
 * Renders nothing when the project has none. An empty wall of grey boxes says
 * less than no wall at all, and a page that pads itself out stops being a
 * record.
 */
export function PhotosBlock({ data, theme, copy, spec }: BlockProps) {
  if (!data.photos.length) return null

  const count = spec.variant === 'row' ? 3 : 6
  const photos = data.photos.slice(0, count)

  return (
    <Section id="pp-photos">
      <SectionHeading tone={theme.tone} title={copy.photosHeading} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <PhotoTile
            key={`${photo.folder}-${photo.image}-${index}`}
            image={photo.image}
            folder={photo.folder}
            caption={captionOf(photo)}
            height={spec.variant === 'row' ? 240 : 260}
          />
        ))}
      </div>
    </Section>
  )
}

function captionOf(photo: PublicPagePhoto): string | null {
  const subject = photo.caption ? humanizeType(photo.caption) : null
  const when = fmtMonthYear(photo.takenAt)
  return [subject, when].filter(Boolean).join(', ') || null
}
