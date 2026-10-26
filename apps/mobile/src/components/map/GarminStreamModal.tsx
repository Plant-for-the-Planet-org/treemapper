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
import {
  GarminQuality,
  intervalLabel,
  qualityDescription,
  qualityHint,
  USABLE_QUALITY,
} from 'src/garmin'
import { GarminStreamState } from 'src/hooks/useGarminStream'

interface Props {
  visible: boolean
  state: GarminStreamState
  onClose: () => void
  /** Record the position currently on screen against the tree. */
  onUsePoint: () => void
  onRetry: () => void
  /** Ask the device to stream at this interval instead. */
  onRetune: (intervalMs: number) => void
  onInstallWatchApp: () => void
  /** iPhone only: open Garmin Connect so the user can pick a device. */
  onChooseDevice: () => void
}

/**
 * What "stream slower" asks for.
 *
 * Two seconds rather than something cleverer because the point is to halve
 * the traffic, not to find an optimum. A link that cannot hold 1 Hz through
 * Garmin Connect is usually not close to holding it.
 */
const SLOWER_INTERVAL_MS = 2000

/**
 * How many lost points before offering to slow down.
 *
 * One or two are ordinary on a Bluetooth link relayed through another app.
 * Five in one session is a pattern, and the fix is a message rather than a
 * new build of either side.
 */
const LOSS_BEFORE_OFFER = 5

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

/**
 * The Garmin capture screen.
 *
 * Version 2 of the protocol turned the link into a stream, and that changed
 * what this has to be. There is no request and no answer to wait for: the
 * position is simply here, replaced every second, and the only decision left
 * is the user's. So the screen is a live readout with one button, not a
 * progress dialog.
 *
 * Two pieces of that are load-bearing.
 *
 * **The liveness line is always shown while streaming, not only when
 * something breaks.** A badge that only appears on failure is right for a
 * screen somebody watches while pressing a button. It is wrong here: the
 * device sits on a stump and a link that quietly died looks exactly like one
 * that is working, because the last coordinate stays on screen either way. So
 * the screen states its condition both ways and says how long it has been
 * quiet. The watch app made the same reversal for the same reason.
 *
 * **Below usable quality the button still works.** Under canopy 2 may be the
 * best reading available all day. The screen warns and changes colour; it
 * does not decide.
 */
