import Geolocation from 'react-native-geolocation-service';
import { BackHandler, StyleSheet, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { Loader } from '../Common';
import { Colors } from '../../styles';
import { bugsnag } from '../../utils';
import MapMarking from '../Common/MapMarking';
import ImageCapturing from '../Common/ImageCapturing';
import {
  PermissionBlockedAlert,
  PermissionDeniedAlert,
} from '../Common/MapMarking/LocationPermissionAlerts';
import { InventoryContext } from '../../reducers/inventory';
import { locationPermission } from '../../utils/permissions';
import distanceCalculator from '../../utils/distanceCalculator';
import { INCOMPLETE, OFF_SITE, ON_SITE, SINGLE } from '../../utils/inventoryConstants';
import { addLocateTree, getInventory, updateLastScreen } from '../../repositories/inventory';

const RegisterSingleTree = () => {
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('');
  const [isGranted, setIsGranted] = useState(false);
  const [isPermissionDeniedAlertShow, setIsPermissionDeniedAlertShow] = useState(false);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    setTimeout(setUpState,100);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
    };
  }, [inventoryState, isGranted, navigation]);


  const setUpState = async () => {
    setScreenState('');
    try {
      if (inventoryState.inventoryID) {
        await handleInventoryState();
      } else {
        await handleLocationPermission();
      }
    } catch (err) {
      checkPermissionAlert(err);
    }
  };
  
  const handleInventoryState = async () => {
    const InventoryData = await getInventory({ inventoryID: inventoryState.inventoryID });
    if (InventoryData.status === INCOMPLETE) {
      await handleIncompleteInventory(InventoryData);
    }else{
      await handleLocationPermission();
    }
  };
  
  const handleLocationPermission = async () => {
    await locationPermission();
    setIsGranted(true);
    setScreenState('MapMarking');
  };
  

  const handleIncompleteInventory = async (InventoryData: { polygons: any[]; }) => {
    let data = {
      inventory_id: inventoryState.inventoryID,
      lastScreen: 'RegisterSingleTree',
    };
    updateLastScreen(data);
  
    try {
      const granted = await locationPermission();
      setIsGranted(true);
  
      if (granted && InventoryData.polygons[0]) {
        await handleGeolocation(InventoryData);
      } else {
        setScreenState('MapMarking');
      }
    } catch (err) {
      checkPermissionAlert(err);
    }
  };
  
  const handleGeolocation = async (InventoryData: { polygons: { coordinates: { longitude: number; }[]; }[]; }) => {
    try {
      const position = await getCurrentPosition(); // Assuming this is a wrapper around Geolocation.getCurrentPosition
      const distanceInMeters = distanceCalculator(
        [position.coords.latitude, position.coords.longitude],
        [
          InventoryData.polygons[0].coordinates[0].latitude,
          InventoryData.polygons[0].coordinates[0].longitude,
        ],
        'meters',
      );
  
      if (distanceInMeters < 100) {
        // Set onsite
        addLocateTree({
          inventory_id: inventoryState.inventoryID,
          locateTree: ON_SITE,
        });
        updateScreenState('ImageCapturing');
      } else {
        // Set offsite
        addLocateTree({
          inventory_id: inventoryState.inventoryID,
          locateTree: OFF_SITE,
        });
        updateScreenState('MapMarking');
        navigation.navigate('SelectSpecies');
      }
    } catch (err) {
      console.error(err);
      // Handle geolocation error
    }
  };
  
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 20000,
          accuracy: {
            android: 'high',
            ios: 'bestForNavigation',
          },
        },
      );
    });
  };


  const checkPermissionAlert = (err: any) => {
    setScreenState('MapMarking');
    setIsGranted(false);
    if (err?.message == 'blocked') {
      setIsPermissionBlockedAlertShow(true);
    } else if (err?.message == 'denied') {
      setIsPermissionDeniedAlertShow(true);
    } else {
      bugsnag.notify(err);
    }
  };

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  // resets the navigation stack with MainScreen => TreeInventory
  const resetRouteStack = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'BottomTab' },
        ],
      }),
    );
  };

  const updateScreenState = (state: string) => setScreenState(state);

  return (
    <View style={styles.container}>
      {screenState === 'MapMarking' &&
        (isGranted ? (
          <MapMarking updateScreenState={updateScreenState} treeType={SINGLE} />
        ) : isPermissionDeniedAlertShow ? (
          <PermissionDeniedAlert
            isPermissionDeniedAlertShow={isPermissionDeniedAlertShow}
            setIsPermissionDeniedAlertShow={setIsPermissionDeniedAlertShow}
            onPressPrimaryBtn={() =>
              locationPermission().catch((err: any) => checkPermissionAlert(err))
            }
            onPressSecondaryBtn={resetRouteStack}
          />
        ) : (
          <PermissionBlockedAlert
            isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
            setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
            onPressPrimaryBtn={resetRouteStack}
            onPressSecondaryBtn={resetRouteStack}
          />
        ))}

      {screenState === 'ImageCapturing' && (
        <ImageCapturing updateScreenState={updateScreenState} inventoryType={SINGLE} />
      )}

      {screenState === '' && <Loader isLoaderShow={true} />}
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
