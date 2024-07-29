import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import BackIcon from 'assets/images/svg/BackIcon.svg'

interface Props {

  goBack: () => void
}

const EditDisplayCurrentPolygonMarker = (props: Props) => {
  const {goBack} = props
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backIcon} onPress={goBack}><BackIcon onPress={goBack} /></TouchableOpacity>
      <View style={styles.wrapper}>
        <Text style={styles.label}>Corner</Text>
        <Text style={styles.note}>Please select the point and drag</Text>
      </View>
    </View>
  )
}

export default EditDisplayCurrentPolygonMarker

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(50),
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  wrapper: {
    height: '100%',
    flex: 1
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 20,
    marginTop: 5
  },
  label: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD
  },
  note: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR
  }
})
