import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import { RootState } from 'src/store'
import {
  SINGLE_TREE_TOUR_ID,
  STAGE_ENTRY,
  buildSingleTreeTourSteps,
  type TourStage,
} from 'src/utils/tour/interventionTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import {
  useTourAction,
  useTourBackToPreviousScreen,
  useTourController,
} from 'src/hooks/useTourController'

export { useTourAction }

/**
 * Drives the Single Tree walkthrough. See `utils/tour/interventionTour.ts`
 * for why the tour is screen-anchored rather than a linear step counter, and
 * `useTourController` for the machinery it shares with the Manage Species tour.
 */
const useInterventionTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(SINGLE_TREE_TOUR_ID)
  const currentProject = useSelector((state: RootState) => state.projectState.currentProject.projectId)
  // Empty string when signed out. HomeHeader gates the project picker on it,
  // so it decides whether the tour's opening step has anything to point at.
  const userType = useSelector((state: RootState) => state.userState.type)

  const startSingleTreeTour = useCallback(() => {
    startTour(
      buildSingleTreeTourSteps(Boolean(currentProject), Boolean(userType)),
      buildTourConfig(SINGLE_TREE_TOUR_ID),
    )
  }, [startTour, currentProject, userType])

  return {
    startSingleTreeTour,
    stopTour: controller.stopTour,
    suspendTour: controller.suspendTour,
    resumeTour: controller.resumeTour,
    advanceIfOn: controller.advanceIfOn,
    indexOfStep: controller.indexOfStep,
    goToStep: controller.goToStep,
    isTourRunning: controller.isTourRunning,
    isPaused: controller.isPaused,
    currentStepId: controller.currentStepId,
  }
}

/**
 * Re-points a running tour at the screen the user is actually on.
 *
 * Called from each screen in the flow. It only ever moves the tour *forward*:
 * a screen lower in the flow re-mounting (a back press, a `navigation.replace`,
 * StrictMode) must not drag the tour back to an earlier step the user has
 * already passed.
 *
 * Each screen in this flow is visited once, so one entry step per screen is
 * enough. The Manage Species tour revisits a screen and uses `useTourScreen`
 * instead, which takes every step a screen owns.
 */
export const useTourStage = (stage: TourStage) => {
  const { isTourRunning, isPaused, indexOfStep, goToStep, resumeTour } = useTourController(
    SINGLE_TREE_TOUR_ID,
  )
  const { currentStep } = useTourGuide()
  const syncedRef = useRef(false)

  // Back on the step a screen opens on leaves the screen. See
  // `useTourBackToPreviousScreen`.
  useTourBackToPreviousScreen(STAGE_ENTRY[stage])

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

export default useInterventionTour
