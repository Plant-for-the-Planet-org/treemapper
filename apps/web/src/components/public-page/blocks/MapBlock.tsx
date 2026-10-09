import { Section, SectionHeading } from '../primitives'
import { SiteMap } from './SiteMap'
import type { BlockProps } from './types'

const HEIGHTS: Record<string, number> = {
  framed: 420,
  bleed: 520,
  rounded: 400,
}

/**
 * Where the work is.
 *
 * Every variant carries the privacy line in the visible caption, not only in
 * the code. Putting the rule on the page is what stops it quietly drifting
 * the next time someone adds a layer.
 */
export function MapBlock({ data, theme, copy, spec }: BlockProps) {
  const variant = spec.variant ?? 'framed'
  const height = HEIGHTS[variant] ?? 420
  const accent = theme.tokens['--pp-accent'] ?? '#2e7d4f'

  return (
    <Section id="pp-map">
      <SectionHeading
        tone={theme.tone}
        title={copy.mapHeading}
        meta={theme.tone === 'formal' ? copy.mapPrivacy : undefined}
        lead={theme.tone === 'simple' ? copy.mapPrivacy : undefined}
      />

      <SiteMap features={data.sites.features} height={height} accent={accent} />

      <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-4">
        <span className="text-sm" style={{ color: 'var(--pp-muted)' }}>
          {copy.mapCaption}
        </span>
        {theme.tone === 'warm' ? (
          <span className="text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
            {copy.mapPrivacy}
          </span>
        ) : null}
      </div>
    </Section>
  )
}
