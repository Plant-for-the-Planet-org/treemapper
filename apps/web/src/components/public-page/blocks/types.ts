import type { ComponentType } from 'react'
import type { ResolvedCopy } from '../copy'
import type { BlockSpec, ThemeConfig } from '../themes'
import type { PublicProjectPage } from '../types'

/**
 * Every block takes the same four things and nothing else.
 *
 * It gets the whole page payload, not a slice, so a block can be moved between
 * themes without the renderer learning what it needs. It gets `copy` rather
 * than hard-coded strings, and `spec.variant` for the handful of places where
 * the layout, not just the styling, genuinely differs.
 */
export interface BlockProps {
  data: PublicProjectPage
  theme: ThemeConfig
  copy: ResolvedCopy
  spec: BlockSpec
}

export type BlockComponent = ComponentType<BlockProps>
