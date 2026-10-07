import { StyleSheet, View, Text, useWindowDimensions } from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'
import * as Colors from 'src/utils/constants/colors'
import { Typography } from 'src/utils/constants'
import { SCALE_26 } from 'src/utils/constants/spacing'
import { TourTarget } from '@wrack/react-native-tour-guide'
import { SYNC_TOUR_TARGETS } from 'src/utils/tour/syncTour'

interface Props {
  label: string
  index: number
  isFocused: boolean
}


const BottomTabIcon = (props: Props) => {
  const { label, index } = props
  const { width } = useWindowDimensions()
  const content = (
    <View
      style={[styles.container, { width: width / 4, borderTopLeftRadius: index === 0 ? 10 : 0, }]}>
      <View style={styles.iconWrapper}>
        {index === 0 && (
          <MapTabIcon
            height={SCALE_26}
            width={SCALE_26}
            fill={props.isFocused ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT}
          />
        )}
        {index === 1 && (
          <InterventionTabIcon
            height={SCALE_26}
            width={SCALE_26}
            fill={props.isFocused ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT}
          />
        )}
        {index === 2 && (
          <PlotTabIcon
            height={SCALE_26}
            width={SCALE_26}
            fill={props.isFocused ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT}
          />
        )}
      </View>
      <Text
        style={[
          styles.labelStyle,
          { color: props.isFocused ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT },
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
    alignItems: 'center',
    justifyContent: 'center',
    height:100,
    bottom:-30,
    backgroundColor: "white"
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 12,
    paddingBottom:20,
    paddingTop:3
  },
})
