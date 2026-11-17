'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, RotateCcw, X } from 'lucide-react'
import { getPublicPagePhotos } from '@shared-core/fetchApi/api.fetch'
import { cdnUrl } from '@/lib/cdn'
import { BlockImage } from '../BlockImage'
import { fmtMonthYear, humanizeType } from '../format'
import {
  PUBLIC_PAGE_IMAGE_CAPTION_MAX,
  PUBLIC_PAGE_PHOTO_PICKS_MAX,
  isPublicPagePhotoPick,
  photoPickKey,
} from '../types'
import type { PublicPageBlockContent, PublicPagePhoto, PublicPagePhotoPick } from '../types'
import { PUBLIC_PAGE_IMAGE_ACCEPT, uploadPublicPageImage } from '../uploadImage'

const PAGE_SIZE = 30

/**
 * Choosing the photos for the "From the field" block.
 *
 * Choices are held in the arrangement like every other edit and reach the
 * server only when the layout is saved. The list of photos to choose from
 * comes from the project's own published records plus its gallery, so
 * everything offered here is something the page is allowed to show; the
 * server checks every saved choice again each time it builds the page.
 *
 * `onPhotosKnown` hands each newly chosen photo to the editor, so the preview
 * above can show it before the layout is saved: the page payload only knows
 * about choices that were already saved.
 */
