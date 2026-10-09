import { fmtNum, humanizeStatus, isThreatened } from '../format'
import { EmptyNote, PhotoTile, Pill, Section, SectionHeading, TableScroll } from '../primitives'
import type { PublicPageSpecies } from '../types'
import type { BlockProps } from './types'

/** Warm amber, readable as dark text on its own tint. Not red, which reads as an error. */
const THREAT_COLOR = { bg: '#fbeadb', fg: '#7a3c10' }
const POLLINATOR_COLOR = { bg: '#f6e9f1', fg: '#6d2a52' }

/**
 * What is growing here.
 *
 * The biodiversity flags are the part worth having: native, threatened and
 * pollinator-friendly come straight from `scientific_species` and almost no
 * other public tree page can show them. Both variants render the same flags,
 * so the cards are not a softer claim than the table.
 */
export function SpeciesBlock({ data, theme, copy, spec }: BlockProps) {
  if (!data.species.length) {
    return (
      <Section id="pp-species">
        <SectionHeading tone={theme.tone} title={copy.speciesHeading} />
        <EmptyNote>No species have been recorded against this project yet.</EmptyNote>
      </Section>
    )
  }

  const variant = spec.variant ?? 'table'

  return (
    <Section id="pp-species">
      <SectionHeading
        tone={theme.tone}
        title={copy.speciesHeading}
        meta={theme.tone !== 'simple' ? copy.speciesSummary : undefined}
        lead={theme.tone === 'simple' ? copy.speciesSummary : undefined}
      />
      {variant === 'cards' ? (
        <Cards data={data} simple={theme.tone === 'simple'} />
      ) : (
        <Table data={data} />
      )}
    </Section>
  )
}

function Flags({ species, simple }: { species: PublicPageSpecies; simple?: boolean }) {
  const threatened = isThreatened(species.conservationStatus, species.isEndangered)
  return (
    <div className="flex flex-wrap gap-1.5">
      {species.isNative ? (
        <Pill tone={simple ? 'solid' : 'soft'}>{simple ? 'Grows here naturally' : 'Native'}</Pill>
      ) : null}
      {threatened ? (
        <Pill tone={simple ? 'solid' : 'soft'} color={simple ? { bg: '#8a3c10', fg: '#ffffff' } : THREAT_COLOR}>
          {simple ? 'At risk' : (humanizeStatus(species.conservationStatus) ?? 'Threatened')}
        </Pill>
      ) : null}
      {species.pollinatorFriendly ? (
        <Pill tone={simple ? 'solid' : 'soft'} color={simple ? { bg: '#a63d62', fg: '#ffffff' } : POLLINATOR_COLOR}>
          {simple ? 'Good for bees' : 'Pollinators'}
        </Pill>
      ) : null}
    </div>
  )
}

function Table({ data }: { data: BlockProps['data'] }) {
  const shown = data.species.slice(0, 8)
  const rest = data.species.slice(8)
  const restTrees = rest.reduce((sum, row) => sum + row.trees, 0)

  return (
    <TableScroll>
      <table className="pp-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Scientific name</th>
            <th style={{ width: '26%' }}>Common name</th>
            <th style={{ textAlign: 'right' }}>Trees</th>
            <th>Native</th>
            <th>Conservation status</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((species, index) => (
            <tr key={species.uid ?? `${species.scientificName}-${index}`}>
              <td className="italic">{species.scientificName ?? 'Unidentified'}</td>
              <td>{species.commonName ?? '-'}</td>
              <td className="pp-num" style={{ textAlign: 'right' }}>
                {fmtNum(species.trees)}
              </td>
              <td>{species.isNative === null ? 'Unknown' : species.isNative ? 'Yes' : 'No'}</td>
              <td>
                {isThreatened(species.conservationStatus, species.isEndangered) ? (
                  <Pill color={THREAT_COLOR}>
                    {humanizeStatus(species.conservationStatus) ?? 'Threatened'}
                  </Pill>
                ) : (
                  <span style={{ color: 'var(--pp-muted)' }}>
                    {humanizeStatus(species.conservationStatus) ?? 'Not assessed'}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {rest.length ? (
            <tr>
              <td colSpan={5} className="text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
                {fmtNum(rest.length)} more species, {fmtNum(restTrees)} trees.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </TableScroll>
  )
}

function Cards({ data, simple }: { data: BlockProps['data']; simple: boolean }) {
  const shown = data.species.slice(0, 5)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {shown.map((species, index) => (
        <div
          key={species.uid ?? `${species.scientificName}-${index}`}
          className="pt-4"
          style={{ borderTop: '2px solid var(--pp-accent)' }}
        >
          <PhotoTile image={species.image} folder="tree" height={120} />
          <div className="mt-3.5 text-base font-semibold">
            {species.commonName ?? species.scientificName ?? 'Unidentified'}
          </div>
          {species.scientificName ? (
            <div className="mt-0.5 text-[0.8125rem] italic" style={{ color: 'var(--pp-muted)' }}>
              {species.scientificName}
            </div>
          ) : null}
          <div className="mt-2.5">
            <Flags species={species} simple={simple} />
          </div>
          <div className="mt-2.5 text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
            {fmtNum(species.trees)} trees
          </div>
        </div>
      ))}
    </div>
  )
}
