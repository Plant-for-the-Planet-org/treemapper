import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'
import { TOUR_STEPS, TOUR_TARGETS } from './interventionTour'

/**
 * Guided walkthrough of the Multiple Trees intervention, launched on demand
 * from the "Show me how" screen. It is the polygon half of the capture flow:
 * the Single Tree tour covers one point, this one covers an area.
 *
 * The flow: "+" -> Multiple Trees -> PolygonMarker (mark the corners,
 * Complete) -> ManageSpecies (species and how many) -> TotalTrees.
 *
 * **It stops at Continue on the species total.** What follows is the sample
 * tree question, a modal, and then either the form or the sample tree flow --
 * three paths the user picks between, and a modal the inline overlay cannot
 * draw over. The last step says what the question will be instead, which is
 * the part a first-timer actually needs.
 *
 * Two things shape the steps:
 *
 * - **The map steps target the whole map, not a button.** `interactive` only
 *   opens a hole where the spotlight is, and marking corners means panning the
 *   map between each one. Every button on this screen is drawn over the map,
 *   so a hole covering the map covers them too.
 * - **"Mark the corners" is released by the third corner**, the same rule the
 *   create-site tour uses: the Complete button the next step points at only
 *   exists once a polygon is possible.
 *
 * The tracked-route path (Track instead of Mark Point) is not taught, but it
 * does not strand the tour either: finishing a track lands on ManageSpecies
 * like the manual path, and the screen sync moves the tour forward there.
 */

export const MULTI_TREE_TOUR_ID = 'multi-tree-intervention'

/**
 * Ids shared by the <TourTarget> wrappers and the steps below. The opening
 * step reuses the intervention tour's "+" target, and the two species steps
 * reuse its species targets: ids live in one registry on the provider and only
 * one tour runs at a time, so a second wrapper around the same control would
 * be two registrations fighting over one id.
 */
export const MULTI_TOUR_TARGETS = {
  ADD_OPTION: 'multi-tour-add-option',
  MAP: 'multi-tour-map',
  FOOTER: 'multi-tour-footer',
} as const

/**
 * Step ids. Screens refer to these through SCREEN_STEPS, never by index.
 *
 * `PROJECT` is deliberately the Single Tree tour's step id, not one of our
 * own. Handlers a screen lends to a tour are keyed by step id
 * (`utils/tour/tourActions.ts`), and `HomeHeader` already registers the
 * project picker under that id -- so reusing it is what lets this tour open
 * the picker without a second registration. Only one tour runs at a time, so
 * the two can never collide.
 */
export const MULTI_TOUR_STEPS = {
  PROJECT: TOUR_STEPS.PROJECT,
  ADD: 'multi-step-add',
  OPTION: 'multi-step-option',
  MARK: 'multi-step-mark',
  COMPLETE: 'multi-step-complete',
  SPECIES: 'multi-step-species',
  TREES: 'multi-step-trees',
} as const

/**
 * Every step a screen teaches, in tour order. See `useTourScreen`.
 *
 * The first two steps have no entry: the tour starts on the home screen the
 * user is already looking at, so there is nothing to re-sync to.
 *
 * Module-level constants on purpose: a fresh array on every render would
 * re-run the focus effect that reads them on every render.
 */
export const SCREEN_STEPS = {
  polygonMarker: [MULTI_TOUR_STEPS.MARK, MULTI_TOUR_STEPS.COMPLETE],
  manageSpecies: [MULTI_TOUR_STEPS.SPECIES],
  totalTrees: [MULTI_TOUR_STEPS.TREES],
} as const

export type MultiTreeTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

/**
 * Matches the other tours' wait for the add menu. `AddOptionModal` is always
 * mounted and shows itself by animating `translateY` from 600 to 0 over 500ms,
 * so measuring the row the moment "+" is pressed reads it 600px off screen.
 *
 * Keep this above the 500ms in `AddOptionModal`'s `heightValue` timing.
 */
