import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  SYNC_TOUR_ID,
  SCREEN_STEPS,
  buildSyncTourSteps,
  type SyncTourScreen,
} from 'src/utils/tour/syncTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the sync walkthrough. See `utils/tour/syncTour.ts` for what it
 * teaches and why no step here uploads anything.
 */
const useSyncTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(SYNC_TOUR_ID)

  const startSyncTour = useCallback(() => {
    startTour(buildSyncTourSteps(), buildTourConfig(SYNC_TOUR_ID))
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
