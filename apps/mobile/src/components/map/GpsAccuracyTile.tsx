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
  const lastFixAt = useSelector((state: RootState) => state.gpsState.last_fix_at);
  const accuracyAuthorization = useSelector((state: RootState) => state.gpsState.accuracy_authorization);
  const servicesEnabled = useSelector((state: RootState) => state.gpsState.services_enabled);
  const showModal = () => {
    showModalInfo(true);
  };

  // Until a fix lands there is no accuracy to report. Showing the raw 0 here
  // read as a perfect sub-metre fix, which is the opposite of the truth.
  const hasFix = lastFixAt !== null;

  const getState = () => {
    if (!servicesEnabled) return { color: Colors.LIGHT_RED, label: 'Off' };
    // Approximate location is a Settings choice that caps accuracy at km scale.
    // No amount of precision we ask for can override it, so name it instead of
    // rendering the resulting kilometre figure as a GPS reading.
    if (accuracyAuthorization === 'reduced') return { color: Colors.LIGHT_RED, label: 'Approx.' };
    if (!hasFix) return { color: Colors.GRAY_LIGHTEST, label: '--' };
    if (accuracy < 10) return { color: Colors.NEW_PRIMARY, label: `${accuracy.toFixed(0)} m` };
    if (accuracy < 30) return { color: Colors.LIGHT_AMBER, label: `${accuracy.toFixed(0)} m` };
    return { color: Colors.LIGHT_RED, label: `${accuracy.toFixed(0)} m` };
  };

  const activeState = getState();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.wrapper, { backgroundColor: activeState.color + '1A' }]} onPress={showModal}>
        <GpsIcon style={styles.iconWrapper} fill={activeState.color} />
        <Text style={styles.boldText}>
          GPS <Text style={styles.lightText}>{activeState.label}</Text>
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