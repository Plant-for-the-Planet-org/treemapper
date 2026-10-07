import { StyleSheet, View, Text } from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'
import * as Colors from 'src/utils/constants/colors'
import { Typography } from 'src/utils/constants'
import { TourTarget } from '@wrack/react-native-tour-guide'
import { SYNC_TOUR_TARGETS } from 'src/utils/tour/syncTour'

interface Props {
  label: string
  index: number
  isFocused: boolean
  size: number
  fontSize: number
  labelGap: number
}

/**
 * The three assets do not agree on where their artwork sits inside their own
 * viewBox: the map fills 25x24, the intervention square is inset by 1 on every
 * side, and the plot square only uses 22 of its 24 and is pushed to the top
 * left. Drawn at one shared size they came out three different weights, with
 * the plot the smallest and visibly off-centre.
 *
 * Overriding the viewBox with the artwork's real bounds fixes that without
 * touching the files, which are exported from design. The boxes are near
 * enough square that the default `xMidYMid meet` centres them; the map's
 * slightly wide box is fitted rather than stretched, which is what the old
 * square width/height on a 25x24 viewBox was doing.
 */
const ICON_VIEW_BOX: Record<number, string> = {
  // Measured from the artwork itself, not guessed: map 1.04..23.96 x 0..23.22,
  // intervention 1..23 both ways, plot 0..22 both ways.
  0: '1.04 0 22.92 23.22',
  1: '1 1 22 22',
  2: '0 0 22 22',
}

const BottomTabIcon = (props: Props) => {
  const { label, index, isFocused, size, fontSize, labelGap } = props
  const tint = isFocused ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT
  const iconProps = {
    height: size,
    width: size,
    fill: tint,
    viewBox: ICON_VIEW_BOX[index],
  }

  const content = (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { height: size }]}>
        {index === 0 && <MapTabIcon {...iconProps} />}
        {index === 1 && <InterventionTabIcon {...iconProps} />}
        {index === 2 && <PlotTabIcon {...iconProps} />}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[
          styles.labelStyle,
          { color: tint, fontSize, paddingTop: labelGap },
        ]}>
        {label}
      </Text>
    </View>
  )

  // The sync walkthrough asks the user to change tab here. The icon is drawn
  // inside the tab's own button, so an interactive step lets the tap fall
  // straight through to it -- nothing is navigated on the user's behalf.
  if (index === 1) {
    return <TourTarget id={SYNC_TOUR_TARGETS.TAB}>{content}</TourTarget>
  }

  return content
}

export default BottomTabIcon

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
})
