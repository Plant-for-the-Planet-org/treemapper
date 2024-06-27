import { StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import UserLocationIcon from 'assets/images/svg/InactiveUserLocationIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'
import useLocationPermission from 'src/hooks/useLocationPermission'


interface Props {
  stopAutoFocus?: boolean
}

const UserlocationMarker = (props: Props) => {
  const { stopAutoFocus } = props
  const { userCurrentLocation } = useLocationPermission()


  useEffect(() => {
    if (!stopAutoFocus) {
      userCurrentLocation()
    }
  }, [stopAutoFocus])


  return (
    <TouchableOpacity style={styles.container} onPress={userCurrentLocation}>
      <UserLocationIcon width={40} height={40} />
    </TouchableOpacity>
  )
}

export default UserlocationMarker

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    right:'6%',
    bottom: scaleSize(140),
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center'
  },
})
