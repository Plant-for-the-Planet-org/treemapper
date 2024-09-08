import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import Icon from '@expo/vector-icons/FontAwesome5';
import i18next from 'src/locales/index';

interface Props {
  id: string
  undo: () => void
}

const DisplayCurrentPolygonMarker = (props: Props) => {
  const { id, undo } = props
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{i18next.t('label.corner')} {id}</Text>
      <Text style={styles.note}>{i18next.t('label.please_select')} {id === 'A' ? 'first' : 'next'} {i18next.t('label.lowercase_corner')}</Text>
      {id !== 'A' && <TouchableOpacity style={styles.undoButton} onPress={undo}>
      <Text style={styles.undoLabel}>Previous Point</Text>
        <Icon
          name="undo-alt"
          size={16}
          color={Colors.GRAY_DARK}
        />
      </TouchableOpacity>}
    </View>
  )
}

export default DisplayCurrentPolygonMarker

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(50),
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    zIndex: 1
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
  undoLabel: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginRight: 5,
    color: Colors.TEXT_LIGHT,
    marginBottom: 5
  }

})
