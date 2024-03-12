import {StyleSheet, View, Text, TouchableOpacity} from 'react-native'
import React from 'react'

import MapTabIcon from 'assets/images/svg/MapTabIcon.svg'
import InterventionTabIcon from 'assets/images/svg/InterventionTabIcon.svg'
import PlotTabIcon from 'assets/images/svg/PlotTabIcon.svg'
import AddBottomTabIcon from './AddBottomTabIcon'

interface Props {
  label: unknown
  index: number
  onPress: () => void
  isFocused:boolean
}

const BottomTabIcon = (props: Props) => {
  const {label, index, onPress} = props
  if (index === 3) {
    return (
      <View style={styles.container}>
        <View style={styles.addIconWrapper}>
          <AddBottomTabIcon />
        </View>
        <Text style={styles.addLablel}>Add</Text>
      </View>
    )
  }
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconWrapper}>
        {index === 0 && <MapTabIcon fill="#000"/>}
        {index === 1 && <InterventionTabIcon />}
        {index === 2 && <PlotTabIcon />}
      </View>
      {typeof label === 'string' && (
        <Text style={styles.labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

export default BottomTabIcon

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {},
  labelStyle: {
    marginTop: 5,
  },
  addLablel:{
    marginTop:30,
    left:-10
  },
  addIconWrapper: {
    width: 55,
    height: 55,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: 'white',
    borderRadius: 100,
    position: 'absolute',
    top: -38,
    left:8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.62,
    elevation: 5,
  },
})
