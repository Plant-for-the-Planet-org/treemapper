import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import {
  MONITORING_PLOT_TOUR_ID,
  SCREEN_STEPS,
  buildMonitoringPlotTourSteps,
  type PlotTourScreen,
} from 'src/utils/tour/monitoringPlotTour'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the monitoring plot walkthrough. See
 * `utils/tour/monitoringPlotTour.ts` for the flow and the constraints.
 */
const useMonitoringPlotTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(MONITORING_PLOT_TOUR_ID)

  const startMonitoringPlotTour = useCallback(() => {
    startTour(buildMonitoringPlotTourSteps(), {
      tourId: MONITORING_PLOT_TOUR_ID,
      // Required by every `interactive` step: a Modal overlay swallows the
      // touch before it reaches the control the spotlight is pointing at.
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
  }, [startTour])

  return {
    startMonitoringPlotTour,
    stopTour: controller.stopTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/** Hands a screen its place in the monitoring plot tour. */
export const usePlotTourScreen = (screen: PlotTourScreen, enabled = true) => {
  useTourScreen(MONITORING_PLOT_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useMonitoringPlotTour
