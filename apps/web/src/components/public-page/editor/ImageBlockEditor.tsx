'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { cdnUrl } from '@/lib/cdn'
import {
  PUBLIC_PAGE_IMAGE_ALT_MAX,
  PUBLIC_PAGE_IMAGE_CAPTION_MAX,
  isPublicPageImage,
} from '../types'
import type { PublicPageBlockContent } from '../types'
import { PUBLIC_PAGE_IMAGE_ACCEPT, uploadPublicPageImage } from '../uploadImage'

/**
 * The image, caption and alt text on an image block.
 *
 * Works like the text editor: changes are held in the arrangement and reach
 * the server only when the layout is saved. The file itself is uploaded the
 * moment it is chosen (it has to exist before the page can show it), but an
 * upload that is never saved into a layout is never published.
 */
export function ImageBlockEditor({
  content,
  accessToken,
  onChange,
  onClose,
}: {
  content: PublicPageBlockContent
  accessToken: string
  onChange: (content: PublicPageBlockContent) => void
  onClose: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const image = isPublicPageImage(content.image) ? content.image : null
  const preview = image ? cdnUrl('project', image) : null
  const caption = content.caption ?? ''
  const alt = content.alt ?? ''

  const choose = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const filename = await uploadPublicPageImage(accessToken, file)
      onChange({ ...content, image: filename })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The upload failed. Try again.')
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="pp-editor-chrome pointer-events-auto border-b border-slate-200 bg-white p-4">
      <div className="mx-auto flex max-w-[68ch] flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-slate-200 bg-slate-50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={18} className="text-slate-400" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={input}
              type="file"
              accept={PUBLIC_PAGE_IMAGE_ACCEPT}
              className="sr-only"
              onChange={(event) => choose(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => input.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? 'Uploading' : image ? 'Replace image' : 'Upload image'}
            </button>
            {image ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => onChange({ ...content, image: undefined })}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-transparent px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={13} />
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="m-0 text-xs text-red-700">{error}</p> : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-700">Caption</span>
          <input
            type="text"
            value={caption}
            maxLength={PUBLIC_PAGE_IMAGE_CAPTION_MAX}
            placeholder="Shown under the image, for example who is in it and where"
            onChange={(event) => onChange({ ...content, caption: event.target.value })}
            className="h-9 rounded-[6px] border border-slate-300 px-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-700">Description for screen readers</span>
          <input
            type="text"
            value={alt}
            maxLength={PUBLIC_PAGE_IMAGE_ALT_MAX}
            placeholder="What the image shows. Leave empty to use the caption."
            onChange={(event) => onChange({ ...content, alt: event.target.value })}
            className="h-9 rounded-[6px] border border-slate-300 px-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[0.6875rem] text-slate-500">
            JPG, PNG, WebP or GIF, up to 10 MB. Published to anyone with the link once you save
            the layout. Only use images you have the right to share, and ask people before
            showing their faces.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-[6px] border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
