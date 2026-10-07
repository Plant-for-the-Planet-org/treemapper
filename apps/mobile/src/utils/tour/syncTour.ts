import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

/**
 * Guided walkthrough of uploading what the phone has recorded, and of what
 * "Fix Required" means when an upload is refused.
 *
 * It is the one tour that teaches a *concept* rather than a flow. Everything
 * recorded in the field is written to Realm first and uploaded later, which is
 * what makes the app work with no signal -- and it is also why a user who has
 * never been told can believe their data is lost. The sync tile, the Unsynced
 * filter and the badge on a card are the three places the app says otherwise.
 *
 * The flow: the sync tile on the map screen -> the Interventions tab -> the
 * filters -> a record in the list.
 *
 * **Nothing here writes anything.** No step uploads, and the step on the tile
 * does not start a sync: a tour is not the place to push someone's data to the
 * server. Every step is free-running (Next is available) for the same reason,
 * except the one that asks the user to change tab, which has to happen for the
 * rest of the tour to have a screen to sit on.
 *
 * **The tile only exists when there is something to say.** `SyncIntervention`
 * renders nothing when the queue is empty and no record is quarantined, so
 * `useTourCatalog` blocks the entry in that case rather than opening a tour
 * whose first spotlight has no target.
 */

export const SYNC_TOUR_ID = 'sync-and-fix'

/** Ids shared by the <TourTarget> wrappers and the steps below. */
export const SYNC_TOUR_TARGETS = {
  TILE: 'sync-tour-tile',
  INFO: 'sync-tour-info',
  TAB: 'sync-tour-tab',
  FILTER: 'sync-tour-filter',
  CARD: 'sync-tour-card',
} as const

/** Step ids. The list screen refers to these through SCREEN_STEPS. */
export const SYNC_TOUR_STEPS = {
  TILE: 'sync-step-tile',
  INFO: 'sync-step-info',
  TAB: 'sync-step-tab',
  FILTER: 'sync-step-filter',
  CARD: 'sync-step-card',
} as const

/**
 * Every step the intervention list teaches, in tour order. The first three sit
 * on the map screen the tour opens on, so they need no entry.
 *
 * A module-level constant on purpose: a fresh array on every render would
 * re-run the focus effect that reads it on every render.
 */
export const SCREEN_STEPS = {
  interventionList: [SYNC_TOUR_STEPS.FILTER, SYNC_TOUR_STEPS.CARD],
} as const

export type SyncTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

export const buildSyncTourSteps = (): TourStep[] => [
  {
    id: SYNC_TOUR_STEPS.TILE,
    targetId: SYNC_TOUR_TARGETS.TILE,
    title: t('sync_tour_tile_title'),
    description: t('sync_tour_tile_desc'),
    // Interactive so a tap still reaches the tile, but free-running: the step
    // is not asking for the sync to be started.
    interactive: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SYNC_TOUR_STEPS.INFO,
    targetId: SYNC_TOUR_TARGETS.INFO,
    title: t('sync_tour_info_title'),
    description: t('sync_tour_info_desc'),
    // Tapping this opens a plain React Native Modal, which draws over the
    // inline overlay and hides the tour until it is closed. That is why the
    // step explains the list rather than waiting for it: the user can look if
    // they want to, and the tour is still here when they come back.
    interactive: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SYNC_TOUR_STEPS.TAB,
    targetId: SYNC_TOUR_TARGETS.TAB,
    title: t('sync_tour_tab_title'),
    description: t('sync_tour_tab_desc'),
    interactive: true,
    // Gated: the two steps after this one live on the list screen, so the tour
    // cannot go on until the user is there. The list screen's focus sync
    // releases it.
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 4,
  },
  {
    id: SYNC_TOUR_STEPS.FILTER,
    targetId: SYNC_TOUR_TARGETS.FILTER,
    title: t('sync_tour_filter_title'),
    description: t('sync_tour_filter_desc'),
    interactive: true,
    // Back would re-gate the tab step on a screen where it is already done.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: SYNC_TOUR_STEPS.CARD,
    targetId: SYNC_TOUR_TARGETS.CARD,
    title: t('sync_tour_card_title'),
    description: t('sync_tour_card_desc'),
    interactive: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
]
