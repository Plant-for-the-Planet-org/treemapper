import React, { useCallback, useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import GarminDeviceIcon from 'assets/images/svg/GarminDeviceIcon.svg'
import { Colors } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { GarminPoint, isGarminAvailable } from 'src/garmin'
import useGarminStream from 'src/hooks/useGarminStream'
import GarminStreamModal from './GarminStreamModal'

interface Props {
  /**
   * Called with the position the user chose, as [lng, lat] to match maplibre
   * and the GeoJSON this app stores, plus the raw point and the device it came
   * from.
   *
   * A screen that saves to an intervention is expected to record that
   * provenance, because once the coordinate is stored it is indistinguishable
   * from a tapped one. See `recordGarminFixMetaData`.
   */
  onFix: (
    coordinates: [number, number],
    point: GarminPoint,
    deviceName: string | null,
  ) => void
  /** Distance from the bottom of the map, so it stacks with the other tiles. */
  bottom?: number
  /** Where the user is, [lng, lat]. Used by the development mock only. */
  origin?: [number, number] | null
  disabled?: boolean
}

/**
 * The Garmin entry point, drawn on every map that asks for a coordinate.
 *
 * It renders nothing at all when there is no way to reach a device, rather
 * than showing a button that explains itself only after being pressed. Both
 * platforms have a native link now, so in a release build that means a phone
 * whose build simply does not carry the module.
 *
 * The device streams its position on its own once the modal has greeted it, so
 * nothing here asks for a point. The modal shows what is arriving and this
 * component records whichever position was on screen when the user said so.
 * Closing straight after is deliberate: the stream costs the device's radio
 * every second, and leaving it running behind a dismissed modal would spend
 * battery on a screen nobody is reading.
 */
const GarminGpsButton = (props: Props) => {
  const { onFix, bottom, origin, disabled } = props
  const [visible, setVisible] = useState(false)

  const { state, start, stop, retry, retune, installWatchApp, chooseDevice } =
    useGarminStream({ origin })

  const open = () => {
    setVisible(true)
    start()
  }

  const close = useCallback(() => {
    setVisible(false)
    stop()
  }, [stop])

  const usePoint = useCallback(() => {
    const point = state.point
    if (!point) {
      return
    }
    onFix([point.longitude, point.latitude], point, state.deviceName)
    close()
  }, [close, onFix, state.deviceName, state.point])

  if (!isGarminAvailable()) {
    return null
  }

  // A fragment, not a wrapper View: these tiles are absolutely positioned
  // against the map container, and a wrapper would become the containing block
  // and collapse to zero height, taking the offsets with it.
  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { bottom: bottom ?? scaleSize(260) },
          disabled && styles.disabled,
        ]}
        disabled={disabled}
        accessibilityLabel="Get the location from a Garmin device"
        onPress={open}>
        <GarminDeviceIcon width={22} height={22} fill={Colors.DARK_TEXT} />
      </TouchableOpacity>
      <GarminStreamModal
        visible={visible}
        state={state}
        onClose={close}
        onUsePoint={usePoint}
        onRetry={retry}
        onRetune={retune}
        onInstallWatchApp={installWatchApp}
        onChooseDevice={chooseDevice}
      />
    </>
  )
}

export default GarminGpsButton

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    right: '9%',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
})
