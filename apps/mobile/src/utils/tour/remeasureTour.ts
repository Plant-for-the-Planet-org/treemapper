import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'

/**
 * Guided walkthrough of measuring a tree again, launched on demand from the
 * "Show me how" screen.
 *
 * Every other tour records something new. This one is the other half of the
 * product: a tree is worth recording because it is measured again later, and
 * nothing in the app says so until a user happens to find the icon.
 *
 * The flow: a tree on the review screen -> the measure icon -> alive or not ->
 * the new height and width -> save.
 *
 * **The tour is opened on a tree the catalogue has already chosen.** Unlike
 * the capture tours, this one cannot start from the home screen and let the
 * user pick: only a tree that is alive *and* already uploaded can be measured
 * again, so `useTourCatalog` finds one, opens its intervention with that tree
 * highlighted, and blocks the entry when the device has none. Letting the user
 * choose would mean watching them open records that have no measure icon.
 *
 * The step that fills in the measurements is free-running. Height and width
 * are validated, there is a ratio warning, and a tree more than 20 m away
 * raises its own alert -- none of which the tour should pretend to drive.
 */

export const REMEASURE_TOUR_ID = 'remeasure-tree'

/** Ids shared by the <TourTarget> wrappers and the steps below. */
export const REMEASURE_TOUR_TARGETS = {
  TREE: 'remeasure-tour-tree',
  ALIVE: 'remeasure-tour-alive',
  MEASURE: 'remeasure-tour-measure',
  SAVE: 'remeasure-tour-save',
} as const

/** Step ids. Screens refer to these through SCREEN_STEPS, never by index. */
export const REMEASURE_TOUR_STEPS = {
  TREE: 'remeasure-step-tree',
  ALIVE: 'remeasure-step-alive',
  MEASURE: 'remeasure-step-measure',
  SAVE: 'remeasure-step-save',
} as const

/**
 * Every step a screen teaches, in tour order. See `useTourScreen`.
 *
 * Module-level constants on purpose: a fresh array on every render would
 * re-run the focus effect that reads them on every render.
 */
export const SCREEN_STEPS = {
  interventionPreview: [REMEASURE_TOUR_STEPS.TREE],
  remeasure: [
    REMEASURE_TOUR_STEPS.ALIVE,
    REMEASURE_TOUR_STEPS.MEASURE,
    REMEASURE_TOUR_STEPS.SAVE,
  ],
} as const

export type RemeasureTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

export const buildRemeasureTourSteps = (): TourStep[] => [
  {
    id: REMEASURE_TOUR_STEPS.TREE,
    targetId: REMEASURE_TOUR_TARGETS.TREE,
    title: t('remeasure_tour_tree_title'),
    description: t('remeasure_tour_tree_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(REMEASURE_TOUR_STEPS.TREE),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'auto',
    spotlightPadding: 6,
  },
  {
    id: REMEASURE_TOUR_STEPS.ALIVE,
    targetId: REMEASURE_TOUR_TARGETS.ALIVE,
    title: t('remeasure_tour_alive_title'),
    description: t('remeasure_tour_alive_desc'),
    interactive: true,
    // Back would point at a card on the screen before this one.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: REMEASURE_TOUR_STEPS.MEASURE,
    targetId: REMEASURE_TOUR_TARGETS.MEASURE,
    title: t('remeasure_tour_measure_title'),
    description: t('remeasure_tour_measure_desc'),
    interactive: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: REMEASURE_TOUR_STEPS.SAVE,
    targetId: REMEASURE_TOUR_TARGETS.SAVE,
    title: t('remeasure_tour_save_title'),
    description: t('remeasure_tour_save_desc'),
    interactive: true,
    // No backdrop shortcut here, unlike the other tours' last steps. The
    // backdrop on this one is a form the user may still be typing into, and a
    // stray tap outside the spotlight must not submit a measurement.
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
