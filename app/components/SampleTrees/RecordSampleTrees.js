import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapMarking from '../Common/MapMarking';
import { Colors } from '_styles';
import ImageCapturing from '../Common/ImageCapturing';
import { MULTI, SAMPLE } from '../../utils/inventoryConstants';

export default function RecordSampleTrees() {
  const [screenState, setScreenState] = useState('MapMarking');

  const updateScreenState = (state) => setScreenState(state);

  return (
    <View style={styles.container}>
      {screenState == 'MapMarking' && (
        <MapMarking
          isSampleTree={true}
          updateScreenState={updateScreenState}
          resetRouteStack={() => {}}
          treeType={SAMPLE}
        />
      )}
      {screenState == 'ImageCapturing' && (
        <ImageCapturing
          updateScreenState={updateScreenState}
          inventoryType={MULTI}
          isSampleTree={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});
