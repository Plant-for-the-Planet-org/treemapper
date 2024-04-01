import {Image, StyleSheet, View} from 'react-native'
import React from 'react'
import {scaleSize} from 'src/utils/constants/mixins'

const IterventionCoverImage = () => {
  return (
    <View style={styles.container}>
      <Image source={{uri: ''}} style={styles.imageWrapper} />
    </View>
  )
}

export default IterventionCoverImage

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(250),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  imageWrapper: {
    width: '90%',
    height: '95%',
    borderRadius: 20,
    backgroundColor: 'black',
  },
})
