import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'
import { TOUR_TARGETS } from './interventionTour'

/**
 * Guided walkthrough of creating a project site, launched on demand from the
 * "Show me how" screen.
 *
 * The flow: "+" -> Project Sites -> name it and pick the project -> open the
 * map -> walk the boundary, marking a corner at a time -> Complete -> Create
 * Site.
 *
 * **This tour is shaped differently from the other three.** Everything after
 * the add menu happens on one screen, `ProjectSitesView`, which swaps between
 * a form and a full-screen map overlay on a `showMap` flag. So the usual
 * screen-focus sync does almost nothing here: it only catches the entry, and
 * every step after it is advanced by the act it teaches. Three consequences:
 *
 * - **No step may rely on `useTourScreen` to move it.** Each transition is an
 *   explicit `advanceIfOn` in the handler that flips the mode.
 * - **Back is hidden wherever a step would jump across modes.** Going back
 *   from the map steps to a form step would point the spotlight at a control
 *   the map overlay is covering, and nothing would switch the mode back.
 * - **The "mark a corner" step advances on the third point, not the first.**
 *   The Complete/Continue footer only exists once a polygon is possible, so
 *   advancing sooner would leave the next step with no target.
 */

export const CREATE_SITE_TOUR_ID = 'create-site'

/**
 * Ids shared by the <TourTarget> wrappers and the steps below. The opening
 * step reuses the intervention tour's "+" target -- ids live in one registry
 * on the provider and only one tour runs at a time.
 */
export const SITE_TOUR_TARGETS = {
  ADD_OPTION: 'site-tour-add-option',
  DETAILS: 'site-tour-details',
  STATUS: 'site-tour-status',
  DRAW: 'site-tour-draw',
  MAP: 'site-tour-map',
  FOOTER: 'site-tour-footer',
  SAVE: 'site-tour-save',
} as const

/** Step ids. The screen refers to these through SCREEN_STEPS, never by index. */
export const SITE_TOUR_STEPS = {
  ADD: 'site-step-add',
  OPTION: 'site-step-option',
  DETAILS: 'site-step-details',
  STATUS: 'site-step-status',
  DRAW: 'site-step-draw',
  MARK: 'site-step-mark',
  COMPLETE: 'site-step-complete',
  SAVE: 'site-step-save',
} as const

/**
 * One screen owns everything past the add menu. The sync still earns its keep
 * for the entry: it lands the tour on the form step when the screen mounts,
 * whichever way the user got there.
 *
 * A module-level constant on purpose: a fresh array on every render would
 * re-run the focus effect that reads it on every render.
 */
export const SCREEN_STEPS = {
  createSite: [
    SITE_TOUR_STEPS.DETAILS,
    SITE_TOUR_STEPS.STATUS,
    SITE_TOUR_STEPS.DRAW,
    SITE_TOUR_STEPS.MARK,
    SITE_TOUR_STEPS.COMPLETE,
    SITE_TOUR_STEPS.SAVE,
  ],
} as const

export type SiteTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

/**
 * Matches the other tours' wait for the add menu. `AddOptionModal` is always
 * mounted and shows itself by animating `translateY` from 600 to 0 over 500ms,
 * so measuring the row the moment "+" is pressed reads it 600px off screen.
 *
 * Keep this above the 500ms in `AddOptionModal`'s `heightValue` timing.
 */
const ADD_MENU_ANIMATION_MS = 620

export const buildCreateSiteTourSteps = (): TourStep[] => [
  {
    id: SITE_TOUR_STEPS.ADD,
    targetId: TOUR_TARGETS.ADD_BUTTON,
    title: t('site_tour_add_title'),
    description: t('site_tour_add_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(SITE_TOUR_STEPS.ADD),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: SITE_TOUR_STEPS.OPTION,
    targetId: SITE_TOUR_TARGETS.ADD_OPTION,
    title: t('site_tour_option_title'),
    description: t('site_tour_option_desc'),
    delayBefore: ADD_MENU_ANIMATION_MS,
    // Deliberately NOT interactive -- see `utils/tour/tourActions.ts`. The menu
    // draws itself outside the "+" button it is nested inside, so a tap hit
    // tested down from the overlay never reaches the row.
    onSpotlightPress: () => runTourAction(SITE_TOUR_STEPS.OPTION),
    backdropBehavior: () => runTourAction(SITE_TOUR_STEPS.OPTION),
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: SITE_TOUR_STEPS.DETAILS,
    targetId: SITE_TOUR_TARGETS.DETAILS,
    title: t('site_tour_details_title'),
    description: t('site_tour_details_desc'),
    interactive: true,
    // No real Back: the step before this one points at a row in the add menu,
    // which closed when the menu did. Leaving the screen would land the user on
    // a spotlight with nothing under it.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: SITE_TOUR_STEPS.STATUS,
    targetId: SITE_TOUR_TARGETS.STATUS,
    title: t('site_tour_status_title'),
    description: t('site_tour_status_desc'),
    interactive: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: SITE_TOUR_STEPS.DRAW,
    targetId: SITE_TOUR_TARGETS.DRAW,
    title: t('site_tour_draw_title'),
    description: t('site_tour_draw_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(SITE_TOUR_STEPS.DRAW),
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SITE_TOUR_STEPS.MARK,
    // The whole map, so the user can still pan. The mark button is drawn over
    // the map, so this hole covers it too; a narrower target would leave them
    // unable to move to the next corner.
    targetId: SITE_TOUR_TARGETS.MAP,
    title: t('site_tour_mark_title'),
    description: t('site_tour_mark_desc'),
    interactive: true,
    // Released by the third corner, which is when the Complete button the next
    // step points at first exists.
    completed: false,
    hideNextButton: true,
    // Back would land on a form step the map overlay is covering.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
  },
  {
    id: SITE_TOUR_STEPS.COMPLETE,
    targetId: SITE_TOUR_TARGETS.FOOTER,
    title: t('site_tour_complete_title'),
    description: t('site_tour_complete_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(SITE_TOUR_STEPS.COMPLETE),
    hidePrevButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: SITE_TOUR_STEPS.SAVE,
    targetId: SITE_TOUR_TARGETS.SAVE,
    title: t('site_tour_save_title'),
    description: t('site_tour_save_desc'),
    interactive: true,
    // Back would point at the map footer, which closed with the overlay.
    hidePrevButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
