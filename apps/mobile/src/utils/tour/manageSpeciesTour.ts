import i18next from 'i18next'
import type { TourStep } from '@wrack/react-native-tour-guide'

import { runTourAction } from './tourActions'

/**
 * Guided walkthrough of Manage Species, launched on demand from the side
 * drawer ("Show me how: Species"). Like the intervention tour it runs over the
 * real screens while the user taps through, and nothing is navigated on their
 * behalf.
 *
 * It answers the two questions people actually ask about this screen: how do I
 * get a species onto my list, and how do I change one once it is there. So the
 * flow is Manage Species -> Species Search (type, tap the heart, go back) ->
 * Manage Species (which species you can edit, how to drop one, open one) ->
 * Species Info (photo, local name).
 *
 * Three things shape it, and each one is a trap if you change the steps:
 *
 * - **Manage Species is visited twice.** You have to add a species before
 *   there is one to edit, so the screen owns the opening step *and* the three
 *   that follow the search detour. A one-entry-per-screen map cannot express
 *   that, which is why this tour uses `SCREEN_STEPS` with `useTourScreen`
 *   rather than the intervention tour's `STAGE_ENTRY`.
 * - **Every step keeps a way out.** The list can be empty (someone who skips
 *   the favourite step and presses back has no species card to point at), and
 *   a step whose target never registers falls back to a centred tooltip. So no
 *   step here hides Next while also gating on `completed`, which would leave
 *   Skip as the only exit. The steps that the user can satisfy by acting
 *   advance themselves through `advanceIfOn`, and Next is the fallback.
 * - **The remove step does not remove anything.** It is the one step that is
 *   deliberately not interactive: a walkthrough must not talk someone into
 *   deleting a favourite to get to the next slide.
 */

export const MANAGE_SPECIES_TOUR_ID = 'manage-species'

/**
 * Ids shared by the <TourTarget> wrappers and the steps below. Kept in one
 * place because a typo on either side is silent: the step just never finds its
 * target and falls back to a centred tooltip.
 */
export const SPECIES_TOUR_TARGETS = {
  SEARCH_BAR: 'species-tour-search-bar',
  SEARCH_INPUT: 'species-tour-search-input',
  SEARCH_FAVOURITE: 'species-tour-search-favourite',
  SEARCH_BACK: 'species-tour-search-back',
  PROJECT_FILTER: 'species-tour-project-filter',
  CARD_FAVOURITE: 'species-tour-card-favourite',
  CARD: 'species-tour-card',
  INFO_PHOTO: 'species-tour-info-photo',
  INFO_DETAILS: 'species-tour-info-details',
} as const

/** Step ids. Screens refer to these through SCREEN_STEPS, never by index. */
export const SPECIES_TOUR_STEPS = {
  SEARCH: 'species-step-search',
  TYPE: 'species-step-type',
  FAVOURITE: 'species-step-favourite',
  BACK: 'species-step-back',
  FILTER: 'species-step-filter',
  REMOVE: 'species-step-remove',
  OPEN: 'species-step-open',
  PHOTO: 'species-step-photo',
  DETAILS: 'species-step-details',
} as const

/**
 * Every step a screen teaches, in tour order. `useTourScreen` jumps to the
 * first of a screen's steps at or after the step the tour is currently on, so
 * a screen may own more than one group (Manage Species owns the first step and
 * the middle three) and can never drag the tour backwards.
 *
 * These are module-level constants on purpose: a fresh array per render would
 * re-run the focus effect that reads them on every render.
 */
export const SCREEN_STEPS = {
  manageSpecies: [
    SPECIES_TOUR_STEPS.SEARCH,
    SPECIES_TOUR_STEPS.FILTER,
    SPECIES_TOUR_STEPS.REMOVE,
    SPECIES_TOUR_STEPS.OPEN,
  ],
  speciesSearch: [
    SPECIES_TOUR_STEPS.TYPE,
    SPECIES_TOUR_STEPS.FAVOURITE,
    SPECIES_TOUR_STEPS.BACK,
  ],
  speciesInfo: [SPECIES_TOUR_STEPS.PHOTO, SPECIES_TOUR_STEPS.DETAILS],
} as const

