import MapboxGL from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/core';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import i18next from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Config from 'react-native-config';
import FAIcon from 'react-native-vector-icons/FontAwesome5';
import { Colors, Typography } from '_styles';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory, updateInventory, updateLastScreen } from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import { MULTI, OFF_SITE } from '../../utils/inventoryConstants';
import { Header, PrimaryButton, TopRightBackground } from '../Common';
import SampleTreeMarkers from '../Common/SampleTreeMarkers';
import ManageSpecies from '../ManageSpecies';

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
  const [isPointForMultipleTree, setIsPointForMultipleTree] = useState(false);
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

  useEffect(() => {
    if (
      isCameraRefVisible &&
      bounds.length > 0 &&
      camera?.current?.fitBounds &&
      !isPointForMultipleTree
    ) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 30, 1000);
    }
    if (isCameraRefVisible && centerCoordinate.length > 0 && camera?.current?.setCamera) {
      let config = {
        centerCoordinate,
      };
      if (isPointForMultipleTree) {
        config.zoomLevel = 18;
      }
      camera.current.setCamera(config);
    }
  }, [isCameraRefVisible, bounds, centerCoordinate]);

  // initializes the state by updating state
  const initializeState = () => {
    if (inventoryState.inventoryID) {
      getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
        console.log(inventoryData, 'inventoryData');
        setInventory(inventoryData);
        if (inventoryData.polygons.length > 0) {
          const geoJSONData = getGeoJsonData(inventoryData);
          if (
            inventoryData.polygons[0].coordinates.length === 1 &&
            inventoryData.polygons[0].isPolygonComplete
          ) {
            setIsPointForMultipleTree(true);
            setCenterCoordinate([
              inventoryData.polygons[0].coordinates[0].longitude,
              inventoryData.polygons[0].coordinates[0].latitude,
            ]);
          } else {
            setCenterCoordinate(turfCenter(geoJSONData.features[0]));

            setBounds(bbox(geoJSONData.features[0]));
          }

          setGeoJSON(geoJSONData);
        }
      });
    }
  };

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
            aliases: specie.aliases ? specie.aliases : specie.scientificName,
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
          marginHorizontal: 25,
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
        {shouldRenderShape && !isPointForMultipleTree && (
          <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
          </MapboxGL.ShapeSource>
        )}
        <SampleTreeMarkers geoJSON={geoJSON} isPointForMultipleTree={isPointForMultipleTree} />
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
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <TopRightBackground />
          <View style={{ paddingHorizontal: 25 }}>
            <Header headingText={i18next.t('label.total_trees_header')} />
          </View>

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
        <View style={{ paddingHorizontal: 25 }}>
          <PrimaryButton
            onPress={() => setShowManageSpecies(true)}
            btnText={i18next.t('label.select_species_add_species')}
            theme={'primary'}
            testID={'sample_tree_count_continue'}
            accessibilityLabel={'sample_tree_count_continue'}
          />
          <PrimaryButton
            onPress={() => {
              inventory?.sampleTreesCount === inventory?.completedSampleTreesCount ||
              inventory?.locateTree === OFF_SITE
                ? navigation.navigate('InventoryOverview')
                : navigation.navigate('SampleTreesCount');
            }}
            btnText={
              inventory?.sampleTreesCount === inventory?.completedSampleTreesCount ||
              inventory?.locateTree === OFF_SITE
                ? i18next.t('label.tree_review_continue_to_review')
                : i18next.t('label.tree_review_continue_to_sampleTrees')
            }
            theme={'primary'}
            testID={'sample_tree_count_continue'}
            accessibilityLabel={'sample_tree_count_continue'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: Colors.WHITE,
    position: 'relative',
  },
  mapContainer: {
    backgroundColor: Colors.WHITE,
    height: 230,
    marginVertical: 40,
    paddingHorizontal: 25,
  },
  descriptionContainer: {
    marginTop: 40,
    paddingHorizontal: 25,
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
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
