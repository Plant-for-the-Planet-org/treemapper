import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'

/**
 * Guided walkthrough of saving a map area for offline use, launched on demand
 * from the "Show me how" screen.
 *
 * The flow: Offline Maps -> Add Area -> pan and zoom to frame the area ->
 * Save Area.
 *
 * It is the shortest tour in the app and the only one with nothing to set up
 * first: no project, no record, no account. That is deliberate. Downloading
 * the area has to happen *before* the signal is gone, so this is the one thing
 * a user needs to be told about in advance rather than when they hit it.
 *
 * **It ends on Save Area rather than on the saved area.** The download runs
 * behind a full-screen loader modal, which draws over the inline overlay, and
 * finishes by going back on its own. A step waiting on the other side of that
 * would be a spotlight nobody sees, so the last step says what will happen
 * instead.
 */

export const OFFLINE_MAP_TOUR_ID = 'offline-maps'

/** Ids shared by the <TourTarget> wrappers and the steps below. */
export const OFFLINE_TOUR_TARGETS = {
  ADD: 'offline-tour-add',
  MAP: 'offline-tour-map',
  SAVE: 'offline-tour-save',
} as const

/** Step ids. Screens refer to these through SCREEN_STEPS, never by index. */
export const OFFLINE_TOUR_STEPS = {
  ADD: 'offline-step-add',
  PAN: 'offline-step-pan',
  SAVE: 'offline-step-save',
} as const

/**
 * Every step a screen teaches, in tour order. See `useTourScreen`.
 *
 * Module-level constants on purpose: a fresh array on every render would
 * re-run the focus effect that reads them on every render.
 */
export const SCREEN_STEPS = {
  offlineMaps: [OFFLINE_TOUR_STEPS.ADD],
  areaSelection: [OFFLINE_TOUR_STEPS.PAN, OFFLINE_TOUR_STEPS.SAVE],
} as const

export type OfflineTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

export const buildOfflineMapTourSteps = (): TourStep[] => [
  {
    id: OFFLINE_TOUR_STEPS.ADD,
    targetId: OFFLINE_TOUR_TARGETS.ADD,
    title: t('offline_tour_add_title'),
    description: t('offline_tour_add_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(OFFLINE_TOUR_STEPS.ADD),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: OFFLINE_TOUR_STEPS.PAN,
    // The whole map, so the user can pan and zoom inside the spotlight. What
    // is saved is what the map is showing, so framing it *is* the step.
    targetId: OFFLINE_TOUR_TARGETS.MAP,
    title: t('offline_tour_pan_title'),
    description: t('offline_tour_pan_desc'),
    interactive: true,
    // Back would point at a button on the screen before this one.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
  },
  {
    id: OFFLINE_TOUR_STEPS.SAVE,
    targetId: OFFLINE_TOUR_TARGETS.SAVE,
    title: t('offline_tour_save_title'),
    description: t('offline_tour_save_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(OFFLINE_TOUR_STEPS.SAVE),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
