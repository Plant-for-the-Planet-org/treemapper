import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import BackIcon from 'assets/images/svg/BackIcon.svg'

interface Props {

  goBack: () => void
}

const EditDispalyCurrentPolygonMarker = (props: Props) => {
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

export default EditDispalyCurrentPolygonMarker

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
  },
  undoButton: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  undoLable: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginRight: 5,
    color: Colors.TEXT_LIGHT,
    marginBottom: 5
  }

})
