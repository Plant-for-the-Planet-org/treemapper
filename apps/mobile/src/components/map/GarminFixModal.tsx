import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Modal from 'react-native-modal'
import GarminDeviceIcon from 'assets/images/svg/GarminDeviceIcon.svg'
import { Colors, Mixins, Typography } from 'src/utils/constants'
import { GarminQuality, qualityHint, qualityLabel } from 'src/garmin'
import { GarminFixState } from 'src/hooks/useGarminFix'

interface Props {
  visible: boolean
  state: GarminFixState
  onClose: () => void
  onTakePoint: () => void
  onRetry: () => void
  onInstallWatchApp: () => void
}

const QUALITY_COLOR: Record<number, string> = {
  [GarminQuality.NOT_AVAILABLE]: Colors.GRAY_BACKDROP,
  [GarminQuality.LAST_KNOWN]: Colors.BACKDROP_RED,
  [GarminQuality.POOR]: Colors.BACKDROP_RED,
  [GarminQuality.USABLE]: Colors.NEW_PRIMARY,
  [GarminQuality.GOOD]: Colors.NEW_PRIMARY,
}

/** Four bars, because Connect IQ reports a 0-4 enum and nothing finer. */
const QualityMeter = ({ quality }: { quality: GarminQuality }) => (
  <View style={styles.meter}>
    {[1, 2, 3, 4].map(step => (
      <View
        key={step}
        style={[
          styles.meterBar,
          { height: 8 + step * 5 },
          quality >= step
            ? { backgroundColor: QUALITY_COLOR[quality] }
            : styles.meterBarOff,
        ]}
      />
    ))}
  </View>
)

const formatCoordinate = (value: number) => value.toFixed(6)

