import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import { RootState } from 'src/store'

import {
  MULTI_TREE_TOUR_ID,
  SCREEN_STEPS,
  buildMultiTreeTourSteps,
  type MultiTreeTourScreen,
} from 'src/utils/tour/multiTreeTour'
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
    startTour(buildMultiTreeTourSteps(Boolean(currentProject), Boolean(userType)), {
      tourId: MULTI_TREE_TOUR_ID,
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
