import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  REMEASURE_TOUR_ID,
  SCREEN_STEPS,
  buildRemeasureTourSteps,
  type RemeasureTourScreen,
} from 'src/utils/tour/remeasureTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the remeasurement walkthrough. See `utils/tour/remeasureTour.ts` for
 * why the tree it runs on is chosen by the catalogue rather than by the user.
 */
const useRemeasureTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(REMEASURE_TOUR_ID)

  const startRemeasureTour = useCallback(() => {
    startTour(buildRemeasureTourSteps(), buildTourConfig(REMEASURE_TOUR_ID))
  }, [startTour])

  return {
    startRemeasureTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    suspendTour: controller.suspendTour,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the remeasurement tour. */
export const useRemeasureTourScreen = (
  screen: RemeasureTourScreen,
  enabled = true,
) => {
  useTourScreen(REMEASURE_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useRemeasureTour
