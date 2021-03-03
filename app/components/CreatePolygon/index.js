import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';
import ImageCapturing from '../Common/ImageCapturing';
import MapMarking from './MapMarking';
import { getInventory, updateLastScreen } from '../../repositories/inventory';
import { InventoryContext } from '../../reducers/inventory';

const CreatePolygon = ({ route }) => {
  const { state } = useContext(InventoryContext);

  const [isMapMarkingState, setIsMapMarkingState] = useState(true);
  const [isCompletePolygon, setIsCompletePolygon] = useState(false);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState();

  useEffect(() => {
    checkIsEdit();
    let data = { inventory_id: state.inventoryID, last_screen: 'CreatePolygon' };
    updateLastScreen(data);
  }, []);

  const checkIsEdit = () => {
    if (route.params?.isEdit) {
      getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
        setIsMapMarkingState(false);
        setActiveMarkerIndex(inventory.polygons[0].coordinates.length - 1);
      });
    }
  };

  const toggleState = () => {
    setIsMapMarkingState(!isMapMarkingState);
  };

  const updateActiveMarkerIndex = (index) => {
    setActiveMarkerIndex(index);
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
            inventoryID={state.inventoryID}
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
