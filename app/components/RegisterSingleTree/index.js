import React, { useContext, useEffect, useState } from 'react';
import { BackHandler, Linking, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { Colors } from '_styles';
import { bugsnag } from '_utils';
import { InventoryContext } from '../../reducers/inventory';
import { addLocateTree, getInventory, updateLastScreen } from '../../repositories/inventory';
import distanceCalculator from '../../utils/distanceCalculator';
import { INCOMPLETE_INVENTORY } from '../../utils/inventoryStatuses';
import AlertModal from '../Common/AlertModal';
import ImageCapturing from '../Common/ImageCapturing';
import MapMarking from './MapMarking';

const IS_ANDROID = Platform.OS === 'android';

const RegisterSingleTree = ({ navigation }) => {
  let askPermission = true;
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('MapMarking');
  const [isGranted, setIsGranted] = useState(false);
  const [isPermissionDeniedAlertShow, setIsPermissionDeniedAlertShow] = useState(false);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);
  // const [askPermission, setAskPermission] = useState(true);
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      getInventory({ inventoryID: inventoryState.inventoryID }).then((InventoryData) => {
        if (InventoryData.status === INCOMPLETE_INVENTORY) {
          let data = {
            inventory_id: inventoryState.inventoryID,
            last_screen: 'RegisterSingleTree',
          };
          updateLastScreen(data);
          console.log(askPermission, isPermissionDeniedAlertShow, 'PermissionInfo');
          if (askPermission) {
            permission();
            console.log(InventoryData.polygons[0], 'InventoryData.polygons[0]');
            if (isGranted && InventoryData.polygons[0]) {
              Geolocation.getCurrentPosition((position) => {
                let distanceInMeters =
                  distanceCalculator(
                    position.coords.latitude,
                    position.coords.longitude,
                    InventoryData.polygons[0].coordinates[0].latitude,
                    InventoryData.polygons[0].coordinates[0].longitude,
                    'K',
                  ) * 1000;
                if (distanceInMeters && distanceInMeters < 100) {
                  //set onsite
                  addLocateTree({
                    inventory_id: inventoryState.inventoryID,
                    locate_tree: 'on-site',
                  });
                  updateScreenState('ImageCapturing');
                } else {
                  //set offsite
                  addLocateTree({
                    inventory_id: inventoryState.inventoryID,
                    locate_tree: 'off-site',
                  });
                  navigation.navigate('SelectSpecies');
                }
              });
              // setAskPermission(true);
              askPermission = true;
            }
          }
        }
      });
    });
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
      unsubscribe();
    };
  }, [inventoryState, isGranted, navigation]);

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  const updateScreenState = (state) => setScreenState(state);

  const permission = async () => {
    if (IS_ANDROID) {
      try {
        console.log('Asking permission');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(granted, 'granted');
        switch (granted) {
          case PermissionsAndroid.RESULTS.GRANTED:
            console.log('Permission granted');
            setIsGranted(true);
            return true;
          case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            console.log('Permission Blocked');
            setIsPermissionBlockedAlertShow(true);
            return false;
          case PermissionsAndroid.RESULTS.DENIED:
            console.log('Permission Denied');
            setIsPermissionDeniedAlertShow(true);
            return false;
        }
      } catch (err) {
        bugsnag.notify(err);
        console.log(err, 'Permission error');
        return false;
      }
    } else {
      setIsGranted(true);
    }
  };

  const PermissionDeniedAlert = () => {
    return (
      <AlertModal
        visible={isPermissionDeniedAlertShow}
        heading={'Permission Denied'}
        message={'You need to give location permission to register on-site tree'}
        primaryBtnText={'Ok'}
        secondaryBtnText={'Back'}
        onPressPrimaryBtn={() => {
          setIsPermissionDeniedAlertShow(false);
          permission();
        }}
        onPressSecondaryBtn={() => {
          // setAskPermission(false);
          askPermission = false;
          setIsPermissionDeniedAlertShow(false);
          navigation.navigate('TreeInventory');
        }}
      />
    );
  };

  const PermissionBlockedAlert = () => {
    return (
      <AlertModal
        visible={isPermissionBlockedAlertShow}
        heading={'Permission Blocked'}
        message={'You need to give location permission to register on-site tree'}
        primaryBtnText={'Open Settings'}
        secondaryBtnText={'Back'}
        onPressPrimaryBtn={() => {
          setIsPermissionBlockedAlertShow(false);
          hardBackHandler();
          Linking.openSettings();
        }}
        onPressSecondaryBtn={() => {
          setIsPermissionBlockedAlertShow(false);
          hardBackHandler();
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' &&
        (isGranted ? (
          <MapMarking updateScreenState={updateScreenState} inventoryState={inventoryState} />
        ) : isPermissionDeniedAlertShow ? (
          <PermissionDeniedAlert />
        ) : (
          <PermissionBlockedAlert />
        ))}

      {screenState == 'ImageCapturing' && (
        <ImageCapturing updateScreenState={updateScreenState} inventoryType="single" />
      )}
    </View>
  );
};
export default RegisterSingleTree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});
