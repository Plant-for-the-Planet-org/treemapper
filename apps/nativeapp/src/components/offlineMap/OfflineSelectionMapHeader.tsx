import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import LayerBackDrop from 'assets/images/svg/LayerBackdrop.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont} from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'

const OfflineSelectionMapHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <LayerBackDrop />
      </View>
      <Text style={styles.note}>
        {i18next.t("label.pan_n_zoom_to_select")}
      </Text>
    </View>
  )
}

export default OfflineSelectionMapHeader

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '20%',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    zIndex: -1,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom:12,
    height:'100%'
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.BLACK,
    fontSize: scaleFont(18),
    marginTop: 30,
    marginBottom: 10,
  },
  note: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    fontSize: scaleFont(16),
    lineHeight: 20,
    textAlign: 'center',
  },
  btnContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.NEW_PRIMARY,
    paddingHorizontal:20,
    paddingVertical:13,
    marginBottom:20,
    flexDirection:'row'
  },
  btnIcon: {
    marginRight: 10,
  },
  btnLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE,
    fontSize: scaleFont(14),
  },
})
