import { Section } from '../primitives'
import type { BlockProps } from './types'

/**
 * One short paragraph between the opening and the map, so the page says
 * something in sentences and not only in figures. The text comes from the
 * tone, built from the project's own counts rather than written by hand.
 */
export function NarrativeBlock({ copy }: BlockProps) {
  return (
    <Section>
      <p
        className="pp-display m-0 max-w-[24ch]"
        style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', fontWeight: 400, lineHeight: 1.2 }}
      >
        {copy.narrativeLead}
      </p>
      <p
        className="mt-7 mb-0 max-w-[62ch] text-lg leading-relaxed"
        style={{ color: 'var(--pp-muted)' }}
      >
        {copy.narrativeBody}
      </p>
    </Section>
  )
}
