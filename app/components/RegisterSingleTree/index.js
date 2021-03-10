import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
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
import { CommonActions } from '@react-navigation/native';
import { Loader } from '../Common';
const IS_ANDROID = Platform.OS === 'android';

const RegisterSingleTree = ({ navigation }) => {
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('');
  const [isGranted, setIsGranted] = useState(false);
  const [isPermissionDeniedAlertShow, setIsPermissionDeniedAlertShow] = useState(false);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      setScreenState('');
      if (inventoryState.inventoryID) {
        getInventory({ inventoryID: inventoryState.inventoryID }).then((InventoryData) => {
          if (InventoryData.status === INCOMPLETE_INVENTORY) {
            let data = {
              inventory_id: inventoryState.inventoryID,
              last_screen: 'RegisterSingleTree',
            };
            updateLastScreen(data);

            permission().then((granted) => {
              if (granted && InventoryData.polygons[0]) {
                Geolocation.getCurrentPosition(
                  (position) => {
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
                  },
                  (err) => {
                    console.log(err);
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
            });
          }
        });
      } else {
        permission().then(() => setScreenState('MapMarking'));
      }
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

  const updateScreenState = (state) => setScreenState(state);

  const permission = async () => {
    if (IS_ANDROID) {
      try {
        console.log('Asking permission');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
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

  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' &&
        (isGranted ? (
          <MapMarking
            updateScreenState={updateScreenState}
            // inventoryState={inventoryState}
            resetRouteStack={resetRouteStack}
          />
        ) : isPermissionDeniedAlertShow ? (
          <PermissionDeniedAlert
            isPermissionDeniedAlertShow={isPermissionDeniedAlertShow}
            setIsPermissionDeniedAlertShow={setIsPermissionDeniedAlertShow}
            permission={permission}
            resetRouteStack={resetRouteStack}
          />
        ) : (
          <PermissionBlockedAlert
            isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
            setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
            resetRouteStack={resetRouteStack}
          />
        ))}

      {screenState == 'ImageCapturing' && (
        <ImageCapturing updateScreenState={updateScreenState} inventoryType="single" />
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

const PermissionDeniedAlert = ({
  isPermissionDeniedAlertShow,
  setIsPermissionDeniedAlertShow,
  permission,
  resetRouteStack,
}) => {
  return (
    <AlertModal
      visible={isPermissionDeniedAlertShow}
      heading={i18next.t('label.permission_denied')}
      message={i18next.t('label.permission_denied_message')}
      primaryBtnText={i18next.t('label.ok')}
      secondaryBtnText={i18next.t('label.back')}
      onPressPrimaryBtn={() => {
        setIsPermissionDeniedAlertShow(false);
        permission();
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionDeniedAlertShow(false);
        resetRouteStack();
      }}
    />
  );
};

const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
  resetRouteStack,
}) => {
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={i18next.t('label.permission_blocked_message')}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.back')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        resetRouteStack();
        Linking.openSettings();
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        resetRouteStack();
      }}
    />
  );
};
