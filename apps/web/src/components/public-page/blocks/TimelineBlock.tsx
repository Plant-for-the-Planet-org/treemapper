import { fmtTrees } from '../format'
import { Kicker, Section } from '../primitives'
import type { BlockProps } from './types'

/**
 * When the trees went in.
 *
 * Two exports on purpose. `TimelineChart` is the chart on its own, which the
 * Work block puts beside the intervention mix in its split layout, and
 * `TimelineBlock` is the same chart as a block a page can place anywhere.
 * Neither is a copy of the other, so a change to the bars shows up in both.
 */
export function TimelineBlock(props: BlockProps) {
  const points = visiblePoints(props.data)
  if (!points.length) return null

  return (
    <Section>
      <TimelineChart data={props.data} copy={props.copy} />
    </Section>
  )
}

/** Last four years of quarters keeps the bars wide enough to read on a phone. */
function visiblePoints(data: BlockProps['data']) {
  const points = data.timeline.slice(-16)
  const peak = points.reduce((max, point) => Math.max(max, point.trees), 0)
  return peak > 0 ? points : []
}

export function TimelineChart({
  data,
  copy,
}: {
  data: BlockProps['data']
  copy: BlockProps['copy']
}) {
  const points = visiblePoints(data)
  if (!points.length) return null

  const peak = points.reduce((max, point) => Math.max(max, point.trees), 0)

  // One label per year rather than per quarter, weighted by how many quarters
  // of that year are actually in view.
  const years: Array<{ year: number; count: number }> = []
  for (const point of points) {
    const last = years[years.length - 1]
    if (last && last.year === point.year) last.count += 1
    else years.push({ year: point.year, count: 1 })
  }

  return (
    <div>
      <h3 className="m-0 mb-6">
        <Kicker>{copy.timelineHeading}</Kicker>
      </h3>

      <div
        className="flex h-[184px] items-end gap-2.5"
        style={{ borderBottom: '1px solid var(--pp-ink)' }}
      >
        {points.map((point) => (
          <div
            key={point.period}
            className="flex-1"
            style={{
              height: `${Math.max(2, (point.trees / peak) * 100)}%`,
              background: 'var(--pp-accent)',
            }}
            title={`${point.period}: ${fmtTrees(point.trees)} trees`}
          />
        ))}
      </div>

      <div className="mt-2 flex gap-2.5">
        {years.map((year) => (
          <span
            key={year.year}
            className="pp-num text-[0.6875rem]"
            style={{ flex: year.count, color: 'var(--pp-muted)' }}
          >
            {year.year}
          </span>
        ))}
      </div>

      <p className="mt-3.5 mb-0 text-xs" style={{ color: 'var(--pp-muted)' }}>
        {copy.timelineNote} Peak quarter was {fmtTrees(peak)} trees.
      </p>
    </div>
  )
}
