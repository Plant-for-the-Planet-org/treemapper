'use client'

import { Plus, X } from 'lucide-react'
import { CATALOGUE_LIST, usedOnceIds } from '../layout'
import type { BlockId, BlockSpec } from '../themes'
import { PUBLIC_PAGE_MAX_BLOCKS } from '../types'

/**
 * Everything that can be added to this page.
 *
 * The same catalogue for all four themes, which is the useful part: a theme's
 * block list is a starting point, not a boundary. Story can take the
 * verification band, Report can take photos, and nothing had to be written
 * twice for that to work, because every block reads the same payload.
 *
 * A block already on the page is shown greyed rather than hidden, so the list
 * stays in the same order every time and "where did Species go" never comes
 * up. Only the two repeatable ones (numbers and your own words) can be added
 * again.
 */
export function AddBlockPanel({
  blocks,
  onAdd,
  onClose,
}: {
  blocks: BlockSpec[]
  onAdd: (id: BlockId) => void
  onClose: () => void
}) {
  const used = usedOnceIds(blocks)
  const atLimit = blocks.length >= PUBLIC_PAGE_MAX_BLOCKS

  return (
    <div className="border-t border-slate-700 bg-[#1b2a22] px-5 py-4 text-[#e8efe9]">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="m-0 text-[0.8125rem] font-semibold">Add a block</h2>
        <span className="text-[0.6875rem] text-[#9fb0a4]">
          {atLimit
            ? `A page can hold ${PUBLIC_PAGE_MAX_BLOCKS} blocks. Remove one first.`
            : 'It lands above the footer. Drag it where you want it.'}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-[6px] text-[#9fb0a4] hover:bg-[#2a3b31]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOGUE_LIST.map((definition) => {
          const already = used.has(definition.id)
          const disabled = already || atLimit

          return (
            <button
              key={definition.id}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(definition.id)}
              className={[
                'flex items-start gap-2.5 rounded-[8px] border p-2.5 text-left',
                disabled
                  ? 'cursor-not-allowed border-[#2a3b31] opacity-45'
                  : 'border-[#3b4c43] hover:border-[#6f8a79] hover:bg-[#223029]',
              ].join(' ')}
            >
              <Plus size={14} className="mt-0.5 shrink-0 text-[#9fb0a4]" />
              <span className="min-w-0">
                <span className="block text-[0.8125rem] font-medium">
                  {definition.label}
                  {already ? <span className="ml-1.5 text-[#9fb0a4]">on the page</span> : null}
                </span>
                <span className="mt-0.5 block text-[0.6875rem] leading-snug text-[#9fb0a4]">
                  {definition.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
