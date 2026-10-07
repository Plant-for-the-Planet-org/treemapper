import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  CREATE_SITE_TOUR_ID,
  SCREEN_STEPS,
  buildCreateSiteTourSteps,
  type SiteTourScreen,
} from 'src/utils/tour/createSiteTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the create-site walkthrough. See `utils/tour/createSiteTour.ts` for
 * why this one is advanced almost entirely by handlers rather than by screen
 * focus.
 */
const useCreateSiteTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(CREATE_SITE_TOUR_ID)

  const startCreateSiteTour = useCallback(() => {
    startTour(buildCreateSiteTourSteps(), buildTourConfig(CREATE_SITE_TOUR_ID))
  }, [startTour])

  return {
    startCreateSiteTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the create-site tour. */
export const useSiteTourScreen = (screen: SiteTourScreen, enabled = true) => {
  useTourScreen(CREATE_SITE_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useCreateSiteTour