const ADD_MENU_ANIMATION_MS = 620

/**
 * Both flags are read once, when the tour starts, which is why they are
 * arguments and not hooks. Same rule as the Single Tree tour:
 *
 * - `hasProject` drops the opening step for someone who already has one
 *   selected, rather than showing a step that teaches nothing.
 * - `canPickProject` drops it for a signed-out user, who has no picker to
 *   point at. The flow still works for them: `checkWhetherProjectIsSelected`
 *   skips its guard when there is no user type.
 *
 * Without the step, a signed-in user with no project chosen would tap
 * Multiple Trees, get the project modal instead of the map, and be left on a
 * gated step whose only way out is Skip.
 */
export const buildMultiTreeTourSteps = (
  hasProject: boolean,
  canPickProject: boolean,
): TourStep[] => [
  {
    id: MULTI_TOUR_STEPS.PROJECT,
    targetId: TOUR_TARGETS.PROJECT_PICKER,
    title: t('multi_tour_project_title'),
    description: t('multi_tour_project_desc'),
    active: canPickProject && !hasProject,
    interactive: true,
    backdropBehavior: () => runTourAction(MULTI_TOUR_STEPS.PROJECT),
    // Not gated: Next opens the picker rather than skipping the step, so the
    // tour cannot reach the add menu without a project. See the same step in
    // `interventionTour.ts`.
    tooltipPosition: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: MULTI_TOUR_STEPS.ADD,
    targetId: TOUR_TARGETS.ADD_BUTTON,
    title: t('multi_tour_add_title'),
    description: t('multi_tour_add_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(MULTI_TOUR_STEPS.ADD),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: MULTI_TOUR_STEPS.OPTION,
    targetId: MULTI_TOUR_TARGETS.ADD_OPTION,
    title: t('multi_tour_option_title'),
    description: t('multi_tour_option_desc'),
    delayBefore: ADD_MENU_ANIMATION_MS,
    // Deliberately NOT interactive -- see `utils/tour/tourActions.ts`. The menu
    // draws itself outside the "+" button it is nested inside, so a tap hit
    // tested down from the overlay never reaches the row.
    onSpotlightPress: () => runTourAction(MULTI_TOUR_STEPS.OPTION),
    backdropBehavior: () => runTourAction(MULTI_TOUR_STEPS.OPTION),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: MULTI_TOUR_STEPS.MARK,
    targetId: MULTI_TOUR_TARGETS.MAP,
    title: t('multi_tour_mark_title'),
    description: t('multi_tour_mark_desc'),
    interactive: true,
    // Released by the third corner, which is when the Complete button the next
    // step points at first exists.
    completed: false,
    hideNextButton: true,
    // No real Back: the step before this one points at a row in the add menu,
    // which closed when the menu did. Leaving the screen would land the user on
    // a spotlight with nothing under it.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
  },
  {
    id: MULTI_TOUR_STEPS.COMPLETE,
    targetId: MULTI_TOUR_TARGETS.FOOTER,
    title: t('multi_tour_complete_title'),
    description: t('multi_tour_complete_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(MULTI_TOUR_STEPS.COMPLETE),
    hidePrevButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: MULTI_TOUR_STEPS.SPECIES,
    targetId: TOUR_TARGETS.SPECIES_LIST,
    title: t('multi_tour_species_title'),
    description: t('multi_tour_species_desc'),
    interactive: true,
    // No real Back: the step before this one points at a control on the capture
    // map, and the flow has left that map behind. Going back would re-enter it
    // in a state the step no longer describes.
    hidePrevButton: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: MULTI_TOUR_STEPS.TREES,
    targetId: TOUR_TARGETS.SPECIES_CONTINUE,
    title: t('multi_tour_trees_title'),
    description: t('multi_tour_trees_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(MULTI_TOUR_STEPS.TREES),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
