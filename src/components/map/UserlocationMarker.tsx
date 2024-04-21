import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import UserLocationIcon from 'assets/images/svg/InactiveUserLocationIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'
import { useDispatch } from 'react-redux'
import { updateUserLocation } from 'src/store/slice/gpsStateSlice'
import getUserLocation from 'src/utils/helpers/getUserLocation'

const windowWidth = Dimensions.get('screen').width
const width = windowWidth / 4

const UserlocationMarker = () => {
  const dispatch = useDispatch()
  const getInitalLocation = async () => {
    const { lat, long } = await getUserLocation()
    if (lat && long) {
      dispatch(
        updateUserLocation({
          lat: lat,
          long: long,
        }),
      )
    }

  }
  return (
    <TouchableOpacity style={styles.container} onPress={getInitalLocation}>
      <UserLocationIcon />
    </TouchableOpacity>
  )
}

export default UserlocationMarker

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    right: width /4.5,
    bottom: scaleSize(140),
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center'
  },
})
