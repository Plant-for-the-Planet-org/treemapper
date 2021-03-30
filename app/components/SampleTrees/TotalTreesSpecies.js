import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import FAIcon from 'react-native-vector-icons/FontAwesome5';
import { Colors, Typography } from '_styles';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory, updateInventory, updateLastScreen } from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { MULTI } from '../../utils/inventoryConstants';
import { Header, PrimaryButton, TopRightBackground } from '../Common';
import ManageSpecies from '../ManageSpecies';
import MapboxGL from '@react-native-mapbox-gl/maps';
import Config from 'react-native-config';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import { marker_png } from '../../assets';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

export default function TotalTreesSpecies() {
  const [bounds, setBounds] = useState([]);
  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState([]);

  const navigation = useNavigation();

  // reference for camera to focus on map
  const camera = useRef(null);

  // reference for map
  const map = useRef(null);
  const [showManageSpecies, setShowManageSpecies] = useState(false);
  const [inventory, setInventory] = useState();
  // stores the geoJSON
  const [geoJSON, setGeoJSON] = useState({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          isPolygonComplete: false,
        },
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      },
    ],
  });

  const { state: inventoryState } = useContext(InventoryContext);

  useEffect(() => {
    let data = {
      inventory_id: inventoryState.inventoryID,
      lastScreen: 'TotalTreesSpecies',
    };
    updateLastScreen(data);
    initializeState();
  }, []);

  const deleteSpecie = (index) => {
    let species = [...inventory.species];
    const specie = species.splice(index, 1);

    updateInventory({
      inventory_id: inventory.inventory_id,
      inventoryData: {
        species,
      },
    })
      .then(() => {
        getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
          setInventory(inventoryData);
        });
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully deleted specie with id: ${specie[0].id} multiple tree having inventory_id: ${inventory.inventory_id}`,
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Failed to delete specie with id: ${specie[0].id} multiple tree having inventory_id: ${inventory.inventory_id}`,
          logStack: JSON.stringify(err),
        });
      });
  };

  const addSpecieToInventory = (specie) => {
    if (specie.treeCount > 0) {
      let species = [...inventory.species];

      let deleteSpecieIndex;
      let updateSpecieIndex;
      for (const index in species) {
        if (species[index].id === specie.guid && specie.treeCount === 0) {
          deleteSpecieIndex = index;
          break;
        } else if (species[index].id === specie.guid && specie.treeCount > 0) {
          updateSpecieIndex = index;
        }
      }

      if (deleteSpecieIndex) {
        species.splice(deleteSpecieIndex, 1);
      } else if (updateSpecieIndex) {
        species[updateSpecieIndex].treeCount = specie.treeCount;
      } else {
        species = [
          ...species,
          {
            aliases: specie.scientificName,
            id: specie.guid,
            treeCount: specie.treeCount,
          },
        ];
      }

      updateInventory({
        inventory_id: inventory.inventory_id,
        inventoryData: {
          species,
        },
      })
        .then(() => {
          getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
            setInventory(inventoryData);
          });
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added specie with id: ${specie.guid} multiple tree having inventory_id: ${inventory.inventory_id}`,
          });
        })
        .catch((err) => {
          dbLog.error({
            logType: LogTypes.INVENTORY,
            message: `Failed to add specie with id: ${specie.guid} multiple tree having inventory_id: ${inventory.inventory_id}`,
            logStack: JSON.stringify(err),
          });
          console.error(
            `Failed to add specie with id: ${specie.guid} multiple tree having inventory_id: ${inventory.inventory_id}`,
            err,
          );
        });
    }
  };

  const SpecieListItem = ({ item, index }) => {
    return (
      <View
        key={index}
        style={{
          paddingVertical: 20,
          paddingRight: 10,
          borderBottomWidth: 1,
          borderColor: '#E1E0E061',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
              color: Colors.TEXT_COLOR,
            }}>
            {item.aliases}
          </Text>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_18,
              fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
              marginTop: 10,
              color: Colors.TEXT_COLOR,
            }}>
            {item.treeCount}{' '}
            {item.treeCount > 1 ? i18next.t('label.trees') : i18next.t('label.tree')}
          </Text>
        </View>
        {item.guid !== 'unknown' ? (
          <TouchableOpacity onPress={() => deleteSpecie(index)}>
            <FAIcon name="minus-circle" size={20} color="#e74c3c" />
          </TouchableOpacity>
        ) : (
          []
        )}
      </View>
    );
  };

  useEffect(() => {
    if (isCameraRefVisible && bounds.length > 0) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 20, 1000);
    }
    if (isCameraRefVisible && centerCoordinate > 0) {
      camera.current.setCamera({
        centerCoordinate,
      });
    }
  }, [isCameraRefVisible, bounds, centerCoordinate]);

  // initializes the state by updating state
  const initializeState = () => {
    getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
      setInventory(inventoryData);
      if (inventoryData.polygons.length > 0) {
        let featureList = inventoryData.polygons.map((onePolygon) => {
          return {
            type: 'Feature',
            properties: {
              isPolygonComplete: onePolygon.isPolygonComplete,
            },
            geometry: {
              type: 'LineString',
              coordinates: onePolygon.coordinates.map((oneCoordinate) => [
                oneCoordinate.longitude,
                oneCoordinate.latitude,
              ]),
            },
          };
        });
        if (inventoryData.sampleTrees.length > 0) {
          for (const sampleTree of inventoryData.sampleTrees) {
            featureList.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [sampleTree.longitude, sampleTree.latitude],
              },
            });
          }
        }
        let geoJSONData = {
          type: 'FeatureCollection',
          features: featureList,
        };

        setCenterCoordinate(turfCenter(featureList[0]));

        setBounds(bbox(featureList[0]));

        setGeoJSON(geoJSONData);
      }
    });
  };

  const SampleTreeMarkers = () => {
    const markers = [];
    for (let i = 1; i < geoJSON.features.length; i++) {
      let onePoint = geoJSON.features[i];

      let oneMarker = onePoint.geometry.coordinates;
      markers.push(
        <MapboxGL.PointAnnotation
          key={`sampleTree-${i}`}
          id={`sampleTree-${i}`}
          coordinate={oneMarker}>
          <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
            <Text style={styles.markerText}>#{i}</Text>
          </ImageBackground>
        </MapboxGL.PointAnnotation>,
      );
    }
    return markers;
  };

  const renderMapView = () => {
    let shouldRenderShape = geoJSON.features[0].geometry.coordinates.length > 1;
    return (
      <MapboxGL.MapView
        showUserLocation={false}
        style={styles.mapContainer}
        ref={map}
        scrollEnabled={false}
        pitchEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}>
        <MapboxGL.Camera
          ref={(el) => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />
        {shouldRenderShape && (
          <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
          </MapboxGL.ShapeSource>
        )}
        {SampleTreeMarkers()}
      </MapboxGL.MapView>
    );
  };

  if (showManageSpecies) {
    return (
      <ManageSpecies
        onPressBack={() => setShowManageSpecies(false)}
        registrationType={MULTI}
        addSpecieToInventory={addSpecieToInventory}
        isSampleTree={true}
        isSampleTreeCompleted={true}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <TopRightBackground />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header headingText={i18next.t('label.total_trees_header')} />

          {/* container for description of what sample trees are and how to proceed */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {i18next.t('label.add_all_trees_planted_on_site')}
            </Text>
          </View>
          {inventory && Array.isArray(inventory.species) && inventory.species.length > 0
            ? inventory.species.map((specie, index) => (
              <SpecieListItem item={specie} index={index} key={index} />
            ))
            : renderMapView()}
        </ScrollView>
        <PrimaryButton
          onPress={() => setShowManageSpecies(true)}
          btnText={i18next.t('label.select_species_add_species')}
          theme={'primary'}
          testID={'sample_tree_count_continue'}
          accessibilityLabel={'sample_tree_count_continue'}
        />
        <PrimaryButton
          onPress={() => navigation.navigate('InventoryOverview')}
          btnText={i18next.t('label.tree_review_continue_to_review')}
          theme={'primary'}
          testID={'sample_tree_count_continue'}
          accessibilityLabel={'sample_tree_count_continue'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
    position: 'relative',
  },
  mapContainer: {
    backgroundColor: Colors.WHITE,
    height: 230,
    marginTop: 40,
  },
  descriptionContainer: {
    marginTop: 40,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  treeCountSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 30,
  },
  treeCountSelection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 10,
    minWidth: '28%',
  },
  treeCountSelectionActive: {
    borderWidth: 0,
    padding: 11,
    backgroundColor: Colors.PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
  },
  treeCountSelectionActiveText: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  markerContainer: {
    width: 30,
    height: 43,
    paddingBottom: 85,
    zIndex: 100000,
  },
  markerText: {
    width: 30,
    height: 43,
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
    paddingTop: 4,
  },
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
