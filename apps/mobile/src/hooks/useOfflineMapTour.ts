import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  OFFLINE_MAP_TOUR_ID,
  SCREEN_STEPS,
  buildOfflineMapTourSteps,
  type OfflineTourScreen,
} from 'src/utils/tour/offlineMapTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the offline maps walkthrough. See `utils/tour/offlineMapTour.ts`.
 */
const useOfflineMapTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(OFFLINE_MAP_TOUR_ID)

  const startOfflineMapTour = useCallback(() => {
    startTour(buildOfflineMapTourSteps(), buildTourConfig(OFFLINE_MAP_TOUR_ID))
  }, [startTour])

  return {
    startOfflineMapTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the offline maps tour. */
export const useOfflineTourScreen = (
  screen: OfflineTourScreen,
  enabled = true,
) => {
  useTourScreen(OFFLINE_MAP_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useOfflineMapTour