export function PhotosBlockEditor({
  content,
  accessToken,
  projectUid,
  onChange,
  onPhotosKnown,
  onClose,
}: {
  content: PublicPageBlockContent
  accessToken: string
  projectUid: string
  onChange: (content: PublicPageBlockContent) => void
  onPhotosKnown: (photos: PublicPagePhoto[]) => void
  onClose: () => void
}) {
  const picks = (content.photos ?? []).filter(isPublicPagePhotoPick)
  const chosenKeys = new Set(picks.map(photoPickKey))
  const full = picks.length >= PUBLIC_PAGE_PHOTO_PICKS_MAX

  const [candidates, setCandidates] = useState<PublicPagePhoto[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const load = useCallback(
    async (offset: number) => {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await getPublicPagePhotos(accessToken, projectUid, offset, PAGE_SIZE)
        if (result?.statusCode !== 200 || !result.data) throw new Error()
        const items = (result.data.items ?? []) as PublicPagePhoto[]
        setCandidates((current) => (offset === 0 ? items : [...current, ...items]))
        setHasMore(Boolean(result.data.hasMore))
      } catch {
        setLoadError('Could not load your photos. Try again.')
      } finally {
        setLoading(false)
      }
    },
    [accessToken, projectUid],
  )

  useEffect(() => {
    load(0)
  }, [load])

  const setPicks = (next: PublicPagePhotoPick[]) =>
    onChange({ ...content, photos: next.length ? next : undefined })

  const toggle = (photo: PublicPagePhoto) => {
    const key = photoPickKey(photo)
    if (chosenKeys.has(key)) {
      setPicks(picks.filter((pick) => photoPickKey(pick) !== key))
      return
    }
    if (full) return
    onPhotosKnown([photo])
    setPicks([...picks, { folder: photo.folder, image: photo.image }])
  }

  const move = (index: number, offset: number) => {
    const to = index + offset
    if (to < 0 || to >= picks.length) return
    const next = [...picks]
    const [moved] = next.splice(index, 1)
    next.splice(to, 0, moved)
    setPicks(next)
  }

  const upload = async (file: File | undefined) => {
    if (!file || full) return
    setUploading(true)
    setUploadError(null)
    try {
      const image = await uploadPublicPageImage(accessToken, file)
      onPhotosKnown([{ image, folder: 'project', caption: null, takenAt: null }])
      setPicks([...picks, { folder: 'project', image }])
    } catch (failure) {
      setUploadError(failure instanceof Error ? failure.message : 'The upload failed. Try again.')
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="pp-editor-chrome pointer-events-auto border-b border-slate-200 bg-white p-4 text-slate-700">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-xs font-semibold">
            Chosen photos ({picks.length} of {PUBLIC_PAGE_PHOTO_PICKS_MAX})
          </h3>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              ref={input}
              type="file"
              accept={PUBLIC_PAGE_IMAGE_ACCEPT}
              className="sr-only"
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploading || full}
              onClick={() => input.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-slate-300 px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? 'Uploading' : 'Upload a photo'}
            </button>
            {picks.length ? (
              <button
                type="button"
                onClick={() => setPicks([])}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-transparent px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw size={13} />
                Use newest photos instead
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-[6px] border border-slate-300 px-3 text-xs font-medium hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>

        {uploadError ? <p className="m-0 text-xs text-red-700">{uploadError}</p> : null}

        {picks.length ? (
          <ol className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6">
            {picks.map((pick, index) => (
              <li key={photoPickKey(pick)} className="flex flex-col gap-1.5">
                <div className="relative h-20 overflow-hidden rounded-[6px] border border-slate-200 bg-slate-100">
                  <Thumb folder={pick.folder} image={pick.image} />
                  <span className="absolute left-1 top-1 rounded-[4px] bg-black/60 px-1.5 text-[0.625rem] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="absolute right-1 top-1 flex gap-0.5">
                    <IconButton label="Move earlier" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowLeft size={12} />
                    </IconButton>
                    <IconButton
                      label="Move later"
                      disabled={index === picks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight size={12} />
                    </IconButton>
                    <IconButton
                      label="Remove"
                      onClick={() => setPicks(picks.filter((_, at) => at !== index))}
                    >
                      <X size={12} />
                    </IconButton>
                  </div>
                </div>
                <input
                  type="text"
                  value={pick.caption ?? ''}
                  maxLength={PUBLIC_PAGE_IMAGE_CAPTION_MAX}
                  placeholder={pick.folder === 'project' ? 'Caption' : 'Own caption (optional)'}
                  aria-label={`Caption for photo ${index + 1}`}
                  onChange={(event) =>
                    setPicks(
                      picks.map((item, at) =>
                        at === index ? { ...item, caption: event.target.value } : item,
                      ),
                    )
                  }
                  className="h-7 rounded-[6px] border border-slate-300 px-2 text-[0.6875rem] text-slate-900 outline-none focus:border-slate-500"
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 rounded-[6px] bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            None chosen, so the page shows the newest field photos. Click photos below to choose
            your own, in the order you want them.
          </p>
        )}

        <div className="border-t border-slate-200 pt-3">
          <h3 className="m-0 mb-2 text-xs font-semibold">
            Your project&apos;s photos
            {full ? (
              <span className="ml-2 font-normal text-slate-500">
                Twelve chosen. Remove one to choose another.
              </span>
            ) : null}
          </h3>

          {loadError ? (
            <p className="m-0 text-xs text-red-700">
              {loadError}{' '}
              <button type="button" onClick={() => load(0)} className="underline">
                Retry
              </button>
            </p>
          ) : null}

          {!loading && !loadError && candidates.length === 0 ? (
            <p className="m-0 text-xs text-slate-500">
              No approved field photos yet. You can still upload photos above.
            </p>
          ) : null}

          <div className="grid max-h-[340px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 lg:grid-cols-8">
            {candidates.map((photo) => {
              const key = photoPickKey(photo)
              const chosen = chosenKeys.has(key)
              const label = labelOf(photo)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!chosen && full}
                  onClick={() => toggle(photo)}
                  aria-pressed={chosen}
                  title={label}
                  className={[
                    'relative h-[72px] overflow-hidden rounded-[6px] border-2 bg-slate-100 text-left',
                    chosen ? 'border-emerald-600' : 'border-transparent hover:border-slate-300',
                    !chosen && full ? 'cursor-not-allowed opacity-40' : '',
                  ].join(' ')}
                >
                  <Thumb folder={photo.folder} image={photo.image} />
                  {chosen ? (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check size={12} />
                    </span>
                  ) : null}
                  <span className="sr-only">{label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-3">
            {loading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : null}
            {hasMore && !loading ? (
              <button
                type="button"
                onClick={() => load(candidates.length)}
                className="h-8 rounded-[6px] border border-slate-300 px-3 text-xs font-medium hover:bg-slate-50"
              >
                Load more
              </button>
            ) : null}
          </div>
        </div>

        <p className="m-0 text-[0.6875rem] text-slate-500">
          Chosen photos go live when you save the layout. Only approved records are offered, and
          a photo whose record is later deleted or rejected drops off the page by itself.
        </p>
      </div>
    </div>
  )
}

/** A thumbnail. A file that cannot load shows a plain tile, not a broken image. */
function Thumb({ folder, image }: { folder: string; image: string }) {
  const url = cdnUrl(folder, image)
  if (!url) return null
  return <BlockImage src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-black/60 text-white hover:bg-black/80 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function labelOf(photo: PublicPagePhoto): string {
  const source = { tree: 'Tree', intervention: 'Intervention', site: 'Site', project: 'Upload' }[
    photo.folder
  ]
  const subject = photo.caption && photo.caption.toLowerCase() !== 'unknown' ? humanizeType(photo.caption) : null
  return [source, subject, fmtMonthYear(photo.takenAt)].filter(Boolean).join(', ')
}
