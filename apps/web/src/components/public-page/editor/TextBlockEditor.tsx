'use client'

import { PUBLIC_PAGE_TEXT_BODY_MAX, PUBLIC_PAGE_TEXT_HEADING_MAX } from '../types'

/**
 * The words on a custom text block.
 *
 * Edited in place rather than in a modal, because the sentence being typed and
 * the page it sits on should be visible at the same time. Changes are held in
 * the arrangement and only reach the server when the layout is saved, so
 * closing this panel never publishes anything on its own.
 *
 * Plain text only, and the limits below are the same ones the server enforces.
 * Anything typed here goes on a page anyone can read, which the note says out
 * loud rather than leaving it to be discovered.
 */
export function TextBlockEditor({
  content,
  onChange,
  onClose,
}: {
  content: { heading?: string; body?: string }
  onChange: (content: { heading: string; body: string }) => void
  onClose: () => void
}) {
  const heading = content.heading ?? ''
  const body = content.body ?? ''

  return (
    <div className="pp-editor-chrome pointer-events-auto border-b border-slate-200 bg-white p-4">
      <div className="mx-auto flex max-w-[68ch] flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-700">Heading</span>
          <input
            type="text"
            value={heading}
            maxLength={PUBLIC_PAGE_TEXT_HEADING_MAX}
            placeholder="Why this valley"
            onChange={(event) => onChange({ heading: event.target.value, body })}
            className="h-9 rounded-[6px] border border-slate-300 px-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-700">Text</span>
          <textarea
            value={body}
            rows={5}
            maxLength={PUBLIC_PAGE_TEXT_BODY_MAX}
            placeholder="A few sentences in your own words. Leave a blank line to start a new paragraph."
            onChange={(event) => onChange({ heading, body: event.target.value })}
            className="resize-y rounded-[6px] border border-slate-300 p-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-slate-500"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[0.6875rem] text-slate-500">
            Plain text. This is published to anyone with the link.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[0.6875rem] text-slate-400">
              {body.length} / {PUBLIC_PAGE_TEXT_BODY_MAX}
            </span>
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
    </div>
  )
}
