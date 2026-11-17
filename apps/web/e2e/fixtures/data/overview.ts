import { ok } from '../../helpers/envelope';
import type { ApiMock } from '../api-mock';

// Made up on purpose. Never paste real API responses here: the repo is public.

// What `StatCardsContainer` reads from `data.kpis`. Distinct numbers, so a
// test can tell a loaded card from the 0 it shows when the call fails.
export const KPIS = {
  totalTreesPlanted: 1234,
  totalSpeciesPlanted: 12,
  totalAreaCovered: 5,
  totalContributors: 3,
  totalTreesPlantedChange: 0,
  totalSpeciesPlantedChange: 0,
  totalAreaCoveredChange: 0,
  totalContributorsChange: 0,
  monthlyHistory: [],
};

// The calls the overview page makes for any project: the stat cards, the
// owner and admin activity panel, and the map. The map responses are empty,
// because tests never read the map canvas.
export function mockOverview(api: ApiMock) {
  api
    .get(/^analytics\/project-kpis\/[^/]+$/, ok({ kpis: KPIS }))
    .get(
      /^analytics\/recent-additions\/[^/]+$/,
      ok({
        activities: [],
        pagination: { page: '1', limit: '10', total: 0, hasMore: false },
      })
    )
    .get(/^interventions\/[^/]+\/map\/all$/, ok({ interventions: [] }))
    .get(
      /^projects\/[^/]+\/sites\/map$/,
      ok({ type: 'FeatureCollection', features: [], totalSites: 0 })
    );
}
