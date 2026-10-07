import { StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import React from 'react'
import AddOptionModal from './AddOptionModal'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import AddTabIcon from 'assets/images/svg/AddTabIcon.svg'
import { Colors } from 'src/utils/constants'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { TourTarget } from '@wrack/react-native-tour-guide'
import useInterventionTour, { useTourAction } from 'src/hooks/useInterventionTour'
import { TOUR_TARGETS, TOUR_STEPS } from 'src/utils/tour/interventionTour'
import useMonitoringPlotTour from 'src/hooks/useMonitoringPlotTour'
import { PLOT_TOUR_STEPS } from 'src/utils/tour/monitoringPlotTour'
import useCreateSiteTour from 'src/hooks/useCreateSiteTour'
import { SITE_TOUR_STEPS } from 'src/utils/tour/createSiteTour'
import { TabBarGeometry } from './tabBarGeometry'

interface Props {
  geometry: TabBarGeometry
  open: boolean
  setOpen: (next: boolean) => void
}

/**
 * The floating "+" button and the menu it opens.
 *
 * It no longer draws any part of the bar. The bite it sits in belongs to
 * `TabBarBackground`, and both read the same geometry, so the white ring is
 * even on every screen instead of only on the one it was tuned for.
 */
const AddBottomTabIcon = (props: Props) => {
  const { geometry, open, setOpen } = props
  const { height: windowHeight } = useWindowDimensions()
  const { advanceIfOn } = useInterventionTour()
  // Three tours open with this button. Only one can be running, so all are
  // told and whichever is not on its own "+" step ignores it.
  const { advanceIfOn: advancePlotTour } = useMonitoringPlotTour()
  const { advanceIfOn: advanceSiteTour } = useCreateSiteTour()

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg')
  }, [open])

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: rotation.value }],
  }))

  const onAddPress = () => {
    ctaHaptic()
    setOpen(!open)
    advanceIfOn(TOUR_STEPS.ADD)
    advancePlotTour(PLOT_TOUR_STEPS.ADD)
    advanceSiteTour(SITE_TOUR_STEPS.ADD)
  }

  // Tapping anywhere on this tour step opens the menu. Opens rather than
  // toggles: the press handler is a toggle, and a stray tap while the menu is
  // already up would shut it again mid-step.
  const openMenuForTour = () => {
    if (!open) {
      onAddPress()
    }
  }
  useTourAction(TOUR_STEPS.ADD, openMenuForTour)
  useTourAction(PLOT_TOUR_STEPS.ADD, openMenuForTour)
  useTourAction(SITE_TOUR_STEPS.ADD, openMenuForTour)

  return (
    <>
      {open && (
        <Pressable
          onPress={() => {
            setOpen(false)
          }}
          style={[
            styles.backdrop,
            { top: -windowHeight, height: windowHeight + geometry.containerHeight },
          ]}
        />
      )}
      <TourTarget
        id={TOUR_TARGETS.ADD_BUTTON}
        style={[
          styles.addIconContainer,
          {
            left: geometry.fabLeft,
            top: geometry.fabTop,
            width: geometry.fabDiameter,
            height: geometry.fabDiameter,
            borderRadius: geometry.fabRadius,
          },
        ]}>
        <Pressable style={styles.addIconFill} onPress={onAddPress}>
          <Animated.View style={rotationStyle}>
            {/* Sized off the button rather than left at the asset's own
                30dp, so the glyph keeps the same weight inside the circle
                when the circle scales. */}
            <AddTabIcon
              width={geometry.fabGlyphSize}
              height={geometry.fabGlyphSize}
            />
          </Animated.View>
          <AddOptionModal setVisible={setOpen} visible={open} />
        </Pressable>
      </TourTarget>
    </>
  )
}

export default AddBottomTabIcon

const styles = StyleSheet.create({
  addIconContainer: {
    position: 'absolute',
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.GRAY_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
    zIndex: 10,
  },
  addIconFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
})
