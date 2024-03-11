import {StyleSheet, View, Text} from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'

interface Props {
  label: string
  index: number
}

const BottomTabIcon = (props: Props) => {
  const {label, index} = props
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        {index === 0 && <MapTabIcon />}
        {index === 1 && <InterventionTabIcon />}
        {index === 2 && <PlotTabIcon />}
      </View>
      <Text style={styles.labelStyle}>{label}</Text>
    </View>
  )
}

export default BottomTabIcon

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  iconWrapper: {},
  labelStyle: {},
})
