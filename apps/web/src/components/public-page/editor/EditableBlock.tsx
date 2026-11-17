'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { ChevronDown, ChevronUp, GripVertical, ImagePlus, Images, Pencil, Trash2 } from 'lucide-react'
import { BLOCK_CATALOGUE } from '../layout'
import type { BlockSpec } from '../themes'
import { isPublicPageImage } from '../types'
import type { PublicPageBlockContent, PublicPagePhoto } from '../types'
import { ImageBlockEditor } from './ImageBlockEditor'
import { PhotosBlockEditor } from './PhotosBlockEditor'
import { TextBlockEditor } from './TextBlockEditor'

/**
 * One block on the page, with its handles.
 *
 * The real block renders underneath, untouched. That is the point of editing
 * on the preview rather than in a list of names: what someone arranges is the
 * page itself, at the size a visitor sees it.
 *
 * Two deliberate choices in here:
 *
 *  - **The block's own content takes no pointer events while editing.** A map
 *    that pans under the cursor, or a link that navigates away mid-drag, makes
 *    arranging feel broken. Only the toolbar is live.
 *  - **Nothing moves during a drag.** These blocks are hundreds of pixels
 *    tall, so shuffling them under the pointer is more disorienting than
 *    helpful. A line shows where the block will land instead, and the page
 *    reflows once, on drop.
 */
export function EditableBlock({
  spec,
  index,
  total,
  children,
  dropBefore,
  dropAfter,
  onMove,
  onRemove,
  onVariant,
  onContent,
  textOpen,
  onToggleText,
  flash,
  accessToken,
  projectUid,
  onPhotosKnown,
}: {
  spec: BlockSpec
  index: number
  total: number
  children: ReactNode
  dropBefore: boolean
  dropAfter: boolean
  onMove: (key: string, offset: number) => void
  onRemove: (key: string) => void
  onVariant: (key: string, variant: string) => void
  onContent: (key: string, content: PublicPageBlockContent) => void
  /** Whether this block's content panel (text or image) is open. */
  textOpen: boolean
  onToggleText: (key: string | null) => void
  /** Just added: the page scrolls here and this frame lights up briefly. */
  flash?: boolean
  /** For uploads and the photo picker. */
  accessToken: string
  projectUid: string
  /** Lets the preview show a chosen photo before the layout is saved. */
  onPhotosKnown: (photos: PublicPagePhoto[]) => void
}) {
  const definition = BLOCK_CATALOGUE[spec.id]
  const key = spec.key as string
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({ id: key })

  return (
    <div ref={setNodeRef} className="relative" data-pp-block={spec.id} data-pp-key={key}>
      {dropBefore ? <DropLine /> : null}

      <div
        className={[
          'relative border border-dashed transition-all duration-700',
          flash
            ? 'border-emerald-500 shadow-[0_0_0_3px_rgba(5,150,105,0.35)]'
            : 'border-slate-300',
        ].join(' ')}
        style={{ opacity: isDragging ? 0.35 : 1 }}
      >
        <div className="pp-editor-chrome flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 text-slate-700">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${definition.label}`}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-[6px] text-slate-500 hover:bg-slate-200 active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>

          <span className="text-xs font-semibold">{definition.label}</span>
          {definition.essential ? (
            <span className="text-[0.6875rem] text-slate-500">needed</span>
          ) : null}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {definition.variants.length > 1 ? (
              <select
                value={spec.variant ?? definition.variants[0].id}
                onChange={(event) => onVariant(key, event.target.value)}
                aria-label={`${definition.label} style`}
                className="h-7 rounded-[6px] border border-slate-300 bg-white px-1.5 text-[0.6875rem] text-slate-700"
              >
                {definition.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.label}
                  </option>
                ))}
              </select>
            ) : null}

            {definition.editableText ? (
              <ToolButton
                label={textOpen ? 'Close the text editor' : 'Edit the text'}
                onClick={() => onToggleText(textOpen ? null : key)}
                active={textOpen}
              >
                <Pencil size={14} />
              </ToolButton>
            ) : null}

            {definition.editableImage ? (
              <ToolButton
                label={textOpen ? 'Close the image editor' : 'Change the image'}
                onClick={() => onToggleText(textOpen ? null : key)}
                active={textOpen}
              >
                <ImagePlus size={14} />
              </ToolButton>
            ) : null}

            {definition.editablePhotos ? (
              <button
                type="button"
                onClick={() => onToggleText(textOpen ? null : key)}
                aria-pressed={textOpen}
                className={[
                  'inline-flex h-7 items-center gap-1.5 rounded-[6px] border px-2.5 text-[0.6875rem] font-medium',
                  textOpen
                    ? 'border-slate-400 bg-slate-200 text-slate-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <Images size={13} />
                {textOpen ? 'Close' : 'Choose photos'}
              </button>
            ) : null}

            <ToolButton
              label="Move up"
              disabled={index === 0}
              onClick={() => onMove(key, -1)}
            >
              <ChevronUp size={15} />
            </ToolButton>
            <ToolButton
              label="Move down"
              disabled={index === total - 1}
              onClick={() => onMove(key, 1)}
            >
              <ChevronDown size={15} />
            </ToolButton>
            <ToolButton label="Remove this block" danger onClick={() => onRemove(key)}>
              <Trash2 size={14} />
            </ToolButton>
          </div>
        </div>

        {textOpen && definition.editableText ? (
          <TextBlockEditor
            content={spec.content ?? {}}
            onChange={(content) => onContent(key, content)}
            onClose={() => onToggleText(null)}
          />
        ) : null}

        {textOpen && definition.editablePhotos ? (
          <PhotosBlockEditor
            content={spec.content ?? {}}
            accessToken={accessToken}
            projectUid={projectUid}
            onChange={(content) => onContent(key, content)}
            onPhotosKnown={onPhotosKnown}
            onClose={() => onToggleText(null)}
          />
        ) : null}

        {textOpen && definition.editableImage ? (
          <ImageBlockEditor
            content={spec.content ?? {}}
            accessToken={accessToken}
            onChange={(content) => onContent(key, content)}
            onClose={() => onToggleText(null)}
          />
        ) : null}

        {/* An image block with no image renders nothing on the page, which in
            the editor would leave a frame with no body. Say so instead. */}
        {definition.editableImage && !isPublicPageImage(spec.content?.image) && !textOpen ? (
          <p className="m-0 px-4 py-6 text-center text-xs text-slate-500">
            No image yet. Use the image button above to upload one. Until then this block is
            left out of the published page.
          </p>
        ) : null}

        {/* Inert while editing: the toolbar above is the only live part. */}
        <div className="pointer-events-none select-none">{children}</div>
      </div>

      {dropAfter ? <DropLine /> : null}
    </div>
  )
}

function DropLine() {
  return <div className="h-0.5 w-full bg-emerald-600" aria-hidden />
}

function ToolButton({
  label,
  onClick,
  children,
  disabled,
  danger,
  active,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  danger?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-[6px] border border-transparent',
        disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-200',
        danger && !disabled ? 'hover:bg-red-100 hover:text-red-700' : '',
        active ? 'border-slate-300 bg-white' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
