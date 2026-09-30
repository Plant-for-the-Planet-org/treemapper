import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'
import { TOUR_TARGETS } from './interventionTour'

/**
 * Guided walkthrough of creating a monitoring plot, launched on demand from
 * the "Show me how" screen. Like the other tours it runs over the real screens
 * and nothing is navigated on the user's behalf.
 *
 * The flow: "+" -> Monitoring Plot -> Create Plot (project, shape, type) ->
 * plot form (name, size) -> map (place the centre, confirm the shape) -> the
 * finished plot.
 *
 * **It stops at the Add Plants button rather than walking through the plant
 * form.** Recording a plant is its own flow -- species, measurements, then
 * back to the map in a second mode to mark where it stands -- and bolting it
 * on would make one walkthrough of fourteen steps. It belongs in its own
 * catalogue entry, which is what the catalogue is for.
 *
 * Two things worth knowing before changing the steps:
 *
 * - **A plot must belong to a project.** `CreatePlotView` refuses to continue
 *   without one, so the tour would dead-end at step 4 for someone with no
 *   projects. `useTourCatalog` disables the entry in that case rather than
 *   letting the tour start and stall.
 * - **The map steps target the whole map, not the buttons.** `interactive`
 *   only opens a hole where the spotlight is, and the user has to pan the map
 *   to place the plot centre. The Select Center button is drawn over the map,
 *   so a hole covering the map covers the button too. Narrowing this target
 *   would leave the user unable to pan.
 */

export const MONITORING_PLOT_TOUR_ID = 'monitoring-plot'

/**
 * Ids shared by the <TourTarget> wrappers and the steps below. The opening
 * step reuses the intervention tour's "+" target: ids live in one registry on
 * the provider, only one tour runs at a time, and a second wrapper around the
 * same button would be two registrations fighting over one id.
 */
export const PLOT_TOUR_TARGETS = {
  ADD_OPTION: 'plot-tour-add-option',
  SETTINGS: 'plot-tour-settings',
  SETTINGS_CONTINUE: 'plot-tour-settings-continue',
  FORM: 'plot-tour-form',
  FORM_CREATE: 'plot-tour-form-create',
  MAP: 'plot-tour-map',
  MAP_CONFIRM: 'plot-tour-map-confirm',
  TABS: 'plot-tour-tabs',
  ADD_PLANTS: 'plot-tour-add-plants',
} as const

/** Step ids. Screens refer to these through SCREEN_STEPS, never by index. */
export const PLOT_TOUR_STEPS = {
  ADD: 'plot-step-add',
  OPTION: 'plot-step-option',
  SETTINGS: 'plot-step-settings',
  SETTINGS_CONTINUE: 'plot-step-settings-continue',
  FORM: 'plot-step-form',
  CREATE: 'plot-step-create',
  CENTER: 'plot-step-center',
  CONFIRM: 'plot-step-confirm',
  TABS: 'plot-step-tabs',
  ADD_PLANTS: 'plot-step-add-plants',
} as const

/**
 * Every step a screen teaches, in tour order. See `useTourScreen`.
 *
 * The first two steps have no entry here: the tour starts on the home screen
 * the user is already looking at, so there is nothing to re-sync to.
 *
 * Module-level constants on purpose: a fresh array on every render would
 * re-run the focus effect that reads them on every render.
 */
export const SCREEN_STEPS = {
  createPlot: [PLOT_TOUR_STEPS.SETTINGS, PLOT_TOUR_STEPS.SETTINGS_CONTINUE],
  plotForm: [PLOT_TOUR_STEPS.FORM, PLOT_TOUR_STEPS.CREATE],
  plotMap: [PLOT_TOUR_STEPS.CENTER, PLOT_TOUR_STEPS.CONFIRM],
  plotOverview: [PLOT_TOUR_STEPS.TABS, PLOT_TOUR_STEPS.ADD_PLANTS],
} as const

export type PlotTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

