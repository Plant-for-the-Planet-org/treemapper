import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { BLOCKS } from './blocks'
import { resolveCopy } from './copy'
import './public-page.css'
import type { BlockSpec, ThemeConfig } from './themes'
import type { PublicProjectPage } from './types'

/**
 * Renders a public project page in a given theme.
 *
 * All the renderer does is walk a block list. It knows nothing about what any
 * block contains, which is the point: a theme is data, and the blocks are
 * shared by all four of them.
 *
 * Three jobs beyond that walk:
 *  1. Put the theme's tokens on the wrapper as CSS custom properties, so every
 *     block styles itself from variables rather than from props.
 *  2. Group consecutive blocks that declare the same `surface` into one band,
 *     which is how the Full theme draws its story half and its detail half on
 *     different grounds without any block knowing where it sits.
 *  3. Hand each rendered block to `wrapBlock` when one is given, which is the
 *     single seam the layout editor needs. The editor adds its handles around
 *     the real block rather than drawing a stand-in, so what someone arranges
 *     is literally the page a visitor gets.
 */
export function PublicProjectPageView({
  data,
  theme,
  fontClassName,
  blocks,
  wrapBlock,
}: {
  data: PublicProjectPage
  theme: ThemeConfig
  /** `next/font` variable classes for the faces this theme uses. */
  fontClassName: string
  /** The arrangement to render. Defaults to the theme's own list. */
  blocks?: BlockSpec[]
  /** Editor hook. Left out on every public render. */
  wrapBlock?: (spec: BlockSpec, node: ReactNode, index: number) => ReactNode
}) {
  const copy = resolveCopy(theme.tone, data)
  const list = blocks ?? theme.blocks
  const bands = groupBySurface(list)

  return (
    <div
      className={`pp-root ${fontClassName}`}
      style={theme.tokens as CSSProperties}
      data-pp-theme={theme.id}
    >
      {bands.map((band, bandIndex) => (
        <Band key={`${band.surface}-${bandIndex}`} surface={band.surface}>
          {band.blocks.map((spec, index) => {
            const Block = BLOCKS[spec.id]
            if (!Block) return null

            const key = spec.key ?? `${spec.id}-${index}`
            const node = <Block data={data} theme={theme} copy={copy} spec={spec} />
            const position = list.indexOf(spec)

            return (
              <Fragment key={key}>
                {wrapBlock ? wrapBlock(spec, node, position) : node}
              </Fragment>
            )
          })}
        </Band>
      ))}
    </div>
  )
}

interface Band {
  surface: 'base' | 'detail'
  blocks: BlockSpec[]
}

function groupBySurface(blocks: BlockSpec[]): Band[] {
  const bands: Band[] = []
  for (const spec of blocks) {
    const surface = spec.surface ?? 'base'
    const last = bands[bands.length - 1]
    if (last && last.surface === surface) last.blocks.push(spec)
    else bands.push({ surface, blocks: [spec] })
  }
  return bands
}

/**
 * One background region. Vertical rhythm lives here rather than on each block,
 * so a block can be moved between themes without carrying its own spacing
 * assumptions with it.
 */
function Band({ surface, children }: { surface: 'base' | 'detail'; children: ReactNode }) {
  if (surface === 'detail') {
    return (
      <div
        style={{
          background: 'var(--pp-detail-bg, var(--pp-bg))',
          borderTop: '1px solid var(--pp-line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--pp-gap)',
          paddingTop: 'var(--pp-gap)',
          paddingBottom: 'var(--pp-gap)',
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-gap)' }}>{children}</div>
  )
}
