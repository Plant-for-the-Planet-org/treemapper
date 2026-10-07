import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import {
  OFFLINE_MAP_TOUR_ID,
  SCREEN_STEPS,
  buildOfflineMapTourSteps,
  type OfflineTourScreen,
} from 'src/utils/tour/offlineMapTour'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the offline maps walkthrough. See `utils/tour/offlineMapTour.ts`.
 */
const useOfflineMapTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(OFFLINE_MAP_TOUR_ID)

  const startOfflineMapTour = useCallback(() => {
    startTour(buildOfflineMapTourSteps(), {
      tourId: OFFLINE_MAP_TOUR_ID,
      // Required by every `interactive` step: a Modal overlay swallows the
      // touch before it reaches the control the spotlight is pointing at.
      overlayMode: 'inline',
      showProgressDots: true,
      motion: 'morph',
      waitForInteractions: true,
      nextButtonText: i18next.t('label.tour_next'),
      prevButtonText: i18next.t('label.tour_back'),
      skipButtonText: i18next.t('label.tour_skip'),
    })
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
