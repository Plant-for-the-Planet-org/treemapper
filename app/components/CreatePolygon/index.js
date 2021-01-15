import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';
import ImageCapturing from '../Common/ImageCapturing';
import MapMarking from './MapMarking';
import { store } from '../../actions/store';
import { updateLastScreen, getInventory } from '../../actions/';

const CreatePolygon = ({ route }) => {
  const { state } = useContext(store);

  const [locationText, setLocationText] = useState('');
  const [isMapMarkingState, setIsMapMarkingState] = useState(true);
  const [isCompletePolygon, setIsCompletePolygon] = useState(false);
  const [coordsLength, setCoordsLength] = useState(0);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState(null);

  useEffect(() => {
    checkIsEdit();
    let data = { inventory_id: state.inventoryID, last_screen: 'CreatePolygon' };
    updateLastScreen(data);
  }, []);

  const checkIsEdit = () => {
    if (route.params?.isEdit) {
      getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
        setIsMapMarkingState(false);
        console.log(inventory.polygons[0].coordinates, 'marker');
        setActiveMarkerIndex(Object.keys(inventory.polygons[0].coordinates).length - 1);
      });
    }
  };

  const toggleState = (locationText, coordsLength) => {
    setLocationText(locationText);
    setCoordsLength(coordsLength);
    setIsMapMarkingState(!isMapMarkingState);
  };

  const updateActiveMarkerIndex = (index) => {
    setActiveMarkerIndex(index);
  };

  const toogleState2 = () => {
    setIsMapMarkingState(!isMapMarkingState);
  };

  return (
    <View style={styles.container} fourceInset={{ bottom: 'never', top: 'never' }}>
      <View style={styles.container}>
        {isMapMarkingState ? (
          <MapMarking
            toggleState={toggleState}
            isCompletePolygon={isCompletePolygon}
            setIsCompletePolygon={setIsCompletePolygon}
            activeMarkerIndex={activeMarkerIndex}
            updateActiveMarkerIndex={updateActiveMarkerIndex}
            toogleState2={toogleState2}
          />
        ) : (
          <ImageCapturing
            toggleState={toggleState}
            updateActiveMarkerIndex={updateActiveMarkerIndex}
            activeMarkerIndex={activeMarkerIndex}
            isCompletePolygon={isCompletePolygon}
            inventoryType="multiple"
          />
        )}
      </View>
    </View>
  );
};
export default CreatePolygon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
});
