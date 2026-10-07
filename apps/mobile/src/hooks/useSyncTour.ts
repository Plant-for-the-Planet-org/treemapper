import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import {
  SYNC_TOUR_ID,
  SCREEN_STEPS,
  buildSyncTourSteps,
  type SyncTourScreen,
} from 'src/utils/tour/syncTour'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the sync walkthrough. See `utils/tour/syncTour.ts` for what it
 * teaches and why no step here uploads anything.
 */
const useSyncTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(SYNC_TOUR_ID)

  const startSyncTour = useCallback(() => {
    startTour(buildSyncTourSteps(), {
      tourId: SYNC_TOUR_ID,
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
    startSyncTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the sync tour. */
export const useSyncTourScreen = (screen: SyncTourScreen, enabled = true) => {
  useTourScreen(SYNC_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useSyncTour
