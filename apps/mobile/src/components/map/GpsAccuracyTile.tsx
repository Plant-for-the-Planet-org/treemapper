import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { Colors, Typography } from 'src/utils/constants';
import GpsIcon from 'assets/images/svg/GPSIcon.svg';

interface Props {
  showModalInfo: (b: boolean) => void;
}

const GpsAccuracyTile = (props: Props) => {
  const { showModalInfo } = props;
  // Read accuracy from the single source of truth (gps slice, written by
  // useLocationPermission). The tile no longer owns its own native watcher --
  // a leaked, uncleaned watchPositionAsync here was racing the other location
  // consumers on mount and crashing Android.
  const accuracy = useSelector((state: RootState) => state.gpsState.accuracy);
  const showModal = () => {
    showModalInfo(true);
  };

  // Define variables for colors based on accuracy
const getBackgroundColor = (accuracy) => {
  if (accuracy < 10) {
    return Colors.NEW_PRIMARY + '1A';
  } else if (accuracy < 30) {
    return Colors.LIGHT_AMBER + '1A';
  } else {
    return Colors.LIGHT_RED + '1A';
  }
};

const getIconColor = (accuracy) => {
  if (accuracy < 10) {
    return Colors.NEW_PRIMARY;
  } else if (accuracy < 30) {
    return Colors.LIGHT_AMBER;
  } else {
    return Colors.LIGHT_RED;
  }
};

// Use the functions to set the styles
const activeStyle = {
  bgColor: getBackgroundColor(accuracy),
  iconColor: getIconColor(accuracy),
};
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.wrapper, { backgroundColor: activeStyle.bgColor }]} onPress={showModal}>
        <GpsIcon style={styles.iconWrapper} fill={activeStyle.iconColor} />
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
    width: '85%',
    height: '70%',
    borderRadius: 14,
    marginRight: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },
  boldText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 16
  },
  lightText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  iconWrapper: {},
});