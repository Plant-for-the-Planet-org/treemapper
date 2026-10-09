import { fmtHectares, fmtNum, fmtPercent, fmtTrees, yearOf } from './format'
import type { Tone } from './themes'
import type { PublicProjectPage } from './types'

/**
 * Wording per tone.
 *
 * The same number reads very differently to a funder and to a school, so tone
 * lives here rather than being branched inside fifteen block components. A
 * block asks for a string and never knows which theme it is in.
 *
 * Simple English throughout, and no em dashes.
 */

export interface Copy {
  heroEyebrow: (d: PublicProjectPage) => string
  heroHeadline: (d: PublicProjectPage) => string
  heroSubline: (d: PublicProjectPage) => string
  statLabels: Record<
    'trees' | 'hectares' | 'sites' | 'species' | 'plots' | 'contributors',
    string
  >
  verificationHeadline: (d: PublicProjectPage) => string
  verificationLabels: { gps: string; photo: string; onSite: string }
  narrativeLead: string
  narrativeBody: (d: PublicProjectPage) => string
  monitoringHeading: string
  monitoringSummary: (d: PublicProjectPage) => string
  monitoringNote: string
  speciesHeading: string
  speciesSummary: (d: PublicProjectPage) => string
  workHeading: string
  workOtherHeading: string
  timelineHeading: string
  timelineNote: string
  mapHeading: string
  mapCaption: (d: PublicProjectPage) => string
  mapPrivacy: string
  photosHeading: string
  peopleHeading: (d: PublicProjectPage) => string
  peopleConsentNote: string
  badgesHeading: string
  dataHeading: string
  dataBody: string
  shareHeading: string
  goalHeading: string
  goalNote: (d: PublicProjectPage) => string
  detailHeading: string
  detailBody: string
  footerLine: (d: PublicProjectPage) => string
}

const where = (d: PublicProjectPage) =>
  [d.project.ecosystem, d.project.country].filter(Boolean).join(', ')

const since = (d: PublicProjectPage) => {
  const year = yearOf(d.project.startedAt)
  return year ? `since ${year}` : 'so far'
}

const FORMAL: Copy = {
  heroEyebrow: () => 'Restoration project report',
  heroHeadline: (d) => d.project.name,
  heroSubline: (d) => {
    const place = where(d)
    const start = yearOf(d.project.startedAt)
    const parts = [place, start ? `Recording interventions since ${start}.` : null]
    return parts.filter(Boolean).join('. ')
  },
  statLabels: {
    trees: 'Trees recorded',
    hectares: 'Hectares under work',
    sites: 'Sites',
    species: 'Species',
    plots: 'Monitoring plots',
    contributors: 'Contributors',
  },
  verificationHeadline: (d) =>
    `${fmtPercent(d.verification.withPhoto, d.verification.total, 'A share of')} of recorded trees carry both a GPS position and a photograph taken in the field.`,
  verificationLabels: { gps: 'GPS position', photo: 'Photograph', onSite: 'Captured on site' },
  narrativeLead: 'This is not an estimate. It is a record.',
  narrativeBody: () =>
    `Every tree counted here was registered on site, with its position and, in most cases, a photograph. Measurements are repeated on the same trees over time, and losses are recorded alongside survivals.`,
  monitoringHeading: 'Survival and monitoring',
  monitoringSummary: (d) =>
    `${fmtNum(d.monitoring.remeasured)} trees remeasured across ${fmtNum(d.totals.sites)} sites.`,
  monitoringNote:
    'Survival is counted on remeasured trees only. It is not estimated across the whole planting, and losses are included rather than removed from the total.',
  speciesHeading: 'Species planted',
  speciesSummary: (d) =>
    `${fmtNum(d.totals.nativeSpecies)} of ${fmtNum(d.totals.species)} species are native. ${fmtNum(d.totals.threatenedSpecies)} carry an IUCN threatened status.`,
  workHeading: 'What the work was',
  workOtherHeading: 'Work that plants no trees',
  timelineHeading: 'Trees recorded per quarter',
  timelineNote: 'Grouped by registration date.',
  mapHeading: 'Where the work is',
  mapCaption: (d) =>
    `${fmtNum(d.totals.sites)} sites across ${fmtHectares(d.totals.hectares)} hectares${d.project.country ? ` in ${d.project.country}` : ''}.`,
  mapPrivacy: 'Site boundaries only. Individual tree positions are not published.',
  photosHeading: 'From the field',
  peopleHeading: (d) => `${fmtNum(d.people.count)} people recorded this work`,
  peopleConsentNote: 'Names are shown only where the contributor agreed to appear here.',
  badgesHeading: 'Milestones',
  dataHeading: 'Check the data yourself',
  dataBody:
    'Everything on this page comes from records made in the field and is published unchanged. Site boundaries are released as GeoJSON. Species counts, intervention records and measurement history are released as CSV.',
  shareHeading: 'Share this page',
  goalHeading: 'Progress against target',
  goalNote: (d) => `Target of ${fmtNum(d.project.target ?? 0)} trees.`,
  detailHeading: 'The detail',
  detailBody:
    'Every figure above, with the record behind it. Written for anyone checking the work rather than reading about it.',
  footerLine: () => 'Recorded with TreeMapper by Plant-for-the-Planet',
}

