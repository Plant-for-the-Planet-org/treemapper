import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import LayerBackDrop from 'assets/images/svg/LayerBackdrop.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont} from 'src/utils/constants/mixins'
import AddIcon from 'assets/images/svg/Addicon.svg'

const OfflineMapHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <LayerBackDrop />
      </View>
      <Text style={styles.headerLabel}>Add Area to Offline Maps</Text>
      <Text style={styles.note}>
        Add & Save your Area to Offline Maps {'\n'}
        Anytime, Anywhere {'\n'}
      </Text>
      <TouchableOpacity style={styles.btnContainer}>
        <AddIcon style={styles.btnIcon}/>
        <Text style={styles.btnLable}>Add Area</Text>
      </TouchableOpacity>
    </View>
  )
}

export default OfflineMapHeader

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
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
    height: '100%',
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.BLACK,
    fontSize: scaleFont(18),
    marginTop: 30,
    marginBottom: 10,
  },
  note: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.BLACK,
    fontSize: scaleFont(14),
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
  btnLable: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE,
    fontSize: scaleFont(14),
  },
})
