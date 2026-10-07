import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'

/**
 * Guided walkthrough of the Single Tree intervention, launched on demand from
 * the side drawer ("Show me how"). It is NOT a first-run tour: the user asks
 * for it, and it runs over the real screens while they tap through.
 *
 * Two things shape the design:
 *
 * - The user drives, not the tour. Every step is `interactive`, so the
 *   spotlight is a hole the real control shows through and the tap lands on the
 *   app, not on an overlay. That means the tour cannot get ahead of the app:
 *   nothing is navigated on the user's behalf and abandoning halfway leaves
 *   exactly what abandoning the flow normally leaves.
 * - Screens own their position in the tour, steps do not own the screens.
 *   `STAGE_ENTRY` maps a screen to the step it opens on, and `useTourStage`
 *   re-syncs on mount. A tour spanning six screens cannot rely on counting
 *   `nextStep()` calls: the user can always press back, and the species screens
 *   push and pop between themselves.
 *
 * The flow itself: "+" -> Single Tree -> PointMarker (tap the map, confirm) ->
 * ManageSpecies -> TotalTrees -> DynamicForm (empty for this type, so it resets
 * straight through) -> InterventionPreview.
 */

export const SINGLE_TREE_TOUR_ID = 'single-tree-intervention'

/**
 * Ids shared by the <TourTarget> wrappers and the steps below. Kept in one
 * place because a typo on either side is silent: the step just never finds its
 * target and falls back to a centred tooltip.
 */
export const TOUR_TARGETS = {
  PROJECT_PICKER: 'tour-project-picker',
  ADD_BUTTON: 'tour-add-button',
  ADD_SINGLE_TREE: 'tour-add-single-tree',
  POINT_MAP: 'tour-point-map',
  POINT_CONFIRM: 'tour-point-confirm',
  SPECIES_LIST: 'tour-species-list',
  SPECIES_CONTINUE: 'tour-species-continue',
  PREVIEW_SAVE: 'tour-preview-save',
} as const

/** Step ids. Screens refer to these through STAGE_ENTRY, never by index. */
export const TOUR_STEPS = {
  PROJECT: 'tour-step-project',
  ADD: 'tour-step-add',
  SINGLE_TREE: 'tour-step-single-tree',
  MAP_TAP: 'tour-step-map-tap',
  CONFIRM_LOCATION: 'tour-step-confirm-location',
  SPECIES: 'tour-step-species',
  REVIEW_SPECIES: 'tour-step-review-species',
  SAVE: 'tour-step-save',
} as const

/**
 * Which step a screen resumes the tour at. The value is the *first* step that
 * screen teaches; later steps on the same screen advance normally.
 */
export const STAGE_ENTRY = {
  home: TOUR_STEPS.ADD,
  pointMarker: TOUR_STEPS.MAP_TAP,
  manageSpecies: TOUR_STEPS.SPECIES,
  totalTrees: TOUR_STEPS.REVIEW_SPECIES,
  interventionPreview: TOUR_STEPS.SAVE,
} as const

export type TourStage = keyof typeof STAGE_ENTRY

const t = (key: string) => i18next.t(`label.${key}`)


/**
 * How long to wait before measuring a row in the add menu.
 *
 * `AddOptionModal` is always mounted and shows itself by animating
 * `translateY` from 600 to 0 over 500ms (opacity runs 700ms, but only position
 * affects measurement). Its <TourTarget> is therefore registered the whole
 * time, and measuring it the moment "+" is pressed reads the row 600px below
 * the screen: no spotlight is visible, and -- because an interactive step
 * blocks every pixel outside the spotlight -- the row itself becomes
 * unclickable. Wait the animation out instead.
 *
 * Keep this above the 500ms in `AddOptionModal`'s `heightValue` timing.
 */
const ADD_MENU_ANIMATION_MS = 620

