import type { PublicProjectPage } from './types'

/**
 * A development fixture for the public page.
 *
 * Used only when `NODE_ENV=development` **and** `PUBLIC_PAGE_SAMPLE=true`, so
 * it can never reach a deployed build. It exists so the four themes can be
 * worked on without running the Nest server, and without switching a public
 * page on for a real project in the shared staging database to look at a
 * layout.
 *
 * Every figure here is invented. Do not copy any of it into a real page, a
 * screenshot for a partner, or a test that asserts on production behaviour.
 */
export const SAMPLE_PUBLIC_PAGE: PublicProjectPage = {
  theme: 'full',
  geoDetail: 'site',
  snapshotAt: new Date().toISOString(),
  project: {
    uid: 'proj_sample',
    slug: 'sample-project',
    name: 'Río Verde Restoration',
    description: null,
    purpose: 'trees',
    ecosystem: 'Tropical dry forest',
    country: 'Mexico',
    website: null,
    image: null,
    target: 8000,
    startedAt: '2023-03-14T00:00:00.000Z',
  },
  organization: {
    name: 'Plant-for-the-Planet',
    image: null,
    primaryColor: null,
    secondaryColor: null,
    website: null,
  },
  totals: {
    trees: 4812,
    hectares: 48.6,
    sites: 7,
    species: 22,
    nativeSpecies: 16,
    threatenedSpecies: 3,
    monitoringPlots: 6,
    contributors: 14,
    interventions: 318,
  },
  verification: {
    total: 4812,
    withLocation: 4812,
    withPhoto: 4476,
    capturedOnSite: 4187,
  },
  monitoring: {
    remeasured: 1204,
    alive: 1076,
    lastCheckedAt: '2026-08-12T00:00:00.000Z',
    perSite: [
      { uid: 's1', name: 'El Cedro', trees: 1204, remeasured: 320, alive: 291, lastCheckedAt: '2026-08-12T00:00:00.000Z' },
      { uid: 's2', name: 'La Ceiba', trees: 962, remeasured: 240, alive: 214, lastCheckedAt: '2026-08-12T00:00:00.000Z' },
      { uid: 's3', name: 'Sabana Norte', trees: 745, remeasured: 180, alive: 155, lastCheckedAt: '2026-08-04T00:00:00.000Z' },
      { uid: 's4', name: 'Arroyo Seco', trees: 612, remeasured: 150, alive: 138, lastCheckedAt: '2026-08-04T00:00:00.000Z' },
      { uid: 's5', name: 'Milpa Vieja', trees: 498, remeasured: 120, alive: 103, lastCheckedAt: '2026-07-21T00:00:00.000Z' },
      { uid: 's6', name: 'Tres Pozos', trees: 441, remeasured: 110, alive: 99, lastCheckedAt: '2026-07-21T00:00:00.000Z' },
      { uid: 's7', name: 'Cañada Sur', trees: 350, remeasured: 84, alive: 76, lastCheckedAt: '2026-07-18T00:00:00.000Z' },
    ],
  },
  species: [
    { uid: 'sp1', scientificName: 'Swietenia macrophylla', commonName: 'Big-leaf mahogany', trees: 820, isNative: true, isEndangered: false, pollinatorFriendly: false, conservationStatus: 'vulnerable', image: null },
    { uid: 'sp2', scientificName: 'Cedrela odorata', commonName: 'Spanish cedar', trees: 713, isNative: true, isEndangered: false, pollinatorFriendly: false, conservationStatus: 'vulnerable', image: null },
    { uid: 'sp3', scientificName: 'Brosimum alicastrum', commonName: 'Ramón', trees: 684, isNative: true, isEndangered: false, pollinatorFriendly: true, conservationStatus: 'least_concern', image: null },
    { uid: 'sp4', scientificName: 'Manilkara zapota', commonName: 'Sapodilla', trees: 512, isNative: true, isEndangered: false, pollinatorFriendly: false, conservationStatus: 'least_concern', image: null },
    { uid: 'sp5', scientificName: 'Enterolobium cyclocarpum', commonName: 'Guanacaste', trees: 398, isNative: true, isEndangered: false, pollinatorFriendly: true, conservationStatus: 'least_concern', image: null },
    { uid: 'sp6', scientificName: 'Ceiba pentandra', commonName: 'Kapok', trees: 341, isNative: true, isEndangered: false, pollinatorFriendly: false, conservationStatus: 'least_concern', image: null },
    { uid: 'sp7', scientificName: 'Bursera simaruba', commonName: 'Gumbo-limbo', trees: 295, isNative: true, isEndangered: false, pollinatorFriendly: true, conservationStatus: 'least_concern', image: null },
    { uid: 'sp8', scientificName: 'Tabebuia rosea', commonName: 'Pink trumpet tree', trees: 248, isNative: true, isEndangered: false, pollinatorFriendly: true, conservationStatus: 'least_concern', image: null },
    { uid: 'sp9', scientificName: 'Guaiacum sanctum', commonName: 'Holywood', trees: 190, isNative: true, isEndangered: true, pollinatorFriendly: false, conservationStatus: 'endangered', image: null },
    { uid: 'sp10', scientificName: 'Piscidia piscipula', commonName: 'Jamaica dogwood', trees: 160, isNative: true, isEndangered: false, pollinatorFriendly: true, conservationStatus: 'least_concern', image: null },
  ],
  work: {
    planting: [
      { type: 'multi-tree-registration', trees: 3980, records: 212 },
      { type: 'assisted-natural-regeneration', trees: 540, records: 41 },
      { type: 'enrichment-planting', trees: 292, records: 24 },
    ],
    other: [
      { type: 'fire-patrol', trees: 0, records: 28 },
      { type: 'removal-invasive-species', trees: 0, records: 19 },
      { type: 'fencing', trees: 0, records: 11 },
      { type: 'soil-improvement', trees: 0, records: 7 },
    ],
  },
  timeline: [
    { period: '2023-Q2', year: 2023, quarter: 2, trees: 180 },
    { period: '2023-Q3', year: 2023, quarter: 3, trees: 340 },
    { period: '2023-Q4', year: 2023, quarter: 4, trees: 410 },
    { period: '2024-Q1', year: 2024, quarter: 1, trees: 520 },
    { period: '2024-Q2', year: 2024, quarter: 2, trees: 290 },
    { period: '2024-Q3', year: 2024, quarter: 3, trees: 380 },
    { period: '2024-Q4', year: 2024, quarter: 4, trees: 445 },
    { period: '2025-Q1', year: 2025, quarter: 1, trees: 610 },
    { period: '2025-Q2', year: 2025, quarter: 2, trees: 330 },
    { period: '2025-Q3', year: 2025, quarter: 3, trees: 275 },
    { period: '2025-Q4', year: 2025, quarter: 4, trees: 190 },
    { period: '2026-Q1', year: 2026, quarter: 1, trees: 420 },
    { period: '2026-Q2', year: 2026, quarter: 2, trees: 310 },
    { period: '2026-Q3', year: 2026, quarter: 3, trees: 112 },
  ],
  sites: {
    type: 'FeatureCollection',
    features: [
      box('s1', 'El Cedro', -88.05, 19.62, 0.045, 12.4),
      box('s2', 'La Ceiba', -87.97, 19.6, 0.034, 9.1),
      box('s3', 'Sabana Norte', -88.02, 19.68, 0.028, 7.8),
      box('s4', 'Arroyo Seco', -87.92, 19.66, 0.024, 6.2),
      box('s5', 'Milpa Vieja', -88.08, 19.56, 0.02, 5.1),
      box('s6', 'Tres Pozos', -87.89, 19.57, 0.018, 4.4),
      box('s7', 'Cañada Sur', -88.0, 19.52, 0.016, 3.6),
    ],
  },
  photos: [],
  people: {
    count: 14,
    members: [
      { initials: 'AM', name: null, image: null },
      { initials: 'JR', name: null, image: null },
      { initials: 'LC', name: null, image: null },
      { initials: 'SP', name: null, image: null },
      { initials: 'MT', name: null, image: null },
      { initials: 'BN', name: null, image: null },
    ],
  },
}

function box(uid: string, name: string, lng: number, lat: number, size: number, hectares: number) {
  return {
    type: 'Feature' as const,
    properties: { uid, name, hectares },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng, lat],
          [lng + size, lat],
          [lng + size, lat + size * 0.7],
          [lng, lat + size * 0.7],
          [lng, lat],
        ],
      ],
    },
  }
}
