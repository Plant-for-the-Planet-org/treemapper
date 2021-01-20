import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Colors } from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from '../Common/ImageCapturing';
import { InventoryContext } from '../../reducers/inventory';
import { updateLastScreen } from '../../repositories/inventory';

const RegisterSingleTree = ({ navigation, route }) => {
  const { state: inventoryState } = useContext(InventoryContext);

  const [screenState, setScreenState] = useState('MapMarking');
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    if (route.params?.isEdit) {
      setScreenState('ImageCapturing');
    }
    navigation.addListener('focus', () => {
      let data = { inventory_id: inventoryState.inventoryID, last_screen: 'RegisterSingleTree' };
      updateLastScreen(data);
    });
    return () => BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
  }, []);

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
