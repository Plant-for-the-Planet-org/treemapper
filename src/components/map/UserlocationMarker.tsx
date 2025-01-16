import { Dimensions, DimensionValue, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import UserLocationIcon from 'assets/images/svg/UserLocationIcon.svg'
import useLocationPermission from 'src/hooks/useLocationPermission'
import { SCALE_20 } from 'src/utils/constants/spacing'
import { Colors } from 'src/utils/constants'


interface Props {
  stopAutoFocus?: boolean
  low?: boolean
  high?: boolean,
  rightPercent?: DimensionValue
}
const windowWidth = Dimensions.get('window').width;

const UserlocationMarker = (props: Props) => {
  const { stopAutoFocus, low, high, rightPercent } = props
  const { userCurrentLocation } = useLocationPermission()


  useEffect(() => {
    if (!stopAutoFocus) {
      userCurrentLocation()
    }
  }, [stopAutoFocus])

  const isHigh = high ? windowWidth / 2.2 : windowWidth / 2.8
  return (
    <TouchableOpacity style={[styles.container, { bottom: low ? windowWidth / 2.4 : isHigh, right: rightPercent ? rightPercent : '9%' }]} onPress={userCurrentLocation}>
      <UserLocationIcon width={SCALE_20} height={SCALE_20} onPress={userCurrentLocation} />
    </TouchableOpacity>
  )
}

export default UserlocationMarker

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    bottom: windowWidth / 2.4,
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
})
