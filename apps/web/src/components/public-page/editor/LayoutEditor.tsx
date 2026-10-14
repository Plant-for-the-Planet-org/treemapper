'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GripVertical, Layers, Loader2, Lock, Plus, RotateCcw } from 'lucide-react'
import { updatePublicPageSettings } from '@shared-core/fetchApi/api.fetch'
import { BLOCK_CATALOGUE, addBlock, defaultLayout, matchesDefault, moveBlock, removeBlock, reorderBlocks, resolveLayout, toStoredLayout, updateBlock } from '../layout'
import { PublicProjectPageView } from '../PublicProjectPageView'
import { THEMES } from '../themes'
import type { BlockId, BlockSpec, ThemeConfig } from '../themes'
import type { PublicProjectPage } from '../types'
import { AddBlockPanel } from './AddBlockPanel'
import { EditableBlock } from './EditableBlock'

/**
 * The public page preview, and the editor that arranges it.
 *
 * One component for both modes on purpose. The thing being edited is the page
 * itself, so there is no second rendering of it to keep in step: edit mode is
 * the same `PublicProjectPageView` with a wrapper around each block.
 *
 * What is saved is an **override**, not a copy. A project that has never
 * arranged anything stores nothing and keeps following its theme, and saving
 * an arrangement that happens to match the theme clears the override rather
 * than pinning today's version of it. That is what keeps a theme improvement
 * reaching the pages that never asked to differ.
 *
 * Access is the server's call, not this screen's: the preview payload only
 * loads for an owner or admin, and the save goes through the same guard.
 */
