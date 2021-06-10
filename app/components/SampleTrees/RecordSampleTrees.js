import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import MapMarking from '../Common/MapMarking';
import { Colors } from '_styles';
import ImageCapturing from '../Common/ImageCapturing';
import { MULTI, SAMPLE } from '../../utils/inventoryConstants';
import { Loader } from '../Common';
import { getInventory } from '../../repositories/inventory';
import { InventoryContext } from '../../reducers/inventory';

export default function RecordSampleTrees({ route }) {
  const [screenState, setScreenState] = useState('');
  const { state: inventoryState } = useContext(InventoryContext);

  useEffect(() => {
    getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
      chooseScreenState(inventoryData);
    });
  }, []);

  const chooseScreenState = (inventory) => {
    let lastSampleTree = inventory.sampleTrees[inventory.sampleTrees.length - 1];
    if (lastSampleTree?.imageUrl && lastSampleTree?.latitude) {
      updateScreenState('MapMarking');
    } else if (lastSampleTree?.latitude && !lastSampleTree?.imageUrl) {
      updateScreenState('ImageCapturing');
    } else {
      updateScreenState('MapMarking');
    }
  };
  const updateScreenState = (state) => setScreenState(state);
  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' && (
        <MapMarking
          isSampleTree={true}
          updateScreenState={updateScreenState}
          resetRouteStack={() => {}}
          treeType={SAMPLE}
          specieId={route?.params?.specieId}
          specieName={route?.params?.specieName}
        />
      )}
      {screenState == 'ImageCapturing' && (
        <ImageCapturing
          updateScreenState={updateScreenState}
          inventoryType={MULTI}
          isSampleTree={true}
        />
      )}
      {screenState === '' && <Loader isLoaderShow={true} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});
