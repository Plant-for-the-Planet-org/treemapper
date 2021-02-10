import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Colors } from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from '../Common/ImageCapturing';
import { InventoryContext } from '../../reducers/inventory';
import { updateLastScreen, getInventory, addLocateTree } from '../../repositories/inventory';
import distanceCalculator from '../../utils/distanceCalculator';
import { INCOMPLETE_INVENTORY } from '../../utils/inventoryStatuses';
const RegisterSingleTree = ({ navigation, route }) => {
  const { state: inventoryState } = useContext(InventoryContext);
  const [screenState, setScreenState] = useState('MapMarking');
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    // if (route.params?.isEdit) {
    //   setScreenState('ImageCapturing');
    // }

    getInventory({ inventoryID: inventoryState.inventoryID }).then((InventoryData) => {
      console.log(InventoryData.polygons[0], 'InventoryData');
      if (InventoryData.status === INCOMPLETE_INVENTORY) {
        console.log('inventoryState.inventoryID', inventoryState.inventoryID);
        let data = { inventory_id: inventoryState.inventoryID, last_screen: 'RegisterSingleTree' };
        updateLastScreen(data);

        Geolocation.getCurrentPosition((position) => {
          let distanceInMeters;
          console.log(InventoryData.polygons.length, 'InventoryData.polygons.length');
          if (InventoryData.polygons.length > 0) {
            distanceInMeters =
              distanceCalculator(
                position.coords.latitude,
                position.coords.longitude,
                InventoryData.polygons[0].coordinates[0].latitude,
                InventoryData.polygons[0].coordinates[0].longitude,
                'K',
              ) * 1000;
            console.log(distanceInMeters, 'distanceInMeters');
            if (distanceInMeters && distanceInMeters < 100) {
              //set onsite
              addLocateTree({ inventory_id: inventoryState.inventoryID, locate_tree: 'on-site' });
              updateScreenState('ImageCapturing');
            } else {
              //set offsite
              addLocateTree({ inventory_id: inventoryState.inventoryID, locate_tree: 'off-site' });
              navigation.navigate('SelectSpecies');
            }
          } else {
            updateScreenState('MapMarking');
          }
        });
      }
    });
    return () => BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
  }, [inventoryState]);

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  const updateScreenState = (state) => setScreenState(state);
  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' && <MapMarking updateScreenState={updateScreenState} />}
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