const GarminStreamModal = (props: Props) => {
  const {
    visible,
    state,
    onClose,
    onUsePoint,
    onRetry,
    onRetune,
    onInstallWatchApp,
    onChooseDevice,
  } = props
  const {
    phase,
    quality,
    point,
    elapsed,
    deviceName,
    multiBand,
    intervalMs,
    sinceLastPoint,
    healthy,
    missed,
    dropped,
  } = state

  const busy = phase === 'connecting' || phase === 'greeting' || phase === 'waking'

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
      case 'streaming':
        return 'Live position'
      case 'paused':
        return 'Paused on your Garmin'
      case 'blocked':
        // `needs_device` is not a failure: iOS has simply never been told
        // which device this app may read. Titling it as a fault would send
        // the user off to check Bluetooth and pairings that are all fine.
        return state.blocker === 'needs_device'
          ? 'Choose your Garmin'
          : 'Cannot reach your Garmin'
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
      case 'paused':
        // The phone genuinely cannot undo this, so the only useful thing to
        // say is who can.
        return 'Press START on your Garmin to resume the stream. TreeMapper cannot resume it from here.'
      case 'streaming':
        // Normally nothing. It carries the reason when the device drops out
        // of range mid-session: the readout stays, so the explanation has to
        // sit beside it rather than replace it.
        return state.message
      default:
        return state.message
    }
  })()

  /**
   * The one line that says whether the stream is alive.
   *
   * While points are landing it is reassurance and nothing more. When they
   * stop it is the only thing on screen that has changed, which is the whole
   * reason it is always there.
   */
  const liveness = (() => {
    if (healthy) {
      return `Updating ${intervalLabel(intervalMs)}`
    }
    if (sinceLastPoint === null) {
      return 'Waiting for the first position'
    }
    return `No update for ${Math.round(sinceLastPoint / 1000)}s`
  })()

  const belowBar = quality < USABLE_QUALITY

  // Retrying a missing Garmin Connect or an uninstalled device app achieves
  // nothing until the user has gone and fixed it. Retrying a device that was
  // out of range, or a pairing they have just made, is exactly right.
  const canRetry =
    phase === 'failed' ||
    state.blocker === 'device_offline' ||
    state.blocker === 'no_device'

  // `dropped` is what the device could not hand to its radio and `missed` is
  // what it sent that never arrived. Either one says the same thing, so they
  // are read together: this interval is too fast for this link.
  const losingPoints =
    intervalMs < SLOWER_INTERVAL_MS && missed + dropped >= LOSS_BEFORE_OFFER

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
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
          {busy && <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />}
        </View>

        {point ? (
          <View style={styles.resultBlock}>
            <Text style={styles.coordinate}>
              {formatCoordinate(point.latitude)},{' '}
              {formatCoordinate(point.longitude)}
            </Text>
            <View style={styles.resultMetaRow}>
              <QualityMeter quality={point.quality} />
              <Text style={styles.resultMeta}>
                {/* The step, not just the word. This is the coordinate the
                    user is about to commit to, and Connect IQ gives no
                    accuracy in metres to show instead, so the ladder position
                    is the only scale there is. */}
                {qualityDescription(point.quality)}
                {point.altitude !== null
                  ? ` · ${Math.round(point.altitude)} m`
                  : ''}
              </Text>
            </View>
            <View style={styles.livenessRow}>
              <View
                style={[
                  styles.livenessDot,
                  healthy ? styles.livenessDotOn : styles.livenessDotOff,
                ]}
              />
              <Text
                style={[
                  styles.liveness,
                  !healthy && styles.livenessWarn,
                ]}>
                {liveness}
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
            {(phase === 'acquiring' || phase === 'waking') && (
              <View style={styles.statusRow}>
                {phase !== 'waking' && (
                  <>
                    <QualityMeter quality={quality} />
                    <Text style={styles.statusText}>
                      {qualityDescription(quality)}
                    </Text>
                  </>
                )}
                <View style={styles.spacer} />
                <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
              </View>
            )}
          </>
        )}

        {/* The detail line sits below the readout once there is one, so the
            coordinate stays the first thing read. */}
        {!!point && !!detail && <Text style={styles.detail}>{detail}</Text>}

        {!!point && belowBar && (
          <Text style={styles.warn}>{qualityHint(point.quality)}</Text>
        )}

        {losingPoints && (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => onRetune(SLOWER_INTERVAL_MS)}>
            <Text style={styles.linkLabel}>
              Losing positions. Stream every 2 s instead.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.ghostButton} onPress={onClose}>
            <Text style={styles.ghostLabel}>Cancel</Text>
          </TouchableOpacity>

          {!!point && (
            <TouchableOpacity
              style={belowBar ? styles.warnButton : styles.primaryButton}
              onPress={onUsePoint}>
              <Text style={styles.primaryLabel}>
                {belowBar ? 'Use anyway' : 'Use this position'}
              </Text>
            </TouchableOpacity>
          )}

          {canRetry && (
            <TouchableOpacity
              style={point ? styles.ghostButton : styles.primaryButton}
              onPress={onRetry}>
              <Text style={point ? styles.ghostLabel : styles.primaryLabel}>
                Try again
              </Text>
            </TouchableOpacity>
          )}

          {phase === 'blocked' && state.blocker === 'app_missing' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onInstallWatchApp}>
              <Text style={styles.primaryLabel}>Open store</Text>
            </TouchableOpacity>
          )}

          {phase === 'blocked' && state.blocker === 'needs_device' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onChooseDevice}>
              <Text style={styles.primaryLabel}>Choose device</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

export default GarminStreamModal

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
  warn: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_13,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.BACKDROP_RED,
    marginTop: 10,
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
  livenessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  livenessDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  livenessDotOn: {
    backgroundColor: Colors.NEW_PRIMARY,
  },
  livenessDotOff: {
    backgroundColor: Colors.BACKDROP_RED,
  },
  liveness: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.GRAY_LIGHTEST,
  },
  livenessWarn: {
    color: Colors.BACKDROP_RED,
  },
  linkRow: {
    marginTop: 12,
  },
  linkLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_13,
    color: Colors.NEW_PRIMARY,
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
