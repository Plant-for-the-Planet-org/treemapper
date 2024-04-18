import {StyleSheet, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import {Colors, Typography} from 'src/utils/constants'
import * as Location from 'expo-location'
import {Text} from 'react-native'
import GPSICON from 'assets/images/svg/GPSIcon.svg'

type AccuracyType = 'high' | 'medium' | 'low'

const GpsAccuracyTile = () => {
  const [accuracy, setAccuracy] = useState<AccuracyType>('high')
  useEffect(() => {
    (async () => {
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000, // Time between each update in milliseconds (5000 = 5 seconds)
          distanceInterval: 10, // Minimum distance between updates in meters
        },
        location => {
          if (location && location.coords && location.coords.accuracy < 10) {
            setAccuracy('high')
          } else if (
            location &&
            location.coords &&
            location.coords.accuracy < 30
          ) {
            setAccuracy('medium')
          } else {
            setAccuracy('low')
          }
        },
      )

      return () => {
        watcher.remove() // Clean up the watcher when component unmounts
      }
    })()
  }, [])

  const activeStyle = {
    bgColor:
      accuracy === 'high'
        ? Colors.NEW_PRIMARY + '1A'
        : accuracy === 'medium'
          ? Colors.LIGHT_AMBER + '1A'
          : Colors.LIGHT_RED + '1A',
    iconColor:
      accuracy === 'high'
        ? Colors.NEW_PRIMARY
        : accuracy === 'medium'
          ? Colors.LIGHT_AMBER
          : Colors.LIGHT_RED,
  }

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, {backgroundColor: activeStyle.bgColor}]}>
        <GPSICON style={styles.iconWrapper} fill={Colors.NEW_PRIMARY}/>
        <Text style={styles.boldText}>
          GPS <Text style={styles.lightText}>5.8m</Text>
        </Text>
      </View>
    </View>
  )
}

export default GpsAccuracyTile

const styles = StyleSheet.create({
  container: {
    width: '40%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '80%',
    height: '70%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  boldText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  lightText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  iconWrapper: {
    marginRight: 7,
  },
})
