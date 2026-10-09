import { fmtDate, fmtNum, fmtRate, fmtShortDate } from '../format'
import { EmptyNote, Section, SectionHeading, TableScroll } from '../primitives'
import type { BlockProps } from './types'

/**
 * Survival, per site.
 *
 * Shows losses rather than netting them out, and says in the footnote that the
 * rate covers remeasured trees only. A survival figure without that sentence
 * is the single easiest number on this page to misread.
 */
export function MonitoringBlock({ data, theme, copy }: BlockProps) {
  const { monitoring } = data

  if (!monitoring.remeasured) {
    return (
      <Section id="pp-monitoring">
        <SectionHeading tone={theme.tone} title={copy.monitoringHeading} />
        <EmptyNote>
          No trees have been remeasured yet, so there is no survival rate to publish.
        </EmptyNote>
      </Section>
    )
  }

  const rows = monitoring.perSite.filter((row) => row.trees > 0)
  const totalTrees = rows.reduce((sum, row) => sum + row.trees, 0)

  return (
    <Section id="pp-monitoring">
      <SectionHeading
        tone={theme.tone}
        title={copy.monitoringHeading}
        meta={
          monitoring.lastCheckedAt
            ? `${fmtNum(monitoring.remeasured)} trees remeasured, most recently ${fmtDate(monitoring.lastCheckedAt)}`
            : `${fmtNum(monitoring.remeasured)} trees remeasured`
        }
      />

      <TableScroll>
        <table className="pp-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Site</th>
              <th style={{ textAlign: 'right' }}>Trees</th>
              <th>Last check</th>
              <th style={{ textAlign: 'right' }}>Remeasured</th>
              <th style={{ textAlign: 'right' }}>Alive</th>
              <th style={{ textAlign: 'right' }}>Survival</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.uid}>
                <td>{row.name}</td>
                <td className="pp-num" style={{ textAlign: 'right' }}>
                  {fmtNum(row.trees)}
                </td>
                <td className="pp-num">{fmtShortDate(row.lastCheckedAt) ?? 'Not yet'}</td>
                <td className="pp-num" style={{ textAlign: 'right' }}>
                  {fmtNum(row.remeasured)}
                </td>
                <td className="pp-num" style={{ textAlign: 'right' }}>
                  {fmtNum(row.alive)}
                </td>
                <td className="pp-num" style={{ textAlign: 'right' }}>
                  {fmtRate(row.alive, row.remeasured, '-')}
                </td>
              </tr>
            ))}
            <tr data-total="">
              <td>All sites</td>
              <td className="pp-num" style={{ textAlign: 'right' }}>
                {fmtNum(totalTrees)}
              </td>
              <td />
              <td className="pp-num" style={{ textAlign: 'right' }}>
                {fmtNum(monitoring.remeasured)}
              </td>
              <td className="pp-num" style={{ textAlign: 'right' }}>
                {fmtNum(monitoring.alive)}
              </td>
              <td className="pp-num" style={{ textAlign: 'right' }}>
                {fmtRate(monitoring.alive, monitoring.remeasured, '-')}
              </td>
            </tr>
          </tbody>
        </table>
      </TableScroll>

      <p className="mt-4 mb-0 max-w-[72ch] text-xs" style={{ color: 'var(--pp-muted)' }}>
        {copy.monitoringNote}
      </p>
    </Section>
  )
}