export type SpeciesTourScreen = keyof typeof SCREEN_STEPS

const t = (key: string) => i18next.t(`label.${key}`)

/**
 * `showProjectFilter` is read once, when the tour starts, which is why it is an
 * argument and not a hook.
 *
 * The project-species switch only exists for a signed-in user with a project
 * selected (`ManageSpeciesHeader`), and it matters here because project species
 * cannot be edited or unfavourited: with the switch on, the card the next two
 * steps point at refuses the tap with a toast. Signed out, or with no project,
 * there is no switch and no such list, so the step is dropped rather than
 * pointing at a target that does not exist.
 */
export const buildManageSpeciesTourSteps = (showProjectFilter: boolean): TourStep[] => [
  {
    id: SPECIES_TOUR_STEPS.SEARCH,
    targetId: SPECIES_TOUR_TARGETS.SEARCH_BAR,
    title: t('species_tour_search_title'),
    description: t('species_tour_search_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(SPECIES_TOUR_STEPS.SEARCH),
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SPECIES_TOUR_STEPS.TYPE,
    targetId: SPECIES_TOUR_TARGETS.SEARCH_INPUT,
    title: t('species_tour_type_title'),
    description: t('species_tour_type_desc'),
    interactive: true,
    // Advances itself the moment the search returns something (see
    // SpeciesSearchView), so the user is not asked to press Next over a
    // keyboard. Next stays available for anyone whose search finds nothing.
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SPECIES_TOUR_STEPS.FAVOURITE,
    targetId: SPECIES_TOUR_TARGETS.SEARCH_FAVOURITE,
    title: t('species_tour_favourite_title'),
    description: t('species_tour_favourite_desc'),
    interactive: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: SPECIES_TOUR_STEPS.BACK,
    targetId: SPECIES_TOUR_TARGETS.SEARCH_BACK,
    title: t('species_tour_back_title'),
    description: t('species_tour_back_desc'),
    interactive: true,
    backdropBehavior: () => runTourAction(SPECIES_TOUR_STEPS.BACK),
    tooltipPosition: 'bottom',
    spotlightPadding: 10,
  },
  {
    id: SPECIES_TOUR_STEPS.FILTER,
    targetId: SPECIES_TOUR_TARGETS.PROJECT_FILTER,
    title: t('species_tour_filter_title'),
    description: t('species_tour_filter_desc'),
    active: showProjectFilter,
    interactive: true,
    // First step of the screen's second visit: Back would jump to a step on the
    // search screen, and the focus sync would immediately undo it.
    hidePrevButton: true,
    tooltipPosition: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: SPECIES_TOUR_STEPS.REMOVE,
    targetId: SPECIES_TOUR_TARGETS.CARD_FAVOURITE,
    title: t('species_tour_remove_title'),
    description: t('species_tour_remove_desc'),
    // Deliberately NOT interactive. This is the only destructive control in the
    // tour, and a tap here drops the species the next two steps are about.
    hidePrevButton: !showProjectFilter,
    tooltipPosition: 'auto',
    spotlightPadding: 8,
  },
  {
    id: SPECIES_TOUR_STEPS.OPEN,
    targetId: SPECIES_TOUR_TARGETS.CARD,
    title: t('species_tour_open_title'),
    description: t('species_tour_open_desc'),
    interactive: true,
    tooltipPosition: 'auto',
    spotlightPadding: 4,
  },
  {
    id: SPECIES_TOUR_STEPS.PHOTO,
    targetId: SPECIES_TOUR_TARGETS.INFO_PHOTO,
    title: t('species_tour_photo_title'),
    description: t('species_tour_photo_desc'),
    interactive: true,
    tooltipPosition: 'auto',
    spotlightPadding: 6,
  },
  {
    id: SPECIES_TOUR_STEPS.DETAILS,
    targetId: SPECIES_TOUR_TARGETS.INFO_DETAILS,
    title: t('species_tour_details_title'),
    description: t('species_tour_details_desc'),
    interactive: true,
    tooltipPosition: 'auto',
    spotlightPadding: 6,
  },
]
