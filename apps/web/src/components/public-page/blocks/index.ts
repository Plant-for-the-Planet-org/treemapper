import type { BlockId } from '../themes'
import { BadgesBlock } from './BadgesBlock'
import { HeroBlock } from './HeroBlock'
import { MapBlock } from './MapBlock'
import { AnchorNavBlock, DataBlock, DetailSeamBlock, FooterBlock } from './MiscBlocks'
import { MonitoringBlock } from './MonitoringBlock'
import { NarrativeBlock } from './NarrativeBlock'
import { NumbersBlock } from './NumbersBlock'
import { PeopleBlock } from './PeopleBlock'
import { PhotosBlock } from './PhotosBlock'
import { ShareBlock } from './ShareBlock'
import { SpeciesBlock } from './SpeciesBlock'
import { VerificationBlock } from './VerificationBlock'
import { WorkBlock } from './WorkBlock'
import type { BlockComponent } from './types'

/**
 * The block registry.
 *
 * A theme names blocks by id and never imports one, so themes.ts stays a
 * configuration file. Adding a block means an entry here plus an id in
 * `BlockId`; nothing else in the renderer changes.
 */
export const BLOCKS: Record<BlockId, BlockComponent> = {
  hero: HeroBlock,
  anchorNav: AnchorNavBlock,
  numbers: NumbersBlock,
  verification: VerificationBlock,
  narrative: NarrativeBlock,
  map: MapBlock,
  photos: PhotosBlock,
  species: SpeciesBlock,
  monitoring: MonitoringBlock,
  work: WorkBlock,
  people: PeopleBlock,
  badges: BadgesBlock,
  detailSeam: DetailSeamBlock,
  data: DataBlock,
  share: ShareBlock,
  footer: FooterBlock,
}

export type { BlockComponent, BlockProps } from './types'
