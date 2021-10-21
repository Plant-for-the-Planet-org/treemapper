import MapboxGL, {
  CircleLayerStyle,
  FillLayerStyle,
  LineLayerStyle,
} from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/core';
import bbox from '@turf/bbox';
import i18next from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View } from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory, updateInventory } from '../../repositories/inventory';
import { Colors } from '../../styles';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import distanceCalculator from '../../utils/distanceCalculator';
import {
  geoJSONType,
  MULTI,
  PENDING_DATA_UPDATE,
  SINGLE,
  SYNCED,
} from '../../utils/inventoryConstants';
import { AlertModal } from '../Common';
import Markers from '../Common/Markers';
import EditPolygonButtons from './EditPolygonButtons';

interface IEditPolygonProps {}

const EditPolygon = () => {
  const geoJSONInitialState = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      },
    ],
  };
  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);
  const [draggedGeoJSON, setDraggedGeoJSON] = useState<geoJSONType[]>([geoJSONInitialState]);
  const [currentStackIndex, setCurrentStackIndex] = useState<number>(0);
  const [showInvalidCoordinateAlert, setShowInvalidCoordinateAlert] = useState<boolean>(false);
  const [inventory, setInventory] = useState<any>();

  // used to check if geoJSON geometry type is Point or Polygon and switches
  // between polygon and marker state in UI
  const [isPointJSON, setIsPointJSON] = useState<boolean>(false);

  // stores the original geometry to compare the changes with
  const [originalGeometry, setOriginalGeometry] = useState<any>({
    coordinates: [],
    type: 'Polygon',
  });

  const map = useRef(null);
  const camera = useRef(null);

  const [bounds, setBounds] = useState<any>([]);

  const { state } = useContext(InventoryContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (state.inventoryID) {
      async function getInventoryData() {
        const inventoryData = await getInventory({ inventoryID: state.inventoryID });
        setInventory(inventoryData);

        if (inventoryData?.originalGeometry) {
          setOriginalGeometry(JSON.parse(inventoryData?.originalGeometry));
        }

        const geoJSONData = await getGeoJsonData({ inventoryData });

        const isPoint =
          (geoJSONData.features[0].geometry.type === 'Point' && inventoryData.treeType === MULTI) ||
          inventoryData.treeType === SINGLE;
        setIsPointJSON(isPoint);

        setDraggedGeoJSON([geoJSONData]);

        setBounds(bbox(geoJSONData.features[0]));
      }
      getInventoryData();
    }
  }, [isCameraRefVisible, state.inventoryID]);

  useEffect(() => {
    if (isCameraRefVisible && bounds.length === 4 && camera?.current?.fitBounds) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 100, 1000);
    }
  }, [isCameraRefVisible, bounds]);

  // checks the distance between original and currently move corrdinate.
  // if distance > 100m then returns [false] as invalid marked coordinate
  // else [true]
  const checkIsCoordinateDistanceValid = (
    originalCoordinates: number[],
    currentCoordinates: number[],
  ): boolean => {
    let distanceInMeters =
      distanceCalculator(
        originalCoordinates[1],
        originalCoordinates[0],
        currentCoordinates[1],
        currentCoordinates[0],
        'K',
      ) * 1000;

    return (distanceInMeters <= 100) as boolean;
  };

  // updates the coordinates whenever the marker position is updated
  const dragCoordinates = (coordinates: number[], index: number) => {
    // copies the draggedGeoJSON to remove reference
    const geoJSONData = JSON.parse(JSON.stringify(draggedGeoJSON));

    // copies the current polygon shown on the screen
    const newData = JSON.parse(JSON.stringify(geoJSONData[currentStackIndex]));
    let isValidCoordinate = false;

    // if originalGeometry is present then compares whether the new coordinate is valid or not
    // else compares it with the initial geometry
    if (originalGeometry.coordinates.length > 0) {
      isValidCoordinate = checkIsCoordinateDistanceValid(
        isPointJSON ? originalGeometry.coordinates : originalGeometry.coordinates[0][index],
        coordinates,
      );
    } else {
      isValidCoordinate = checkIsCoordinateDistanceValid(
        isPointJSON
          ? draggedGeoJSON[0].features[0].geometry.coordinates
          : draggedGeoJSON[0].features[0].geometry.coordinates[0][index],
        coordinates,
      );
    }

    // updates the coordinate according to Point or Polygon geometry type
    if (isPointJSON) {
      newData.features[0].geometry.coordinates = coordinates;
    } else {
      newData.features[0].geometry.coordinates[0][index] = coordinates;
    }

    // changes the last marker coordinate to match with the first one if
    // geometry type is not Point
    if (index === 0 && !isPointJSON) {
      const lastCoordinate = newData.features[0].geometry.coordinates[0].length - 1;
      newData.features[0].geometry.coordinates[0][lastCoordinate] = coordinates;
    }

    // removes all the redo state polygons if current polygon is created after undo state
    if (geoJSONData.length - 1 > currentStackIndex) {
      geoJSONData.splice(currentStackIndex + 1, geoJSONData.length - 1);
    }

    geoJSONData.push(newData);

    setDraggedGeoJSON(geoJSONData);
    setCurrentStackIndex(currentStackIndex + 1);

    // shows error message if coordinate is not valid
    if (!isValidCoordinate) {
      setShowInvalidCoordinateAlert(true);
    }
  };

  const onPressInvalidCoordinateAlert = () => {
    const geoJSONData = JSON.parse(JSON.stringify(draggedGeoJSON));
    geoJSONData.splice(-1, 1);
    setDraggedGeoJSON(geoJSONData);
    setCurrentStackIndex(currentStackIndex - 1);
    setShowInvalidCoordinateAlert(false);
  };

  // resets the current polygon to it's original state
  const resetGeoJSON = () => {
    setCurrentStackIndex(0);
    setDraggedGeoJSON([draggedGeoJSON[0]]);
  };

  // decrements the currentStackIndex
  const undoGeoJSON = () =>
    setCurrentStackIndex(currentStackIndex === 0 ? 0 : currentStackIndex - 1);

  // increments the currentStackIndex
  const redoGeoJSON = () =>
    setCurrentStackIndex(
      currentStackIndex === draggedGeoJSON.length ? draggedGeoJSON.length : currentStackIndex + 1,
    );

  // saves the current geoJSON in the realm database and updates the
  // registration status to PENDING_DATA_UPDATE if the registration is already SYNCED
  const saveGeoJSON = () => {
    const geoJSONToSave = draggedGeoJSON[currentStackIndex];
    const coordinates = geoJSONToSave?.features[0]?.geometry?.coordinates[0];

    if (coordinates) {
      const inventoryData = JSON.parse(JSON.stringify(inventory));

      inventoryData.status =
        inventoryData.status === SYNCED ? PENDING_DATA_UPDATE : inventoryData.status;

      const lastIndex = inventoryData.polygons[0].coordinates.length - 1;

      for (const i in coordinates) {
        inventoryData.polygons[0].coordinates[i].latitude = coordinates[i][1];
        inventoryData.polygons[0].coordinates[i].longitude = coordinates[i][0];
        if (Number(i) === 0) {
          inventoryData.polygons[0].coordinates[lastIndex].latitude = coordinates[i][1];
          inventoryData.polygons[0].coordinates[lastIndex].longitude = coordinates[i][0];
        }
      }

      updateInventory({ inventory_id: state.inventoryID, inventoryData });
      navigation.goBack();
    }
  };

  // shows the gray polygon for reference to older polygon while updating markers
  const nonDragableGeoJSON =
    originalGeometry.coordinates.length > 0
      ? {
          type: 'Feature',
          geometry: originalGeometry,
        }
      : draggedGeoJSON[0];

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.container}
        ref={map}
        pitchEnabled={false}
        rotateEnabled={false}
        logoEnabled>
        <MapboxGL.Camera
          ref={(el) => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />

        {!isPointJSON ? (
          <>
            {/* original geoJSON to show */}
            <MapboxGL.ShapeSource id={'nonDragablePolygon'} shape={nonDragableGeoJSON}>
              <MapboxGL.FillLayer id={'nonDragablePolyFill'} style={inactiveFillStyle} />
              {/* <MapboxGL.LineLayer id={'nonDragablePolyline'} style={inactivePolyline} /> */}
              <MapboxGL.CircleLayer id={'nonDragableCircle'} style={inactiveCircle} />
            </MapboxGL.ShapeSource>

            {/* changes as the coordinates changes */}
            <MapboxGL.ShapeSource id={'dragablePolygon'} shape={draggedGeoJSON[currentStackIndex]}>
              <MapboxGL.FillLayer id={'dragablePolyFill'} style={fillStyle} />
              <MapboxGL.LineLayer id={'dragablePolyline'} style={polyline} />
            </MapboxGL.ShapeSource>
          </>
        ) : (
          []
        )}

        <Markers
          geoJSON={draggedGeoJSON[currentStackIndex]}
          draggable
          onDragEnd={(e: any, index: number) => dragCoordinates(e.geometry.coordinates, index)}
          ignoreLastMarker={inventory?.treeType === MULTI}
        />

        {isPointJSON ? <Markers geoJSON={nonDragableGeoJSON} nonDragablePoint /> : []}
      </MapboxGL.MapView>

      <EditPolygonButtons
        navigation={navigation}
        isUndoDisabled={currentStackIndex === 0}
        isRedoDisabled={currentStackIndex === draggedGeoJSON.length - 1}
        saveGeoJSON={saveGeoJSON}
        undoGeoJSON={undoGeoJSON}
        redoGeoJSON={redoGeoJSON}
        resetGeoJSON={resetGeoJSON}
        disableButtons={draggedGeoJSON.length <= 1 || currentStackIndex === 0}
        hid={inventory?.hid || ''}
        isPointJSON={isPointJSON}
      />
      <AlertModal
        visible={showInvalidCoordinateAlert}
        heading={i18next.t('label.invalid_coordinate')}
        message={i18next.t('label.distance_more_than_100_meter')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => onPressInvalidCoordinateAlert()}
        showSecondaryButton={false}
      />
    </View>
  );
};

export default EditPolygon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PRIMARY,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
};

const fillStyle: StyleProp<FillLayerStyle> = { fillColor: Colors.PRIMARY, fillOpacity: 0.3 };

const inactiveFillStyle: StyleProp<FillLayerStyle> = {
  fillColor: Colors.PLANET_BLACK,
  fillOpacity: 0.3,
};

// const inactivePolyline: StyleProp<LineLayerStyle> = {
//   lineWidth: 1,
//   lineColor: Colors.PLANET_BLACK,
//   lineOpacity: 0.3,
//   lineJoin: 'bevel',
// };

const inactiveCircle: StyleProp<CircleLayerStyle> = {
  circleColor: Colors.PLANET_BLACK,
  circleOpacity: 0.3,
};