const formatElapsed = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const GarminFixModal = (props: Props) => {
  const { visible, state, onClose, onTakePoint, onRetry, onInstallWatchApp } =
    props
  const { phase, quality, point, elapsed, deviceName, multiBand } = state

  const busy =
    phase === 'connecting' ||
    phase === 'greeting' ||
    phase === 'waking' ||
    phase === 'requesting'

  const title = (() => {
    switch (phase) {
      case 'connecting':
        return 'Looking for your Garmin'
      case 'greeting':
        return 'Saying hello'
      case 'waking':
        return 'Starting TreeMapper GPS'
      case 'acquiring':
        return 'Finding satellites'
      case 'ready':
        return 'Ready'
      case 'requesting':
        return 'Asking your Garmin'
      case 'received':
        return 'Point received'
      case 'blocked':
        return 'Cannot reach your Garmin'
      case 'failed':
        return 'That did not work'
      default:
        return 'Garmin device'
    }
  })()

  const detail = (() => {
    switch (phase) {
      case 'connecting':
        return 'Checking Garmin Connect for a paired device.'
      case 'greeting':
        return 'Waiting for TreeMapper GPS to answer.'
      case 'waking':
        // Worth saying out loud: the device app has to be in the foreground to
        // produce a fresh fix, so a cold start costs the whole acquisition.
        return 'Keep TreeMapper GPS open on the device once it starts. A first fix in the open takes a few seconds, under tree cover it can take a minute.'
      case 'acquiring':
        return qualityHint(quality)
      case 'ready':
        return qualityHint(quality)
      case 'requesting':
        return 'Your Garmin is sending the point.'
      case 'received':
        return ''
      default:
        return state.message
    }
  })()

  // Below usable quality the device is never blocked from sending: under canopy
  // 2 may be the best reading available all day, so the choice is the user's.
  const canTakeAnyway =
    phase === 'acquiring' && quality >= GarminQuality.LAST_KNOWN

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={phase === 'received' ? undefined : onClose}
      onBackButtonPress={onClose}
      style={styles.modal}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBadge}>
            <GarminDeviceIcon
              width={22}
              height={22}
              fill={phase === 'blocked' ? Colors.GRAY_LIGHTEST : Colors.NEW_PRIMARY}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {!!deviceName && phase !== 'blocked' && (
              <Text style={styles.subtitle}>
                {deviceName}
                {multiBand ? ' · multi-band' : ''}
              </Text>
            )}
          </View>
          {busy && (
            <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />
          )}
        </View>

        {phase === 'received' && point ? (
          <View style={styles.resultBlock}>
            <Text style={styles.coordinate}>
              {formatCoordinate(point.latitude)},{' '}
              {formatCoordinate(point.longitude)}
            </Text>
            <View style={styles.resultMetaRow}>
              <QualityMeter quality={point.quality} />
              <Text style={styles.resultMeta}>
                {qualityLabel(point.quality)}
                {point.altitude !== null
                  ? ` · ${Math.round(point.altitude)} m`
                  : ''}
                {point.source === 'watch' ? ' · sent from the device' : ''}
              </Text>
            </View>
          </View>
        ) : (
          <>
            {!!detail && <Text style={styles.detail}>{detail}</Text>}

            {/* No meter while waking: the receiver is not running yet, so the
                only honest reading is "No fix", and showing that next to a
                progress message reads as a fault rather than a wait. The
                elapsed counter is the thing that is actually moving. */}
            {(phase === 'acquiring' || phase === 'ready' || phase === 'waking') && (
              <View style={styles.statusRow}>
                {phase !== 'waking' && (
                  <>
                    <QualityMeter quality={quality} />
                    <Text style={styles.statusText}>
                      {qualityLabel(quality)}
                    </Text>
                  </>
                )}
                <View style={styles.spacer} />
                <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
              </View>
            )}

            {(phase === 'acquiring' || phase === 'ready') && (
              <Text style={styles.hint}>
                You can also press START on the device to send a point.
              </Text>
            )}
          </>
        )}

        <View style={styles.actions}>
          {phase !== 'received' && (
            <TouchableOpacity style={styles.ghostButton} onPress={onClose}>
              <Text style={styles.ghostLabel}>Cancel</Text>
            </TouchableOpacity>
          )}

          {phase === 'ready' && (
            <TouchableOpacity style={styles.primaryButton} onPress={onTakePoint}>
              <Text style={styles.primaryLabel}>Take point</Text>
            </TouchableOpacity>
          )}

          {canTakeAnyway && (
            <TouchableOpacity style={styles.warnButton} onPress={onTakePoint}>
              <Text style={styles.primaryLabel}>Take point anyway</Text>
            </TouchableOpacity>
          )}

          {phase === 'failed' && (
            <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
              <Text style={styles.primaryLabel}>Try again</Text>
            </TouchableOpacity>
          )}

          {phase === 'blocked' && state.blocker === 'app_missing' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onInstallWatchApp}>
              <Text style={styles.primaryLabel}>Open store</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

export default GarminFixModal

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  card: {
    width: '88%',
    maxWidth: Mixins.MAX_DIALOG_WIDTH,
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.BACKDROP_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_17,
    color: Colors.DARK_TEXT,
  },
  subtitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.GRAY_LIGHTEST,
    marginTop: 2,
  },
  detail: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.TEXT_COLOR,
    marginTop: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.DARK_TEXT,
    marginLeft: 10,
  },
  spacer: {
    flex: 1,
  },
  elapsed: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_13,
    color: Colors.GRAY_LIGHTEST,
  },
  hint: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.GRAY_LIGHTEST,
    marginTop: 10,
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
  },
  meterBar: {
    width: 5,
    borderRadius: 3,
    marginRight: 3,
  },
  meterBarOff: {
    backgroundColor: Colors.GRAY_LIGHT,
  },
  resultBlock: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  coordinate: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.DARK_TEXT,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  resultMeta: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_13,
    color: Colors.TEXT_COLOR,
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
  },
  ghostButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ghostLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.NEW_PRIMARY,
    marginLeft: 8,
  },
  warnButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.BACKDROP_RED,
    marginLeft: 8,
  },
  primaryLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.WHITE,
  },
})
