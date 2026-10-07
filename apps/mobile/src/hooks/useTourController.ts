import { useCallback, useEffect, useRef } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  clearTourAction,
  clearTourBackAction,
  setTourAction,
  setTourBackAction,
} from 'src/utils/tour/tourActions'

/**
 * The half of a guided walkthrough that is the same whatever it teaches.
 *
 * Both tours in the app -- the Single Tree intervention flow and Manage
 * Species -- are the same machine over a different list of steps: check that
 * the running tour is *mine* before touching it, advance only when sitting on
 * a given step, and pause/resume around a detour. `useInterventionTour` and
 * `useManageSpeciesTour` are thin wrappers over this; the step lists and the
 * screens that own them live in `utils/tour/`.
 *
 * Only one tour can be active at a time (the library keeps a single
 * `activeTourId`), which is why every method here is a no-op when another
 * tour, or no tour, is running. Screens can therefore call them
 * unconditionally and read the same whether or not a tour is in progress.
 */
export const useTourController = (tourId: string) => {
  const {
    endTour,
    nextStep,
    goToStep,
    setStepCompleted,
    pauseTour,
    resumeTour,
    isActive,
    isPaused,
    activeSteps,
    currentStep,
    activeTourId,
  } = useTourGuide()

  const isTourRunning = isActive && activeTourId === tourId

  /** Index of a step id within the steps actually in play. -1 when filtered out. */
  const indexOfStep = useCallback(
    (stepId: string) => activeSteps.findIndex(step => step.id === stepId),
    [activeSteps],
  )

  const currentStepId = isTourRunning ? activeSteps[currentStep]?.id : undefined

  /**
   * Advance, but only when the tour is sitting on `stepId`. Press handlers call
   * this unconditionally; outside the tour it is a no-op, so the handler reads
   * the same whether or not a tour is running.
   */
  const advanceIfOn = useCallback(
    (stepId: string) => {
      if (!isTourRunning || currentStepId !== stepId) {
        return
      }
      // Satisfies `completed: false` gating before advancing, so a step that
      // disables Next until the user acts is released by the act itself.
      setStepCompleted(stepId, true)
      nextStep()
    },
    [isTourRunning, currentStepId, setStepCompleted, nextStep],
  )

  const stopTour = useCallback(() => {
    if (isTourRunning) {
      endTour()
    }
  }, [isTourRunning, endTour])

  /**
   * Hide the tour without losing its place. Used where the flow detours through
   * screens the tour does not cover, so the overlay is not left pointing at a
   * button on a screen the user has left. The next covered screen resumes it.
   */
  const suspendTour = useCallback(() => {
    if (isTourRunning && !isPaused) {
      pauseTour()
    }
  }, [isTourRunning, isPaused, pauseTour])

  return {
    isTourRunning,
    isPaused,
    currentStep,
    currentStepId,
    indexOfStep,
    advanceIfOn,
    goToStep,
    resumeTour,
    stopTour,
    suspendTour,
  }
}

/**
 * Re-points a running tour at the screen the user is actually on, for a tour
 * whose screens are visited more than once.
 *
 * `ownedStepIds` is every step this screen teaches, in tour order. On focus the
 * tour jumps to the first of them at or after the step it is currently on, and
 * never to one before it. That single rule covers the cases a step counter
 * cannot:
 *
 * - Manage Species owns the opening step *and* three later ones (you have to
 *   add a species before there is one to edit). Coming back from the search
 *   screen lands on the later group, not back at the top.
 * - A screen re-mounting behind the user -- a back press, a `replace`, a
 *   remount -- cannot drag the tour backwards, because an earlier owned step is
 *   never a candidate.
 * - Leaving the search screen by the system back gesture instead of the back
 *   arrow still resumes correctly: any step the user skipped past is simply not
 *   a candidate any more.
 *
 * Steps a screen owns that are filtered out (`active: false`) drop out of
 * `activeSteps` and are ignored here for free.
 *
 * Pass a module-level constant for `ownedStepIds`: a fresh array on every render would
 * re-run the focus effect on every render.
 */
export const useTourScreen = (
  tourId: string,
  ownedStepIds: readonly string[],
  enabled = true,
) => {
  const { isTourRunning, isPaused, indexOfStep, goToStep, resumeTour, currentStep } =
    useTourController(tourId)

  // The first step a screen owns is the step it was pushed onto, so Back there
  // means leaving the screen. Steps further down the list are mid-screen and
  // keep the plain step-back.
  useTourBackToPreviousScreen(ownedStepIds[0])

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !isTourRunning) {
        return
      }
      // Back on a covered screen, so whatever detour suspended the tour is over.
      if (isPaused) {
        resumeTour()
      }
      const target = ownedStepIds
        .map(indexOfStep)
        .filter(index => index >= 0)
        .find(index => index >= currentStep)
      if (target !== undefined && target > currentStep) {
        goToStep(target)
      }
    }, [
      enabled,
      isTourRunning,
      isPaused,
      resumeTour,
      indexOfStep,
      goToStep,
      ownedStepIds,
      currentStep,
    ]),
  )
}

/**
 * Lend a screen's own press handler to a tour step, for the steps the tour
 * drives itself rather than by letting the tap fall through the spotlight.
 * See the note on the registry in `utils/tour/tourActions.ts`.
 */
export const useTourAction = (stepId: string, action: () => void) => {
  useRegisteredTourAction(setTourAction, clearTourAction, stepId, action)
}

/**
 * Lend a screen's own *back* handler to a tour step, so the tooltip's Back
 * button leaves the screen instead of pointing the overlay at a control the
 * user can no longer see. Register it only on the step a screen opens on, and
 * only where leaving is reversible -- see `utils/tour/tourActions.ts`.
 */
export const useTourBackAction = (stepId: string, action: () => void) => {
  useRegisteredTourAction(setTourBackAction, clearTourBackAction, stepId, action)
}

/**
 * The handler is read through a ref, so a step registered once still calls the
 * current closure rather than the one captured on mount.
 */
const useRegisteredTourAction = (
  set: (stepId: string, action: () => void) => void,
  clear: (stepId: string, action: () => void) => void,
  stepId: string,
  action: () => void,
) => {
  const actionRef = useRef(action)
  actionRef.current = action

  useEffect(() => {
    const run = () => actionRef.current()
    set(stepId, run)
    return () => clear(stepId, run)
  }, [set, clear, stepId])
}

/**
 * Registers this screen's own back as the tour's Back handler for the step the
 * screen opens on, so Back leaves the screen instead of pointing the overlay at
 * a control the user can no longer see.
 *
 * Every screen in every tour uses the shared `Header`, whose back is a plain
 * `goBack` with no screen-specific cleanup, which is why one hook covers all of
 * them. A screen that grows a `backFunc` should register that instead.
 *
 * Registering is free on a step that keeps `hidePrevButton`: the handler is
 * only ever reached through a button that step never draws. So which steps
 * actually offer this is decided in the step definitions, not here.
 */
export const useTourBackToPreviousScreen = (stepId: string | undefined) => {
  const navigation = useNavigation()

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  // No step has an empty id, so a screen that owns none registers nothing.
  useTourBackAction(stepId ?? '', goBack)
}
