import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors, Typography } from 'src/utils/constants';
import * as Location from 'expo-location';
import { Text } from 'react-native';
import GPSICON from 'assets/images/svg/GPSIcon.svg';

interface Props {
  showModalInfo: (b: boolean) => void;
}

const GpsAccuracyTile = (props: Props) => {
  const { showModalInfo } = props;
  const [accuracy, setAccuracy] = useState(0);
  const showModal = () => {
    showModalInfo(true);
  };

  useEffect(() => {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 1,
        mayShowUserSettingsDialog: true,
        timeInterval: 1000
      },
      (location) => {
        if (location && location.coords && location.coords.accuracy) {
          setAccuracy(location.coords.accuracy);
        }
      }
    );
  }, []);

  const activeStyle = {
    bgColor:
      accuracy < 10
        ? Colors.NEW_PRIMARY + '1A'
        : accuracy < 30
          ? Colors.LIGHT_AMBER + '1A'
          : Colors.LIGHT_RED + '1A',
    iconColor:
      accuracy < 10
        ? Colors.NEW_PRIMARY
        : accuracy < 30
          ? Colors.LIGHT_AMBER
          : Colors.LIGHT_RED,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.wrapper, { backgroundColor: activeStyle.bgColor }]} onPress={showModal}>
        <GPSICON style={styles.iconWrapper} fill={activeStyle.iconColor} />
        <Text style={styles.boldText}>
          GPS <Text style={styles.lightText}>{accuracy.toFixed(0)} m</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default GpsAccuracyTile;

const styles = StyleSheet.create({
  container: {
    width: '40%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '80%',
    height: '70%',
    borderRadius: 30,
    justifyContent: 'space-evenly',
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
  iconWrapper: {},
});