/**
 * Both flags are read once, when the tour starts, which is why they are
 * arguments and not hooks.
 *
 * - `hasProject` drops the opening step for someone who already has one
 *   selected, rather than showing a step that teaches nothing.
 * - `canPickProject` drops it for a signed-out user. HomeHeader only renders
 *   the project picker when there is a user type, so without this the step
 *   would point at a target that does not exist -- and because it is gated
 *   with no Next button, the only way out would be Skip. Signed out, the tour
 *   opens on the "+" button instead; the flow itself still works, because
 *   `checkWhetherProjectIsSelected` also skips its guard when there is no user
 *   type, and the intervention is written to Realm either way.
 */
export const buildSingleTreeTourSteps = (
  hasProject: boolean,
  canPickProject: boolean,
): TourStep[] => [
  {
    id: TOUR_STEPS.PROJECT,
    targetId: TOUR_TARGETS.PROJECT_PICKER,
    title: t('tour_project_title'),
    description: t('tour_project_desc'),
    active: canPickProject && !hasProject,
    interactive: true,
    backdropBehavior: () => runTourAction(TOUR_STEPS.PROJECT),
    // The step used to be gated (`completed: false`, no Next) because letting
    // Next skip it would strand the user at the "+" menu, which silently
    // refuses to open the flow without a project. Next now opens the picker
    // instead of skipping, and the tour moves on when a project is chosen, so
    // the gate has nothing left to protect.
    tooltipPosition: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: TOUR_STEPS.ADD,
    targetId: TOUR_TARGETS.ADD_BUTTON,
    title: t('tour_add_title'),
    description: t('tour_add_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(TOUR_STEPS.ADD),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: TOUR_STEPS.SINGLE_TREE,
    targetId: TOUR_TARGETS.ADD_SINGLE_TREE,
    title: t('tour_single_tree_title'),
    description: t('tour_single_tree_desc'),
    delayBefore: ADD_MENU_ANIMATION_MS,
    // Deliberately NOT interactive -- see `utils/tour/tourActions.ts`. A press area is
    // laid over the cutout instead, and it calls the row's own handler.
    onSpotlightPress: () => runTourAction(TOUR_STEPS.SINGLE_TREE),
    // Anywhere on this step counts, not just the highlighted row. The menu is
    // the only thing on screen and the step asks for exactly one decision, so
    // a near-miss should carry on rather than feel broken -- which is what a
    // dead tap looks like here, since the row cannot be pressed directly.
    backdropBehavior: () => runTourAction(TOUR_STEPS.SINGLE_TREE),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: TOUR_STEPS.MAP_TAP,
    // The whole map is the target. Not decoration: `interactive` only opens a
    // hole where the spotlight is, and everything outside it is covered by
    // press-blocking bands, so a smaller target here would leave the user
    // unable to tap the map this step is asking them to tap.
    targetId: TOUR_TARGETS.POINT_MAP,
    title: t('tour_map_tap_title'),
    description: t('tour_map_tap_desc'),
    interactive: true,
    completed: false,
    hideNextButton: true,
    // No real Back: the step before this one points at a row in the add menu,
    // which closed when the menu did. Leaving the screen would land the user on
    // a spotlight with nothing under it.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
  },
  {
    id: TOUR_STEPS.CONFIRM_LOCATION,
    targetId: TOUR_TARGETS.POINT_CONFIRM,
    title: t('tour_confirm_location_title'),
    description: t('tour_confirm_location_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(TOUR_STEPS.CONFIRM_LOCATION),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: TOUR_STEPS.SPECIES,
    targetId: TOUR_TARGETS.SPECIES_LIST,
    title: t('tour_species_title'),
    description: t('tour_species_desc'),
    interactive: true,
    // No real Back: the step before this one points at a control on the capture
    // map, and the flow has left that map behind. Going back would re-enter it
    // in a state the step no longer describes.
    hidePrevButton: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: TOUR_STEPS.REVIEW_SPECIES,
    targetId: TOUR_TARGETS.SPECIES_CONTINUE,
    title: t('tour_review_species_title'),
    description: t('tour_review_species_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(TOUR_STEPS.REVIEW_SPECIES),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: TOUR_STEPS.SAVE,
    targetId: TOUR_TARGETS.PREVIEW_SAVE,
    title: t('tour_save_title'),
    description: t('tour_save_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(TOUR_STEPS.SAVE),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
