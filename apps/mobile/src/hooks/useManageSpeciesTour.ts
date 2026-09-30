import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useTourGuide } from '@wrack/react-native-tour-guide'
import i18next from 'i18next'

import { RootState } from 'src/store'
import {
  MANAGE_SPECIES_TOUR_ID,
  SCREEN_STEPS,
  buildManageSpeciesTourSteps,
  type SpeciesTourScreen,
} from 'src/utils/tour/manageSpeciesTour'
import { useTourController, useTourScreen } from 'src/hooks/useTourController'

/**
 * Drives the Manage Species walkthrough. See `utils/tour/manageSpeciesTour.ts`
 * for the flow and the constraints behind it.
 */
const useManageSpeciesTour = () => {
  const { startTour } = useTourGuide()
  const controller = useTourController(MANAGE_SPECIES_TOUR_ID)
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const currentProject = useSelector(
    (state: RootState) => state.projectState.currentProject.projectId,
  )

  // Same condition as `showProjectFilter` in ManageSpeciesHeader. Kept in step
  // with it: if the switch appears under different rules there, the tour will
  // either point at nothing or skip a step the user can see.
  const showProjectFilter = isLoggedIn && Boolean(currentProject)

  const startManageSpeciesTour = useCallback(() => {
    startTour(buildManageSpeciesTourSteps(showProjectFilter), {
      tourId: MANAGE_SPECIES_TOUR_ID,
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
  }, [startTour, showProjectFilter])

  return {
    startManageSpeciesTour,
    stopTour: controller.stopTour,
    suspendTour: controller.suspendTour,
    advanceIfOn: controller.advanceIfOn,
    isTourRunning: controller.isTourRunning,
    currentStepId: controller.currentStepId,
  }
}

/**
 * Hands a screen its place in the species tour. `enabled` is false on the
 * screens that serve two jobs: ManageSpecies and SpeciesSearch are also part
 * of the intervention capture flow, where this tour has nothing to say.
 */
export const useSpeciesTourScreen = (screen: SpeciesTourScreen, enabled = true) => {
  useTourScreen(MANAGE_SPECIES_TOUR_ID, SCREEN_STEPS[screen], enabled)
}

export default useManageSpeciesTour
