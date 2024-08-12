import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import UserLocationIcon from 'assets/images/svg/InactiveUserLocationIcon.svg'
import useLocationPermission from 'src/hooks/useLocationPermission'


interface Props {
  stopAutoFocus?: boolean
}
const windowWidth = Dimensions.get('window').width;

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

export default React.memo(UserlocationMarker)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    right: '6.5%',
    bottom: windowWidth / 2.5,
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center'
  },
})
