import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import UserLocationIcon from 'assets/images/svg/InactiveUserLocationIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'
import useLocationPermission from 'src/hooks/useLocationPermission'

const windowWidth = Dimensions.get('screen').width
const width = windowWidth / 4

interface Props {
  stopAutoFocus?: boolean
}

const UserlocationMarker = (props: Props) => {
  const { stopAutoFocus } = props
  const { userCurrentLocation, permissionStatus } = useLocationPermission()
  useEffect(() => {
    if (permissionStatus === 'granted' && !stopAutoFocus) {
      userCurrentLocation()
    }
  }, [permissionStatus, stopAutoFocus])


  return (
    <TouchableOpacity style={styles.container} onPress={userCurrentLocation}>
      <UserLocationIcon />
    </TouchableOpacity>
  )
}

export default UserlocationMarker

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    right: width / 3.5,
    bottom: scaleSize(140),
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center'
  },
})
