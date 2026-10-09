import { fmtHectares, fmtNum, fmtPercent, fmtTrees } from '../format'
import { Section, Stat } from '../primitives'
import type { BlockProps } from './types'

/**
 * The headline figures.
 *
 * All three variants read the same totals, so no theme can quote a different
 * number from another. What changes is how many are shown and how loudly:
 *
 *  - `rules`   six figures under hairlines, the report's summary row
 *  - `display` three large figures in the display face
 *  - `cards`   four tinted cards, each with a second line of context
 */
export function NumbersBlock({ data, copy, spec }: BlockProps) {
  const variant = spec.variant ?? 'rules'
  const { totals, verification } = data

  if (variant === 'display') {
    const figures = [
      totals.hectares > 0
        ? { value: fmtHectares(totals.hectares), label: copy.statLabels.hectares }
        : null,
      totals.species > 0
        ? {
            value: fmtNum(totals.species),
            label:
              totals.speciesAssessed > 0
                ? `${copy.statLabels.species}, ${fmtNum(totals.nativeSpecies)} of them native here`
                : copy.statLabels.species,
          }
        : null,
      verification.total > 0
        ? {
            value: fmtPercent(verification.withPhoto, verification.total),
            label: 'of trees carry a GPS point and a photo',
          }
        : { value: fmtTrees(totals.trees), label: copy.statLabels.trees },
    ].filter(Boolean) as Array<{ value: string; label: string }>

    return (
      <Section>
        <div className="grid grid-cols-1 gap-x-14 gap-y-10 sm:grid-cols-3">
          {figures.map((figure) => (
            <Stat key={figure.label} variant="display" value={figure.value} label={figure.label} />
          ))}
        </div>
      </Section>
    )
  }

  if (variant === 'cards') {
    const tints = ['#fdf1d4', 'var(--pp-accent-soft)', '#e4eef8', '#f8e6ee']
    const cards = [
      {
        value: fmtNum(totals.sites),
        label: copy.statLabels.sites,
        hint: totals.hectares > 0 ? `${fmtHectares(totals.hectares)} hectares in all` : undefined,
      },
      {
        value: fmtNum(totals.species),
        label: copy.statLabels.species,
        hint:
          totals.speciesAssessed > 0 && totals.nativeSpecies > 0
            ? `${fmtNum(totals.nativeSpecies)} grow here naturally`
            : undefined,
      },
      {
        value: fmtNum(data.monitoring.remeasured),
        label: 'trees we checked again',
        hint:
          data.monitoring.remeasured > 0
            ? `${fmtPercent(data.monitoring.alive, data.monitoring.remeasured)} are still growing`
            : undefined,
      },
      {
        value: fmtNum(totals.contributors),
        label: copy.statLabels.contributors,
        hint: totals.monitoringPlots > 0 ? `${fmtNum(totals.monitoringPlots)} monitoring plots` : undefined,
      },
    ]

    return (
      <Section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <Stat
              key={card.label}
              variant="cards"
              tint={tints[index % tints.length]}
              value={card.value}
              label={card.label}
              hint={card.hint}
            />
          ))}
        </div>
      </Section>
    )
  }

  const figures = [
    { value: fmtTrees(totals.trees), label: copy.statLabels.trees },
    { value: fmtHectares(totals.hectares), label: copy.statLabels.hectares },
    { value: fmtNum(totals.sites), label: copy.statLabels.sites },
    { value: fmtNum(totals.species), label: copy.statLabels.species },
    { value: fmtNum(totals.monitoringPlots), label: copy.statLabels.plots },
    { value: fmtNum(totals.contributors), label: copy.statLabels.contributors },
  ]

  return (
    <Section>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {figures.map((figure) => (
          <Stat key={figure.label} variant="rules" value={figure.value} label={figure.label} />
        ))}
      </div>
    </Section>
  )
}
