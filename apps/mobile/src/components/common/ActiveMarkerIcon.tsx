import { StyleSheet, View } from 'react-native'
import React from 'react'
import MapPin from 'assets/images/svg/MapPin.svg'
import { Colors } from 'src/utils/constants'

// Size of the artwork, and how far down it the needle tip sits. Everything
// below the tip in the file is the soft shadow ellipse, which must not be
// counted as part of the pin.
const PIN_WIDTH = 32
const PIN_HEIGHT = 53
const PIN_TIP_Y = 50.81

const ActiveMarkerIcon = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <MapPin width={PIN_WIDTH} height={PIN_HEIGHT} fill={Colors.NEW_PRIMARY} />
    </View>
  )
}

export default ActiveMarkerIcon

const styles = StyleSheet.create({
  // The needle tip has to land exactly on the centre of the parent box,
  // because that centre is the coordinate the map hands back on tap. Pull the
  // pin up by the tip offset rather than guessing a percentage: a percentage
  // only lines up on the one screen height it was tuned for, and every other
  // device marks the point a fixed distance away from where it was aimed.
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PIN_WIDTH,
    height: PIN_HEIGHT,
    marginLeft: -PIN_WIDTH / 2,
    marginTop: -PIN_TIP_Y,
    zIndex: 1,
  },
})
