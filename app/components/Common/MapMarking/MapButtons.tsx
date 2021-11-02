import i18next from 'i18next';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PrimaryButton } from '../';
import { Colors } from '../../../styles';

interface IMapButtonsProps {
  location: any;
  onPressMyLocationIcon: any;
  setIsLocationAlertShow: any;
  addMarker: any;
  loader: any;
}

export default function MapButtons({
  location,
  onPressMyLocationIcon,
  setIsLocationAlertShow,
  addMarker,
  loader,
}: IMapButtonsProps) {
  return (
    <View>
      <TouchableOpacity
        onPress={() => {
          if (location) {
            onPressMyLocationIcon(location);
          } else {
            setIsLocationAlertShow(true);
          }
        }}
        style={[styles.myLocationIcon, Platform.OS === 'ios' ? { bottom: 160 } : {}]}
        accessibilityLabel="main-my-location"
        accessible={true}
        testID="main-my-location">
        <View style={Platform.OS === 'ios' && styles.myLocationIconContainer}>
          <Icon name={'my-location'} size={24} color={Colors.PLANET_BLACK} />
        </View>
      </TouchableOpacity>
      <View style={[styles.continueBtnCont, Platform.OS === 'ios' ? { bottom: 70 } : {}]}>
        <PrimaryButton
          onPress={addMarker}
          disabled={loader}
          btnText={i18next.t('label.tree_map_marking_btn')}
          style={styles.bottomBtnWith}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  myLocationIcon: {
    width: 45,
    height: 45,
    backgroundColor: Colors.WHITE,
    position: 'absolute',
    borderRadius: 100,
    right: 0,
    marginHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.TEXT_COLOR,
    bottom: 120,
  },
  myLocationIconContainer: {
    top: 1.5,
    left: 0.8,
  },
  continueBtnCont: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'transparent',
    width: '100%',
    justifyContent: 'center',
  },
  bottomBtnWith: {
    width: '90%',
  },
});
