import { fmtMonthYear, humanizeType } from '../format'
import { PhotoTile, Section, SectionHeading } from '../primitives'
import { photoPickKey } from '../types'
import type { PublicPagePhoto } from '../types'
import type { BlockProps } from './types'

/**
 * Field photographs.
 *
 * Two sources, and the project decides which. With nothing chosen, the
 * newest field photos fill the wall (six, or three in the `row` variant).
 * With photos chosen in the editor, exactly those show, in the chosen order,
 * up to twelve: picking them is the whole point, so the variant's count does
 * not cut a choice short.
 *
 * A chosen photo appears only if the server vouched for it in
 * `data.photoPicks` (still this project's, still published). If none of the
 * choices survive, the wall falls back to the automatic photos rather than
 * vanishing.
 *
 * Renders nothing when there is nothing to show at all. An empty wall of grey
 * boxes says less than no wall, and a page that pads itself out stops being a
 * record.
 */
export function PhotosBlock({ data, theme, copy, spec }: BlockProps) {
  const chosen: Shown[] = []
  for (const pick of spec.content?.photos ?? []) {
    const photo = data.photoPicks?.[photoPickKey(pick)]
    if (!photo) continue
    // A caption typed in the editor is the person's own words: show it as
    // written. Uploads have no automatic caption, so theirs is always typed.
    const typed = Boolean(pick.caption?.trim()) || pick.folder === 'project'
    chosen.push({ photo: typed ? { ...photo, caption: pick.caption?.trim() || null } : photo, typed })
  }

  const count = spec.variant === 'row' ? 3 : 6
  const photos: Shown[] = chosen.length
    ? chosen
    : data.photos.slice(0, count).map((photo) => ({ photo, typed: false }))
  if (!photos.length) return null

  return (
    <Section id="pp-photos">
      <SectionHeading tone={theme.tone} title={copy.photosHeading} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map(({ photo, typed }, index) => (
          <PhotoTile
            key={`${photo.folder}-${photo.image}-${index}`}
            image={photo.image}
            folder={photo.folder}
            caption={captionOf(photo, typed)}
            height={spec.variant === 'row' ? 240 : 260}
          />
        ))}
      </div>
    </Section>
  )
}

interface Shown {
  photo: PublicPagePhoto
  /** The caption was written by a person, not taken from the record. */
  typed: boolean
}

function captionOf(photo: PublicPagePhoto, typed: boolean): string | null {
  const raw = photo.caption?.trim() ?? ''
  // Typed captions are shown exactly as written, with no date added. Record
  // captions are species names or intervention types, so they are tidied,
  // and "Unknown" (an unidentified species) is left out rather than printed.
  if (typed) return raw || null
  const subject = raw && raw.toLowerCase() !== 'unknown' ? humanizeType(raw) : null
  const when = fmtMonthYear(photo.takenAt)
  return [subject, when].filter(Boolean).join(', ') || null
}
