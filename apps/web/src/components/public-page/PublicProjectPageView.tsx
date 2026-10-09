import type { CSSProperties, ReactNode } from 'react'
import { BLOCKS } from './blocks'
import { resolveCopy } from './copy'
import './public-page.css'
import type { BlockSpec, ThemeConfig } from './themes'
import type { PublicProjectPage } from './types'

/**
 * Renders a public project page in a given theme.
 *
 * All the renderer does is walk the theme's block list. It knows nothing about
 * what any block contains, which is the point: a theme is data, and the blocks
 * are shared by all four of them.
 *
 * Two jobs beyond that walk:
 *  1. Put the theme's tokens on the wrapper as CSS custom properties, so every
 *     block styles itself from variables rather than from props.
 *  2. Group consecutive blocks that declare the same `surface` into one band,
 *     which is how the Full theme draws its story half and its detail half on
 *     different grounds without any block knowing where it sits.
 */
export function PublicProjectPageView({
  data,
  theme,
  fontClassName,
}: {
  data: PublicProjectPage
  theme: ThemeConfig
  /** `next/font` variable classes for the faces this theme uses. */
  fontClassName: string
}) {
  const copy = resolveCopy(theme.tone, data)
  const bands = groupBySurface(theme.blocks)

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
            return (
              <Block
                key={spec.key ?? `${spec.id}-${index}`}
                data={data}
                theme={theme}
                copy={copy}
                spec={spec}
              />
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
