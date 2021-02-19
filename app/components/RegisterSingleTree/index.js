import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, BackHandler, PermissionsAndroid, Alert } from 'react-native';
// import Geolocation from '@react-native-community/geolocation';
import Geolocation from 'react-native-geolocation-service';
import { Colors } from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from '../Common/ImageCapturing';
import { InventoryContext } from '../../reducers/inventory';
import { updateLastScreen, getInventory, addLocateTree } from '../../repositories/inventory';
import distanceCalculator from '../../utils/distanceCalculator';
import { INCOMPLETE_INVENTORY } from '../../utils/inventoryStatuses';
import { bugsnag } from '_utils';
import { set } from 'react-native-reanimated';

const RegisterSingleTree = ({ navigation }) => {
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('MapMarking');
  const [isGranted, setIsGranted] = useState(false);
  // const [currentPosition, setCurrentPosition] = useState();

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    // if (route.params?.isEdit) {
    //   setScreenState('ImageCapturing');
    // }

    getInventory({ inventoryID: inventoryState.inventoryID }).then((InventoryData) => {
      if (InventoryData.status === INCOMPLETE_INVENTORY) {
        let data = { inventory_id: inventoryState.inventoryID, last_screen: 'RegisterSingleTree' };
        updateLastScreen(data);
        console.log(
          InventoryData.polygons[0],
          '<======================InventoryData.polygons[0]======================>',
        );
        permission();
        if (isGranted && InventoryData.polygons[0]) {
          console.log('-----------In--------------');
          Geolocation.getCurrentPosition((position) => {
            // console.log(currentPosition, 'currentPosition');
            // setCurrentPosition(position);
            if (InventoryData.polygons.length > 0) {
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
            } else {
              updateScreenState('MapMarking');
            }
          });
        }
      }
    });

    return () => BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
  }, [inventoryState, isGranted]);

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  const updateScreenState = (state) => setScreenState(state);

  const permission = async () => {
    try {
      console.log('Asking permission');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to High accuracy location',
          buttonPositive: 'Ok',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permission granted');
        setIsGranted(true);
        return true;
      } else {
        Alert.alert(
          'Permission Denied!',
          'You need to give location permission to register on-site tree',
        );
        return false;
      }
    } catch (err) {
      bugsnag.notify(err);
      console.log(err, 'Permission error');
      return false;
    }
  };
  console.log(isGranted, 'isGranted');
  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' && isGranted && (
        <MapMarking updateScreenState={updateScreenState} inventoryState={inventoryState} />
      )}
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
