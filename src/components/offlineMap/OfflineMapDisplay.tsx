import {StyleSheet, View} from 'react-native'
import React from 'react'
import {Colors} from 'src/utils/constants'
import CustomButton from '../common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'

const OfflineMapDisplay = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.mapStyle}></View>
        <CustomButton
          label="Save Area"
          containerStyle={styles.btnContainer}
          pressHandler={() => null}
        />
      </View>
    </View>
  )
}

export default OfflineMapDisplay

const styles = StyleSheet.create({
  container: {width: '100%', height: '100%'},
  wrapper: {
    width: '100%',
    height: '80%',
    position: 'absolute',
    zIndex: 1,
    top: '-5%',
    alignItems: 'center',
  },
  mapStyle: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.NEW_PRIMARY,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    marginTop: 10,
  },
})