/**
 * Matches the intervention tour's wait for the add menu. `AddOptionModal` is
 * always mounted and shows itself by animating `translateY` from 600 to 0 over
 * 500ms, so its <TourTarget> is registered the whole time and measuring it the
 * moment "+" is pressed reads the row 600px below the screen.
 *
 * Keep this above the 500ms in `AddOptionModal`'s `heightValue` timing.
 */
const ADD_MENU_ANIMATION_MS = 620

export const buildMonitoringPlotTourSteps = (): TourStep[] => [
  {
    id: PLOT_TOUR_STEPS.ADD,
    targetId: TOUR_TARGETS.ADD_BUTTON,
    title: t('plot_tour_add_title'),
    description: t('plot_tour_add_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(PLOT_TOUR_STEPS.ADD),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.OPTION,
    targetId: PLOT_TOUR_TARGETS.ADD_OPTION,
    title: t('plot_tour_option_title'),
    description: t('plot_tour_option_desc'),
    delayBefore: ADD_MENU_ANIMATION_MS,
    // Deliberately NOT interactive -- see `utils/tour/tourActions.ts`. The menu
    // draws itself far outside the "+" button it is nested inside, so a tap
    // hit-tested down from the overlay lands on the map behind it. A press
    // area over the cutout calls the row's own handler instead.
    onSpotlightPress: () => runTourAction(PLOT_TOUR_STEPS.OPTION),
    // Anywhere on this step counts, not just the highlighted row: the menu is
    // the only thing on screen, the step asks for exactly one decision, and a
    // dead tap is what a near-miss would otherwise feel like.
    backdropBehavior: () => runTourAction(PLOT_TOUR_STEPS.OPTION),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.SETTINGS,
    // The whole settings block, not one card: the step asks for three choices
    // and an interactive spotlight is the only part of the screen that takes a
    // tap, so a narrower target would lock the other two.
    targetId: PLOT_TOUR_TARGETS.SETTINGS,
    title: t('plot_tour_settings_title'),
    description: t('plot_tour_settings_desc'),
    interactive: true,
    hidePrevButton: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: PLOT_TOUR_STEPS.SETTINGS_CONTINUE,
    targetId: PLOT_TOUR_TARGETS.SETTINGS_CONTINUE,
    title: t('plot_tour_continue_title'),
    description: t('plot_tour_continue_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(PLOT_TOUR_STEPS.SETTINGS_CONTINUE),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.FORM,
    targetId: PLOT_TOUR_TARGETS.FORM,
    title: t('plot_tour_form_title'),
    description: t('plot_tour_form_desc'),
    interactive: true,
    hidePrevButton: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: PLOT_TOUR_STEPS.CREATE,
    targetId: PLOT_TOUR_TARGETS.FORM_CREATE,
    title: t('plot_tour_create_title'),
    description: t('plot_tour_create_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(PLOT_TOUR_STEPS.CREATE),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.CENTER,
    targetId: PLOT_TOUR_TARGETS.MAP,
    title: t('plot_tour_center_title'),
    description: t('plot_tour_center_desc'),
    interactive: true,
    // Released by pressing Select Center, which is inside this spotlight.
    completed: false,
    hideNextButton: true,
    hidePrevButton: true,
    tooltipPosition: 'bottom',
  },
  {
    id: PLOT_TOUR_STEPS.CONFIRM,
    targetId: PLOT_TOUR_TARGETS.MAP_CONFIRM,
    title: t('plot_tour_confirm_title'),
    description: t('plot_tour_confirm_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(PLOT_TOUR_STEPS.CONFIRM),
    completed: false,
    hideNextButton: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.TABS,
    targetId: PLOT_TOUR_TARGETS.TABS,
    title: t('plot_tour_tabs_title'),
    description: t('plot_tour_tabs_desc'),
    // Not interactive: the last step's button lives on the Plants tab, and
    // letting the user wander onto Ecosystem here would leave it pointing at
    // something that is no longer drawn.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: PLOT_TOUR_STEPS.ADD_PLANTS,
    targetId: PLOT_TOUR_TARGETS.ADD_PLANTS,
    title: t('plot_tour_plants_title'),
    description: t('plot_tour_plants_desc'),
    interactive: true,
    tooltipPosition: 'top',
    spotlightPadding: 6,
  },
]
