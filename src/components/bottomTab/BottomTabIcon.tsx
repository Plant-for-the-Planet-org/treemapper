import {StyleSheet, View, Text} from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'
import * as Colors from 'src/utils/constants/colors'

interface Props {
  label: string
  index: number
  isFocused: boolean
}

const BottomTabIcon = (props: Props) => {
  const {label, index} = props
  return (
    <View
      style={[styles.container, {borderTopLeftRadius: index === 0 ? 20 : 0}]}>
      <View style={styles.iconWrapper}>
        {index === 0 && (
          <MapTabIcon
            fill={props.isFocused ? Colors.PRIMARY_DARK : Colors.TEXT_LIGHT}
          />
        )}
        {index === 1 && (
          <InterventionTabIcon
            fill={props.isFocused ? Colors.PRIMARY_DARK : Colors.TEXT_LIGHT}
          />
        )}
        {index === 2 && (
          <PlotTabIcon
            fill={props.isFocused ? Colors.PRIMARY_DARK : Colors.TEXT_LIGHT}
          />
        )}
      </View>
      <Text
        style={[
          styles.labelStyle,
          {color: props.isFocused ? Colors.PRIMARY_DARK : Colors.TEXT_LIGHT},
        ]}>
        {label}
      </Text>
    </View>
  )
}

export default BottomTabIcon

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'white',
  },
  iconWrapper: {},
  labelStyle: {},
})
