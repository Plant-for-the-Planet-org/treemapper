import React, {useState, useContext, useEffect} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {Colors} from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from './ImageCapturing';
import {store} from '../../Actions/store';
import {updateLastScreen} from '../../Actions';

const RegisterSingleTree = ({navigation, route}) => {
  const {state} = useContext(store);

  const [screenState, setScreenState] = useState('MapMarking');
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
    if (route.params?.isEdit) {
      setScreenState('ImageCapturing');
    }
    navigation.addListener('focus', () => {
      let data = {
        inventory_id: state.inventoryID,
        last_screen: 'RegisterSingleTree',
      };
      updateLastScreen(data);
    });
  }, [hardBackHandler, navigation, route.params, state.inventoryID]);

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  const updateScreenState = state => setScreenState(state);
  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' && (
        <MapMarking updateScreenState={updateScreenState} />
      )}
      {screenState == 'ImageCapturing' && (
        <ImageCapturing updateScreenState={updateScreenState} />
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
