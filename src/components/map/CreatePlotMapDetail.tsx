import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

const CreatePlotMapDetail = () => {
  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        styleURL={JSON.stringify(MapStyle)}>
        <Text></Text>
      </MapLibreGL.MapView>
    </View>
  );
}

export default CreatePlotMapDetail