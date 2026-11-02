import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import Icon from '@expo/vector-icons/FontAwesome5';
import i18next from 'src/locales/index';
import RecordingIndicator from './RecordingIndicator';

interface Props {
  id: string
  undo: () => void
  isTracking: boolean
  trackingPaused: boolean
}

const DisplayCurrentPolygonMarker = (props: Props) => {
  const { id, undo, isTracking, trackingPaused } = props
  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        {isTracking ? <Text style={styles.label}>Tracking {trackingPaused?"Paused":"Started"}</Text> : <Text style={styles.label}>{i18next.t('label.corner')} {id}</Text>}
        {isTracking ?
          <Text style={styles.note}>Start moving around the area you want to track.</Text>
          : <Text style={styles.note}>{i18next.t('label.please_select')} {id === 'A' ? 'first' : 'next'} {i18next.t('label.lowercase_corner')}</Text>
        }
      </View>
      {id !== 'A' && !isTracking ? <TouchableOpacity style={styles.undoButton} onPress={undo}>
        <Text style={styles.undoLabel}>{i18next.t('label.previous_point')}</Text>
        <Icon
          name="undo-alt"
          size={16}
          color={Colors.GRAY_DARK}
        />
      </TouchableOpacity> : null}
      {isTracking && <View style={{ position: 'absolute', right: 10, top: 10, borderWidth: 3, borderRadius: 50, borderColor: Colors.NEW_PRIMARY }}>
        <RecordingIndicator size={12} trackingPaused={trackingPaused}/>
      </View>}
    </View>
  )
}

export default DisplayCurrentPolygonMarker

const styles = StyleSheet.create({
  // A row, and no fixed height.
  //
  // This was `height: scaleSize(50)` holding an 18pt label, a 14pt line and an
  // absolutely positioned undo button at the same time. The text needed about
  // 38 of those 50 points and the button was anchored 10 from the bottom, so
  // the button sat on top of the instruction line it was meant to sit beside.
  // Laying the two out as siblings is what keeps them apart at any font scale,
  // rather than a taller magic number that the next translation breaks again.
  //
  // The map below shrinks by whatever this comes to, which is fine: the
  // crosshair lives inside the map's own box, so it follows the map rather
  // than drifting off the point the map actually records.
  container: {
    width: '100%',
    minHeight: scaleSize(50),
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1
  },
  textColumn: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD
  },
  note: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR
  },
  // 44 points tall, the smallest target a thumb can be asked to hit reliably.
  // It was 30, and it removed a corner on the first tap with no way back.
  undoButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  undoLabel: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginRight: 5,
    color: Colors.TEXT_LIGHT,
  }

})
