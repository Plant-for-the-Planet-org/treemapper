import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'

interface MapZoomScaleProps {
  mapRef: React.RefObject<MapLibreGL.MapView>
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  style?: object
  padTop?: number
}

const MapZoomScale = ({ mapRef, position = 'top-right', style, padTop }: MapZoomScaleProps) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(async () => {
      if (mapRef?.current) {
        try {
          const zoom = await mapRef.current.getZoom()
          setZoomLevel(Math.round(zoom * 10) / 10)
        } catch (error) {
          // Silent fail - map might not be ready
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [mapRef])

  const getZoomBarWidth = () => {
    // Zoom levels typically range from 0 to 22
    // Calculate percentage for visual indicator
    const percentage = Math.min((zoomLevel / 22) * 100, 100)
    return `${percentage}%`
  }

  const getPositionStyles = (padTop) => {
    switch (position) {
      case 'top-left':
        return { top: scaleSize(padTop), left: scaleSize(10) }
      case 'bottom-right':
        return { bottom: scaleSize(10), right: scaleSize(10) }
      case 'bottom-left':
        return { bottom: scaleSize(10), left: scaleSize(10) }
      case 'top-right':
      default:
        return { top: scaleSize(10), right: scaleSize(10) }
    }
  }

  return (
    <View style={[styles.container, getPositionStyles(padTop), style]}>
      <View style={styles.content}>
        <Text style={styles.label}>Zoom</Text>
        <Text style={styles.zoomValue}>{zoomLevel.toFixed(1)}</Text>
      </View>
      <View style={styles.scaleBarContainer}>
        <View style={styles.scaleBarBackground}>
          <View style={[styles.scaleBarFill, { width: getZoomBarWidth() }]} />
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>0</Text>
          <Text style={styles.scaleLabel}>22</Text>
        </View>
      </View>
    </View>
  )
}

export default MapZoomScale

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: scaleSize(4),
    paddingHorizontal:scaleSize(6),
    shadowColor: Colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: scaleSize(100),
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSize(8),
  },
  label: {
    fontSize: scaleFont(12),
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  zoomValue: {
    fontSize: scaleFont(16),
    color: Colors.PRIMARY_DARK,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  scaleBarContainer: {
    width: '100%',
  },
  scaleBarBackground: {
    height: scaleSize(6),
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: scaleSize(3),
    overflow: 'hidden',
  },
  scaleBarFill: {
    height: '100%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: scaleSize(3),
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(4),
  },
  scaleLabel: {
    fontSize: scaleFont(9),
    color: Colors.TEXT_LIGHT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
})
