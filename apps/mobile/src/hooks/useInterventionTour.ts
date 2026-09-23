import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import { RootState } from 'src/store'
import {
  SINGLE_TREE_TOUR_ID,
  STAGE_ENTRY,
  buildSingleTreeTourSteps,
  clearTourAction,
  setTourAction,
  type TourStage,
} from 'src/utils/tour/interventionTour'

/**
 * Drives the Single Tree walkthrough. See `utils/tour/interventionTour.ts`
 * for why the tour is screen-anchored rather than a linear step counter.
 */
const useInterventionTour = () => {
  const {
    startTour,
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
  const currentProject = useSelector((state: RootState) => state.projectState.currentProject.projectId)
  // Empty string when signed out. HomeHeader gates the project picker on it,
  // so it decides whether the tour's opening step has anything to point at.
  const userType = useSelector((state: RootState) => state.userState.type)

  const isTourRunning = isActive && activeTourId === SINGLE_TREE_TOUR_ID

  const startSingleTreeTour = useCallback(() => {
    startTour(buildSingleTreeTourSteps(Boolean(currentProject), Boolean(userType)), {
      tourId: SINGLE_TREE_TOUR_ID,
      // Required by every `interactive` step: a Modal overlay swallows the
      // touch before it reaches the button the spotlight is pointing at.
      overlayMode: 'inline',
      showProgressDots: true,
      motion: 'morph',
      // Layout settles after each navigation push; measuring before it does
      // puts the spotlight on the previous screen's geometry.
      waitForInteractions: true,
      nextButtonText: i18next.t('label.tour_next'),
      prevButtonText: i18next.t('label.tour_back'),
      skipButtonText: i18next.t('label.tour_skip'),
    })
  }, [startTour, currentProject, userType])

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
   * screens the tour does not cover (the empty dynamic form), so the overlay is
   * not left pointing at a button on a screen the user has left. The next
   * covered screen resumes it via `useTourStage`.
   */
  const suspendTour = useCallback(() => {
    if (isTourRunning && !isPaused) {
      pauseTour()
    }
  }, [isTourRunning, isPaused, pauseTour])

  return {
    startSingleTreeTour,
    stopTour,
    suspendTour,
    resumeTour,
    advanceIfOn,
    indexOfStep,
    goToStep,
    isTourRunning,
    isPaused,
    currentStepId,
  }
}

/**
 * Re-points a running tour at the screen the user is actually on.
 *
 * Called from each screen in the flow. It only ever moves the tour *forward*:
 * a screen lower in the flow re-mounting (a back press, a `navigation.replace`,
 * StrictMode) must not drag the tour back to an earlier step the user has
 * already passed.
 */
export const useTourStage = (stage: TourStage) => {
  const { isTourRunning, isPaused, indexOfStep, goToStep, resumeTour } = useInterventionTour()
  const { currentStep } = useTourGuide()
  const syncedRef = useRef(false)

  useFocusEffect(
    useCallback(() => {
      if (!isTourRunning) {
        return
      }
      // Back on a covered screen, so whatever detour suspended the tour is over.
      if (isPaused) {
        resumeTour()
      }
      if (!syncedRef.current) {
        const target = indexOfStep(STAGE_ENTRY[stage])
        if (target >= 0 && target > currentStep) {
          syncedRef.current = true
          goToStep(target)
        }
      }
      return () => {
        // Allow one re-sync per visit, so returning to a screen later in a
        // re-run of the flow still lands on the right step.
        syncedRef.current = false
      }
    }, [isTourRunning, isPaused, resumeTour, indexOfStep, goToStep, stage, currentStep]),
  )
}

/**
 * Lend a screen's own press handler to a tour step, for the steps the tour
 * drives itself rather than by letting the tap fall through the spotlight.
 * See the note on `tourActions` in `utils/tour/interventionTour.ts`.
 *
 * The handler is read through a ref, so a step registered once still calls the
 * current closure rather than the one captured on mount.
 */
export const useTourAction = (stepId: string, action: () => void) => {
  const actionRef = useRef(action)
  actionRef.current = action

  useEffect(() => {
    const run = () => actionRef.current()
    setTourAction(stepId, run)
    return () => clearTourAction(stepId, run)
  }, [stepId])
}

export default useInterventionTour
