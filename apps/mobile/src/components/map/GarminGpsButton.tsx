import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import GarminDeviceIcon from 'assets/images/svg/GarminDeviceIcon.svg'
import { Colors } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { GarminPoint, isGarminAvailable } from 'src/garmin'
import useGarminFix from 'src/hooks/useGarminFix'
import GarminFixModal from './GarminFixModal'

interface Props {
  /**
   * Called with the point the device sent, as [lng, lat] to match maplibre and
   * the GeoJSON this app stores, plus the raw point for anything the screen
   * wants to say about quality.
   */
  onFix: (coordinates: [number, number], point: GarminPoint) => void
  /** Distance from the bottom of the map, so it stacks with the other tiles. */
  bottom?: number
  /** Where the user is, [lng, lat]. Used by the development mock only. */
  origin?: [number, number] | null
  disabled?: boolean
}

/** Long enough to read the coordinate that landed, short enough to not nag. */
const CLOSE_DELAY_MS = 900

/**
 * The Garmin entry point, drawn on every map that asks for a coordinate.
 *
 * It renders nothing at all when there is no way to reach a device, rather than
 * showing a button that explains itself only after being pressed. On a release
 * build that means it is invisible until the native Connect IQ module ships.
 */
const GarminGpsButton = (props: Props) => {
  const { onFix, bottom, origin, disabled } = props
  const [visible, setVisible] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePoint = useCallback(
    (point: GarminPoint) => {
      onFix([point.longitude, point.latitude], point)
      closeTimer.current = setTimeout(() => setVisible(false), CLOSE_DELAY_MS)
    },
    [onFix],
  )

  const { state, start, stop, retry, askForPoint, installWatchApp } =
    useGarminFix({ origin, onPoint: handlePoint })

  useEffect(
    () => () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
      }
    },
    [],
  )

  const open = () => {
    setVisible(true)
    start()
  }

  const close = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setVisible(false)
    stop()
  }

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
      <GarminFixModal
        visible={visible}
        state={state}
        onClose={close}
        onTakePoint={askForPoint}
        onRetry={retry}
        onInstallWatchApp={installWatchApp}
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
