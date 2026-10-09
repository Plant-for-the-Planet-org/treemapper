import { fmtNum, fmtTrees, humanizeType } from '../format'
import { EmptyNote, Kicker, Section } from '../primitives'
import type { BlockProps } from './types'

/** Three steps of the accent, so the stacked bar reads without a legend lookup. */
const SHADES = ['var(--pp-accent)', '#5d9b77', '#a8c7b4']

/**
 * What the work actually was, and when it happened.
 *
 * Two things sit side by side here on purpose. The mix is the part that shows
 * this is restoration rather than tree counting, so the types that planted
 * nothing (fire patrol, fencing, invasive removal) are listed rather than
 * dropped for being zero.
 */
export function WorkBlock({ data, copy }: BlockProps) {
  const { planting, other } = data.work
  if (!planting.length && !other.length) return null

  return (
    <Section>
      <div className="flex flex-wrap gap-x-14 gap-y-12">
        <div className="min-w-0 flex-[1_1_24rem]">
          <Mix planting={planting} other={other} copy={copy} />
        </div>
        <div className="min-w-0 flex-[999_1_28rem]">
          <Timeline data={data} copy={copy} />
        </div>
      </div>
    </Section>
  )
}

function Mix({
  planting,
  other,
  copy,
}: {
  planting: BlockProps['data']['work']['planting']
  other: BlockProps['data']['work']['other']
  copy: BlockProps['copy']
}) {
  const total = planting.reduce((sum, item) => sum + item.trees, 0)
  const top = planting.slice(0, 3)
  const rest = planting.slice(3)
  const restTrees = rest.reduce((sum, item) => sum + item.trees, 0)
  const bars = restTrees > 0 ? [...top, { type: 'Other types', trees: restTrees, records: 0 }] : top

  return (
    <div>
      <h3 className="m-0 mb-6">
        <Kicker>{copy.workHeading}</Kicker>
      </h3>

      {total > 0 ? (
        <>
          <div className="flex h-3.5 w-full gap-0.5">
            {bars.map((item, index) => (
              <div
                key={item.type}
                style={{
                  width: `${(item.trees / total) * 100}%`,
                  background: SHADES[index % SHADES.length],
                }}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {bars.map((item, index) => (
              <div
                key={item.type}
                className="flex items-baseline justify-between gap-3 pb-2.5 text-sm"
                style={{ borderBottom: '1px solid var(--pp-line)' }}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 flex-none"
                    style={{ background: SHADES[index % SHADES.length] }}
                  />
                  {humanizeType(item.type)}
                </span>
                <span className="pp-num">{fmtTrees(item.trees)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyNote>No tree registrations recorded yet.</EmptyNote>
      )}

      {other.length ? (
        <>
          <p
            className="mt-6 mb-2.5 text-xs uppercase tracking-[0.09em]"
            style={{ color: 'var(--pp-muted)' }}
          >
            {copy.workOtherHeading}
          </p>
          <div className="flex flex-wrap gap-2">
            {other.map((item) => (
              <span
                key={item.type}
                className="px-2.5 py-1.5 text-[0.8125rem]"
                style={{ border: '1px solid var(--pp-line)', borderRadius: 'var(--pp-radius-pill)' }}
              >
                {humanizeType(item.type)}{' '}
                <span className="pp-num" style={{ color: 'var(--pp-muted)' }}>
                  {fmtNum(item.records)}
                </span>
              </span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function Timeline({ data, copy }: { data: BlockProps['data']; copy: BlockProps['copy'] }) {
  // Last four years of quarters keeps the bars wide enough to read on a phone.
  const points = data.timeline.slice(-16)
  if (!points.length) return null

  const peak = points.reduce((max, point) => Math.max(max, point.trees), 0)
  if (peak <= 0) return null

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
