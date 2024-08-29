import {StyleSheet} from 'react-native'
import React from 'react'
import {LinearGradient} from 'expo-linear-gradient'

const FadeBackground = () => {
  return (
    <LinearGradient
      colors={['rgba(254, 254, 250,255,0)', 'rgba(254, 254, 250,1)']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
    />
  )
}

export default FadeBackground

const styles = StyleSheet.create({
  container: {
    height: '200%',
  width: '100%',
    position: 'absolute',
    zIndex: -1,
  },
})
