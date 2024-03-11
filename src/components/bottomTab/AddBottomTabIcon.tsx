import {StyleSheet, View, Text} from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'

interface Props {
  label: string
  index: number
}

const AddBottomTabIcon = (props: Props) => {
  const {label} = props
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
      <MapTabIcon />
      </View>
      <Text style={styles.labelStyle}>{label}</Text>
    </View>
  )
}

export default AddBottomTabIcon

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
