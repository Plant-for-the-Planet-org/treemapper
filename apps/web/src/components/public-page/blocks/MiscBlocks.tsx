import { ANCHOR_SECTIONS } from '../themes'
import { fmtDate } from '../format'
import {
  ActionLink,
  DownloadIcon,
  PP_CONTAINER,
  Section,
  TreeMark,
} from '../primitives'
import type { BlockProps } from './types'

/**
 * The small structural blocks: the sticky nav, the seam between story and
 * detail, the data downloads and the footer. They are grouped in one file
 * because each is a handful of lines and none has a variant worth its own
 * module.
 */

/**
 * Sticky section nav, used by the Full theme where the page is long enough
 * that a reader needs a way back. Plain anchors, so it works with JavaScript
 * off and costs nothing on a static page.
 */
export function AnchorNavBlock({ data }: BlockProps) {
  return (
    <nav
      className="pp-no-print sticky top-0 z-20"
      style={{ background: 'var(--pp-bg)', borderBottom: '1px solid var(--pp-line)' }}
      aria-label="Page sections"
    >
      <div className={`${PP_CONTAINER} flex min-h-[60px] flex-wrap items-center gap-x-7 gap-y-2 py-3`}>
        <span className="text-[0.8125rem] font-semibold">{data.project.name}</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {ANCHOR_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="no-underline hover:underline">
              {section.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

/**
 * The visible break between the story half and the evidence half. It changes
 * the background as well as the heading, so a reader can see they have crossed
 * into a different kind of reading rather than just more of the same.
 */
export function DetailSeamBlock({ data, copy }: BlockProps) {
  return (
    <Section id="pp-detail">
      <div
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-2"
        style={{ borderTop: '1px solid var(--pp-line)' }}
      >
        <div className="pt-10">
          <h2 className="pp-display m-0" style={{ fontSize: 'var(--pp-h2-size)', fontWeight: 400 }}>
            {copy.detailHeading}
          </h2>
          <p className="mt-2.5 mb-0 max-w-[60ch] text-base" style={{ color: 'var(--pp-muted)' }}>
            {copy.detailBody}
          </p>
        </div>
        <span className="pp-num text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
          Data snapshot {fmtDate(data.snapshotAt)}
        </span>
      </div>
    </Section>
  )
}

/**
 * Downloads.
 *
 * Both links point at route handlers that re-serve exactly what this page was
 * rendered from, so what a reader downloads is what they are looking at. Site
 * boundaries only, matching the map.
 */
export function DataBlock({ data, copy }: BlockProps) {
  const slug = data.project.slug ?? data.project.uid

  return (
    <Section id="pp-data">
      <div className="flex flex-wrap justify-between gap-x-10 gap-y-7 pt-7" style={{ borderTop: '2px solid var(--pp-ink)' }}>
        <div className="min-w-0 flex-[999_1_28rem]">
          <h2 className="m-0 mb-2.5 text-xl font-semibold">{copy.dataHeading}</h2>
          <p className="m-0 max-w-[60ch] text-sm" style={{ color: 'var(--pp-muted)' }}>
            {copy.dataBody}
          </p>
        </div>
        <div className="pp-no-print flex flex-[1_1_18rem] flex-col items-start gap-2.5">
          <ActionLink href={`/p/${slug}/sites.geojson`} download>
            <DownloadIcon />
            Site boundaries (GeoJSON)
          </ActionLink>
          <ActionLink href={`/p/${slug}/data.json`} tone="outline" download>
            <DownloadIcon />
            Everything on this page (JSON)
          </ActionLink>
        </div>
      </div>
    </Section>
  )
}

export function FooterBlock({ data, copy, spec }: BlockProps) {
  const inverse = spec.variant === 'inverse'

  return (
    <footer
      className={inverse ? 'pp-inverse' : undefined}
      style={
        inverse
          ? undefined
          : { borderTop: '1px solid var(--pp-line)', background: 'var(--pp-surface)' }
      }
    >
      <div className={`${PP_CONTAINER} flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-8`}>
        <div className="flex items-center gap-2.5">
          <TreeMark size={18} color={inverse ? 'var(--pp-inverse-muted)' : 'var(--pp-muted)'} />
          <span
            className="text-[0.8125rem]"
            style={{ color: inverse ? 'var(--pp-inverse-muted)' : 'var(--pp-muted)' }}
          >
            {copy.footerLine}. Snapshot of {fmtDate(data.snapshotAt)}.
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-[0.8125rem]">
          {data.project.website ? (
            <a href={data.project.website} className="pp-link" rel="noopener noreferrer nofollow">
              Project website
            </a>
          ) : null}
          <a href="https://www.plant-for-the-planet.org/privacy-terms/" className="pp-link" rel="noopener noreferrer">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  )
}
