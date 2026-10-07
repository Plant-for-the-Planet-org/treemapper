import { useCallback } from 'react'
import { useTourGuide } from '@wrack/react-native-tour-guide'

import {
  MONITORING_PLOT_TOUR_ID,
  SCREEN_STEPS,
  buildMonitoringPlotTourSteps,
  type PlotTourScreen,
} from 'src/utils/tour/monitoringPlotTour'
import { buildTourConfig } from 'src/utils/tour/tourConfig'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the monitoring plot walkthrough. See
 * `utils/tour/monitoringPlotTour.ts` for the flow and the constraints.
 */
const useMonitoringPlotTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(MONITORING_PLOT_TOUR_ID)

  const startMonitoringPlotTour = useCallback(() => {
    startTour(buildMonitoringPlotTourSteps(), buildTourConfig(MONITORING_PLOT_TOUR_ID))
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
