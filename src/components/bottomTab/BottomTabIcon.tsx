import { StyleSheet, View, Text, useWindowDimensions } from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'
import * as Colors from 'src/utils/constants/colors'
import { Typography } from 'src/utils/constants'
import { SCALE_26 } from 'src/utils/constants/spacing'

interface Props {
  label: string
  index: number
  isFocused: boolean
}


const BottomTabIcon = (props: Props) => {
  const { label, index } = props
  const { width } = useWindowDimensions()
  return (
    <View
      style={[styles.container, { width: width / 4, }]}>
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
      <View style={styles.bottomBar}></View>
    </View>
  )
}

export default BottomTabIcon

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height:'100%',
    backgroundColor:"white"
  },
  iconWrapper: {
    marginBottom:5,
    marginTop:5
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 13,
  },
  bottomBar: {
    position:'absolute',
    bottom:-30,
    height:30,
    width:'100%',
    backgroundColor:'white'
  }
})
