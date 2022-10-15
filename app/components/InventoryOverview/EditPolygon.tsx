import MapboxGL, {
  CircleLayerStyle,
  FillLayerStyle,
  LineLayerStyle,
} from '@rnmapbox/maps';
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
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Coord } from '@turf/helpers';

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
  const [isSampleTreeOutside, setIsSampleTreeOutside] = useState<boolean>(false);
  const [inventory, setInventory] = useState<any>();

  // used to check if geoJSON geometry type is Point or Polygon and switches
  // between polygon and marker state in UI
  const [isPointJSON, setIsPointJSON] = useState<boolean>(false);

  // stores the original geometry to compare the changes with
  const [originalGeometry, setOriginalGeometry] = useState<any>({
    coordinates: [],
    type: 'Polygon',
  });

  // stores the original geometry feature JSON (includes sample trees, if any)
  // to show on the map to compare the changes with
  const [originalGeometryJSON, setOriginalGeometryJSON] = useState<any>(geoJSONInitialState);

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

        const geoJSONData = await getGeoJsonData({ inventoryData });

        // if original geometry is available, set it
        if (inventoryData?.originalGeometry) {
          const geometry = JSON.parse(inventoryData?.originalGeometry);
          setOriginalGeometry(geometry);

          // if coordinates are availbale for original geometry then adds it
          // to FeatureColection. Also adds sample trees features if available
          if (geometry?.coordinates?.length > 0) {
            setOriginalGeometryJSON({
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', geometry },
                ...(geoJSONData.features.length > 1 ? geoJSONData.features.slice(1) : []),
              ],
            });
          }
        }

        // checks if the geometry is a point or not, and sets the state accordingly
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

    return distanceInMeters <= 100;
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
    let isCoordinateInside = true;

    if (coordinates) {
      const polygon = {
        type: 'Polygon',
        coordinates: [coordinates],
      };

      // checks if the sample trees coordinates are inside the updated polygon geometry
      if (inventory?.sampleTrees && Array.isArray(inventory?.sampleTrees)) {
        for (const sampleTree of inventory.sampleTrees) {
          const point: Coord = {
            type: 'Point',
            coordinates: [sampleTree.longitude, sampleTree.latitude],
          };
          isCoordinateInside = booleanPointInPolygon(point, polygon);
          if (!isCoordinateInside) {
            break;
          }
        }
      }

      // if the coordinates are inside then updated polygon geometry then save
      // the geoJSON else show alert for same
      if (isCoordinateInside) {
        // unlinks the inventory/registration data and creates a copy of it
        const inventoryData = JSON.parse(JSON.stringify(inventory));

        // updates the registration status
        inventoryData.status =
          inventoryData.status === SYNCED ? PENDING_DATA_UPDATE : inventoryData.status;

        // stores the last index position of the registration polygon coordinate
        const lastIndex = inventoryData.polygons[0].coordinates.length - 1;

        // changes the coordinates value in the registration with the edited coordinates
        for (const i in coordinates) {
          inventoryData.polygons[0].coordinates[i].latitude = coordinates[i][1];
          inventoryData.polygons[0].coordinates[i].longitude = coordinates[i][0];
          // if coordinate is first then changes the lat, long for last coordinate
          // as well as last coordinate marker is hidden
          if (Number(i) === 0) {
            inventoryData.polygons[0].coordinates[lastIndex].latitude = coordinates[i][1];
            inventoryData.polygons[0].coordinates[lastIndex].longitude = coordinates[i][0];
          }
        }

        updateInventory({ inventory_id: state.inventoryID, inventoryData });
        navigation.goBack();
      } else {
        setIsSampleTreeOutside(!isCoordinateInside);
      }
    }
  };

  // shows the gray polygon for reference to older polygon while updating markers
  const nonDragableGeoJSON =
    originalGeometry?.coordinates?.length > 0 ? originalGeometryJSON : draggedGeoJSON[0];

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.container}
        ref={map}
        pitchEnabled={false}
        rotateEnabled={false}
        attributionPosition={{
          bottom: 8,
          right: 8,
        }}
        logoEnabled>
        <MapboxGL.Camera
          ref={el => {
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

        {/* shows draggable markers */}
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

      {/* shows alert if edited marker coordinate is more than 100m away from
      original coordinate */}
      <AlertModal
        visible={showInvalidCoordinateAlert}
        heading={i18next.t('label.locate_tree_cannot_mark_location')}
        message={i18next.t('label.distance_more_than_100_meter')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => onPressInvalidCoordinateAlert()}
        showSecondaryButton={false}
      />

      {/* shows alert message when sampleTrees are outside polygon */}
      <AlertModal
        visible={isSampleTreeOutside}
        heading={i18next.t('label.cannot_update_polygon')}
        message={i18next.t('label.sample_trees_outside_polygon')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => setIsSampleTreeOutside(false)}
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

const inactiveCircle: StyleProp<CircleLayerStyle> = {
  circleColor: Colors.PLANET_BLACK,
  circleOpacity: 0.3,
};