const WARM: Copy = {
  ...FORMAL,
  heroEyebrow: (d) => [d.project.name, d.project.country].filter(Boolean).join(', '),
  heroHeadline: (d) =>
    d.totals.trees > 0
      ? `${fmtTrees(d.totals.trees)} trees. Every one of them mapped.`
      : d.project.name,
  heroSubline: (d) =>
    d.project.description?.trim() ||
    `Restoration work ${where(d) ? `in the ${where(d).toLowerCase()}` : ''} ${since(d)}, recorded tree by tree by the people who planted it.`
      .replace(/\s+/g, ' ')
      .trim(),
  statLabels: {
    trees: 'trees recorded, each one on the map',
    hectares: 'hectares coming back',
    sites: 'places we work',
    species: 'species planted',
    plots: 'monitoring plots',
    contributors: 'people doing the work',
  },
  verificationHeadline: (d) =>
    `${fmtPercent(d.verification.withPhoto, d.verification.total, 'Most')} of these trees carry a GPS point and a photo.`,
  narrativeLead: 'This is not an estimate. It is a record.',
  narrativeBody: (d) =>
    `${fmtNum(d.people.count)} people have walked these ${fmtNum(d.totals.sites)} sites with a phone in hand. Every tree was photographed and pinned where it stands. They go back and measure the same trees again, and record the ones that did not make it.`,
  speciesHeading: 'What is growing here',
  speciesSummary: (d) =>
    `${fmtNum(d.totals.nativeSpecies)} of ${fmtNum(d.totals.species)} species are native to this ecoregion`,
  mapHeading: 'Where our work is',
  mapPrivacy: 'Site boundaries only. Exact tree positions stay private.',
  photosHeading: 'From the field',
  shareHeading: 'Pass it on',
  footerLine: () => 'Recorded with TreeMapper by Plant-for-the-Planet',
}

const SIMPLE: Copy = {
  ...FORMAL,
  heroEyebrow: () => 'Our tree goal',
  heroHeadline: (d) =>
    d.totals.trees > 0 ? `We planted ${fmtTrees(d.totals.trees)} trees!` : d.project.name,
  heroSubline: (d) => {
    const target = d.project.target
    if (target && target > 0) {
      const share = Math.min(100, Math.round((d.totals.trees / target) * 100))
      return `That is ${share}% of the way to our goal of ${fmtNum(target)}. Every tree is on the map, with a photo we took ourselves.`
    }
    return 'Every tree is on the map, with a photo we took ourselves.'
  },
  statLabels: {
    trees: 'trees we planted',
    hectares: 'hectares we look after',
    sites: 'places we planted',
    species: 'kinds of tree',
    plots: 'spots we check often',
    contributors: 'of us did the work',
  },
  verificationHeadline: (d) =>
    `${fmtPercent(d.verification.withPhoto, d.verification.total, 'Most')} of our trees have a photo and a map pin.`,
  verificationLabels: { gps: 'on the map', photo: 'with a photo', onSite: 'added outdoors' },
  narrativeLead: 'We wrote down every tree.',
  narrativeBody: (d) =>
    `There are ${fmtNum(d.people.count)} of us. We plant a tree, take its photo, and mark where it stands. Later we come back and see how it is doing.`,
  monitoringHeading: 'How our trees are doing',
  monitoringSummary: (d) => `We went back and checked ${fmtNum(d.monitoring.remeasured)} trees.`,
  monitoringNote:
    'We only count trees we went back to see. Trees that did not make it are counted too, because that is part of the story.',
  speciesHeading: 'Meet our trees',
  speciesSummary: (d) =>
    `${fmtNum(d.totals.nativeSpecies)} of our ${fmtNum(d.totals.species)} kinds of tree grow here naturally`,
  workHeading: 'What we did',
  workOtherHeading: 'Other work we did',
  timelineHeading: 'Trees we planted over time',
  mapHeading: 'Where our forest is',
  mapCaption: (d) =>
    `${fmtNum(d.totals.sites)} places, ${fmtHectares(d.totals.hectares)} hectares.`,
  mapPrivacy:
    'The map shows the places we work. We keep the exact spot of each tree private so nobody can go and take them.',
  photosHeading: 'Days we will remember',
  peopleHeading: () => 'Our team',
  peopleConsentNote:
    'Names and photos are shown only where the person, or their parent or guardian, has said yes. Everyone else counts just the same.',
  badgesHeading: 'What we have earned',
  dataHeading: 'See the numbers',
  dataBody:
    'All of this comes straight from what we wrote down outside. Anyone can download it and check.',
  shareHeading: 'Show someone our forest',
  goalHeading: 'Our tree goal',
  goalNote: (d) => {
    const target = d.project.target ?? 0
    const left = Math.max(0, target - d.totals.trees)
    return left > 0 ? `${fmtNum(left)} trees to go.` : 'We reached our goal.'
  },
  footerLine: () => 'Recorded with TreeMapper by Plant-for-the-Planet',
}

const BY_TONE: Record<Tone, Copy> = { formal: FORMAL, warm: WARM, simple: SIMPLE }

/**
 * The same shape as `Copy`, with every function already applied to the page
 * data. Blocks take this rather than `Copy`, for two reasons: a block should
 * not have to remember which strings need calling, and a client block (the
 * share row) cannot receive functions across the server boundary at all.
 */
export type ResolvedCopy = {
  [K in keyof Copy]: Copy[K] extends (data: PublicProjectPage) => infer R ? R : Copy[K]
}

export function resolveCopy(tone: Tone, data: PublicProjectPage): ResolvedCopy {
  const copy = BY_TONE[tone] ?? FORMAL
  const resolved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(copy)) {
    resolved[key] = typeof value === 'function'
      ? (value as (data: PublicProjectPage) => unknown)(data)
      : value
  }
  return resolved as ResolvedCopy
}
