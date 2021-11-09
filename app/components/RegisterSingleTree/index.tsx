import { CommonActions, useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { InventoryContext } from '../../reducers/inventory';
import { addLocateTree, getInventory, updateLastScreen } from '../../repositories/inventory';
import { Colors } from '../../styles';
import { bugsnag } from '../../utils';
import distanceCalculator from '../../utils/distanceCalculator';
import { INCOMPLETE, OFF_SITE, ON_SITE, SINGLE } from '../../utils/inventoryConstants';
import { locationPermission } from '../../utils/permissions';
import { Loader } from '../Common';
import ImageCapturing from '../Common/ImageCapturing';
import MapMarking from '../Common/MapMarking';
import {
  PermissionBlockedAlert,
  PermissionDeniedAlert,
} from '../Common/MapMarking/LocationPermissionAlerts';

const RegisterSingleTree = () => {
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('');
  const [isGranted, setIsGranted] = useState(false);
  const [isPermissionDeniedAlertShow, setIsPermissionDeniedAlertShow] = useState(false);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      setScreenState('');
      if (inventoryState.inventoryID) {
        getInventory({ inventoryID: inventoryState.inventoryID }).then((InventoryData) => {
          if (InventoryData.status === INCOMPLETE) {
            let data = {
              inventory_id: inventoryState.inventoryID,
              lastScreen: 'RegisterSingleTree',
            };
            updateLastScreen(data);

            locationPermission()
              .then((granted) => {
                setIsGranted(true);
                if (granted && InventoryData.polygons[0]) {
                  Geolocation.getCurrentPosition(
                    (position) => {
                      const distanceInMeters = distanceCalculator(
                        [position.coords.latitude, position.coords.longitude],
                        [
                          InventoryData.polygons[0].coordinates[0].latitude,
                          InventoryData.polygons[0].coordinates[0].longitude,
                        ],
                        'meters',
                      );
                      if (distanceInMeters < 100) {
                        //set onsite
                        addLocateTree({
                          inventory_id: inventoryState.inventoryID,
                          locateTree: ON_SITE,
                        });
                        updateScreenState('ImageCapturing');
                      } else {
                        //set offsite
                        addLocateTree({
                          inventory_id: inventoryState.inventoryID,
                          locateTree: OFF_SITE,
                        });
                        updateScreenState('MapMarking');
                        navigation.navigate('SelectSpecies');
                      }
                    },
                    (err: Geolocation.GeoError) => {
                      console.error(err);
                    },
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
                } else {
                  setScreenState('MapMarking');
                }
              })
              .catch((err) => {
                checkPermissionAlert(err);
              });
          }
        });
      } else {
        locationPermission()
          .then(() => {
            setIsGranted(true);
            setScreenState('MapMarking');
          })
          .catch((err) => {
            checkPermissionAlert(err);
          });
      }
    });
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
      unsubscribe();
    };
  }, [inventoryState, isGranted, navigation]);

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
          { name: 'MainScreen' },
          {
            name: 'TreeInventory',
          },
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
