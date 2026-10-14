'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { BLOCK_CATALOGUE } from '../layout'
import type { BlockSpec } from '../themes'
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
  onContent: (key: string, content: { heading: string; body: string }) => void
  textOpen: boolean
  onToggleText: (key: string | null) => void
}) {
  const definition = BLOCK_CATALOGUE[spec.id]
  const key = spec.key as string
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({ id: key })

  return (
    <div ref={setNodeRef} className="relative" data-pp-block={spec.id}>
      {dropBefore ? <DropLine /> : null}

      <div
        className="relative border border-dashed border-slate-300 transition-opacity"
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

        {textOpen ? (
          <TextBlockEditor
            content={spec.content ?? {}}
            onChange={(content) => onContent(key, content)}
            onClose={() => onToggleText(null)}
          />
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
