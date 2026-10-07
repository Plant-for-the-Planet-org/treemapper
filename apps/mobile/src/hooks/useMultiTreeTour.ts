import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import { RootState } from 'src/store'

import {
  MULTI_TREE_TOUR_ID,
  SCREEN_STEPS,
  buildMultiTreeTourSteps,
  type MultiTreeTourScreen,
} from 'src/utils/tour/multiTreeTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the Multiple Trees walkthrough. See `utils/tour/multiTreeTour.ts`
 * for the flow and why it stops where it does.
 */
const useMultiTreeTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(MULTI_TREE_TOUR_ID)
  const currentProject = useSelector(
    (state: RootState) => state.projectState.currentProject.projectId,
  )
  // Empty string when signed out. HomeHeader gates the project picker on it,
  // so it decides whether the tour's opening step has anything to point at.
  const userType = useSelector((state: RootState) => state.userState.type)

  const startMultiTreeTour = useCallback(() => {
    startTour(
      buildMultiTreeTourSteps(Boolean(currentProject), Boolean(userType)),
      buildTourConfig(MULTI_TREE_TOUR_ID),
    )
  }, [startTour, currentProject, userType])

  return {
    startMultiTreeTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the Multiple Trees tour. */
export const useMultiTreeTourScreen = (
  screen: MultiTreeTourScreen,
  enabled = true,
) => {
  useTourScreen(MULTI_TREE_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useMultiTreeTour