export function LayoutEditor({
  data,
  theme,
  projectUid,
  accessToken,
  fontClassName,
}: {
  data: PublicProjectPage
  theme: ThemeConfig
  projectUid: string
  accessToken: string
  fontClassName: string
}) {
  const initial = useMemo(() => resolveLayout(theme, data.layout), [theme, data.layout])

  const [blocks, setBlocks] = useState<BlockSpec[]>(initial)
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(toStoredLayout(initial)))
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [textOpenKey, setTextOpenKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  const dirty = JSON.stringify(toStoredLayout(blocks)) !== savedJson

  // A layout only exists in this tab until it is saved. Closing the window
  // with changes pending would lose them silently.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const mutate = useCallback((next: BlockSpec[]) => {
    setBlocks(next)
    setStatus(null)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setStatus(null)
    try {
      // Matching the theme means there is nothing worth storing. Sending null
      // clears the override instead of freezing a copy of today's theme.
      const payload = matchesDefault(theme, blocks) ? null : toStoredLayout(blocks)
      const result = await updatePublicPageSettings(accessToken, projectUid, {
        layouts: { [theme.id]: payload },
      })
      if (result?.statusCode !== 200) throw new Error(result?.message || 'Request failed')

      setSavedJson(JSON.stringify(toStoredLayout(blocks)))
      setStatus({
        kind: 'ok',
        text: payload
          ? 'Layout saved. The public page updates within five minutes.'
          : 'Back to the theme default. Nothing is overridden now.',
      })
    } catch {
      setStatus({ kind: 'error', text: 'Could not save. Nothing was changed.' })
    } finally {
      setSaving(false)
    }
  }, [accessToken, blocks, projectUid, theme])

  const discard = useCallback(() => {
    setBlocks(resolveLayout(theme, data.layout))
    setSavedJson(JSON.stringify(toStoredLayout(resolveLayout(theme, data.layout))))
    setConfirmDiscard(false)
    setTextOpenKey(null)
    setStatus(null)
    setEditing(false)
  }, [data.layout, theme])

  const leaveEditing = useCallback(() => {
    if (dirty) {
      setConfirmDiscard(true)
      return
    }
    setEditing(false)
    setTextOpenKey(null)
  }, [dirty])

  const onDragStart = (event: DragStartEvent) => setActiveKey(String(event.active.id))
  const onDragOver = (event: DragOverEvent) => setOverKey(event.over ? String(event.over.id) : null)
  const onDragEnd = (event: DragEndEvent) => {
    const over = event.over ? String(event.over.id) : null
    const active = String(event.active.id)
    setActiveKey(null)
    setOverKey(null)
    if (over && over !== active) mutate(reorderBlocks(blocks, active, over))
  }

  const activeIndex = activeKey ? blocks.findIndex((block) => block.key === activeKey) : -1
  const overIndex = overKey ? blocks.findIndex((block) => block.key === overKey) : -1
  const activeLabel = activeIndex >= 0 ? BLOCK_CATALOGUE[blocks[activeIndex].id].label : null

  const page = (
    <PublicProjectPageView
      data={data}
      theme={theme}
      blocks={blocks}
      fontClassName={fontClassName}
      wrapBlock={
        editing
          ? (spec, node, index) => (
              <EditableBlock
                spec={spec}
                index={index}
                total={blocks.length}
                dropBefore={overIndex === index && activeIndex > index}
                dropAfter={overIndex === index && activeIndex < index}
                onMove={(key, offset) => mutate(moveBlock(blocks, key, offset))}
                onRemove={(key) => {
                  if (textOpenKey === key) setTextOpenKey(null)
                  mutate(removeBlock(blocks, key))
                }}
                onVariant={(key, variant) => mutate(updateBlock(blocks, key, { variant }))}
                onContent={(key, content) => mutate(updateBlock(blocks, key, { content }))}
                textOpen={textOpenKey === spec.key}
                onToggleText={setTextOpenKey}
              >
                {node}
              </EditableBlock>
            )
          : undefined
      }
    />
  )

  return (
    <>
      <div className="sticky top-0 z-30 bg-[#15201b] text-[0.8125rem] text-[#f4f6f4]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
          {editing ? (
            <>
              <span className="flex items-center gap-2 font-semibold">
                <Layers size={14} />
                Arranging {theme.label}
              </span>
              <span className="text-[#9fb0a4]">
                {blocks.length} blocks
                {dirty ? ' · unsaved changes' : ''}
              </span>

              {status ? (
                <span className={status.kind === 'ok' ? 'text-[#8fd5a6]' : 'text-[#f1a8a8]'}>
                  {status.text}
                </span>
              ) : null}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <BarButton onClick={() => setAdding((open) => !open)} active={adding}>
                  <Plus size={13} />
                  Add a block
                </BarButton>
                <BarButton
                  onClick={() => mutate(defaultLayout(theme))}
                  disabled={matchesDefault(theme, blocks)}
                >
                  <RotateCcw size={13} />
                  Theme default
                </BarButton>
                <BarButton onClick={leaveEditing}>Done</BarButton>
                <BarButton primary disabled={!dirty || saving} onClick={handleSave}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                  Save layout
                </BarButton>
              </div>
            </>
          ) : (
            <>
              <span className="font-semibold">Theme preview</span>
              <nav className="flex flex-wrap gap-2" aria-label="Themes">
                {Object.values(THEMES).map((option) => {
                  const active = option.id === theme.id
                  return (
                    <Link
                      key={option.id}
                      href={`/preview/${projectUid}/${option.id}`}
                      className="inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1.5 no-underline"
                      style={
                        active
                          ? { background: '#f4f6f4', color: '#15201b', fontWeight: 600 }
                          : { border: '1px solid #3b4c43', color: '#cfdbd1' }
                      }
                    >
                      {option.label}
                      {option.id === data.theme ? ' (live)' : ''}
                    </Link>
                  )
                })}
              </nav>

              <div className="ml-auto flex flex-wrap items-center gap-4">
                {status ? (
                  <span className={status.kind === 'ok' ? 'text-[#8fd5a6]' : 'text-[#f1a8a8]'}>
                    {status.text}
                  </span>
                ) : null}
                <BarButton primary onClick={() => setEditing(true)}>
                  <Layers size={13} />
                  Arrange blocks
                </BarButton>
                <span className="flex items-center gap-1.5 text-[#9fb0a4]">
                  <Lock size={12} />
                  Only visible to you. Not indexed.
                </span>
              </div>
            </>
          )}
        </div>

        {confirmDiscard ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-[#3b4c43] bg-[#2a1d1d] px-5 py-2.5">
            <span>You have unsaved changes to this layout.</span>
            <div className="ml-auto flex gap-2">
              <BarButton onClick={() => setConfirmDiscard(false)}>Keep editing</BarButton>
              <BarButton onClick={discard}>Discard them</BarButton>
            </div>
          </div>
        ) : null}

        {editing && adding ? (
          <AddBlockPanel
            blocks={blocks}
            onAdd={(id: BlockId) => {
              const next = addBlock(blocks, id, theme)
              mutate(next)
              // A text block is useless until it has words in it, so open its
              // editor straight away rather than leaving an empty frame that
              // renders nothing on the page.
              const added = next.find((block) => !blocks.some((old) => old.key === block.key))
              if (added && BLOCK_CATALOGUE[id].editableText) setTextOpenKey(added.key as string)
            }}
            onClose={() => setAdding(false)}
          />
        ) : null}
      </div>

      {editing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveKey(null)
            setOverKey(null)
          }}
        >
          <SortableContext
            items={blocks.map((block) => block.key as string)}
            strategy={verticalListSortingStrategy}
          >
            {page}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#15201b] px-3.5 py-2 text-[0.8125rem] font-medium text-[#f4f6f4] shadow-lg">
                <GripVertical size={14} />
                {activeLabel}
              </span>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        page
      )}
    </>
  )
}

function BarButton({
  children,
  onClick,
  disabled,
  primary,
  active,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium',
        primary
          ? 'bg-[#f4f6f4] text-[#15201b] hover:bg-white'
          : 'border border-[#3b4c43] text-[#cfdbd1] hover:border-[#6f8a79]',
        active ? 'border-[#6f8a79] bg-[#223029]' : '',
        disabled ? 'cursor-not-allowed opacity-45 hover:bg-transparent' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
