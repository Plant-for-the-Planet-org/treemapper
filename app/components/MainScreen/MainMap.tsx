import MapboxGL from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/core';
import { useFocusEffect } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { setInventoryId } from '../../actions/inventory';
import { InventoryContext, inventoryFetchConstant } from '../../reducers/inventory';
import { getInventory, getInventoryByStatus } from '../../repositories/inventory';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { bugsnag } from '../../utils';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import {
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  POINT,
  SINGLE,
  SYNCED,
} from '../../utils/inventoryConstants';
import { locationPermission } from '../../utils/permissions';
import { AlertModal } from '../Common';
import BackButton from '../Common/BackButton';
import {
  PermissionBlockedAlert,
  PermissionDeniedAlert,
} from '../Common/MapMarking/LocationPermissionAlerts';
import GeoJSONMap from './GeoJSONMap';
import SelectedPlantLocationSampleTreesCards from './SelectedPlantLocationSampleTreesCards';
import SelectedPlantLocationsCards from './SelectedPlantLocationsCards';

const IS_ANDROID = Platform.OS === 'android';

interface IMainMapProps {
  showClickedGeoJSON: boolean;
  setShowClickedGeoJSON: React.Dispatch<React.SetStateAction<boolean>>;
  userInfo: any;
  siteCenterCoordinate: any;
  siteBounds: any;
  projectSites: any;
}

const MainMap = ({
  showClickedGeoJSON,
  setShowClickedGeoJSON,
  userInfo,
  siteCenterCoordinate,
  siteBounds,
  projectSites,
}: IMainMapProps) => {
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
  const [loader, setLoader] = useState(false);
  const [isInitial, setIsInitial] = useState(true);

  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);

  const [location, setLocation] = useState<MapboxGL.Location | Geolocation.GeoPosition>();
  const [isLocationAlertShow, setIsLocationAlertShow] = useState(false);
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const [isCarouselRefVisible, setIsCarouselRefVisible] = useState(false);
  const [isSampleCarouselRefVisible, setIsSampleCarouselRefVisible] = useState(false);
  const [loadingInventoryData, setLoadingInventoryData] = useState(false);

  // stores the geoJSON
  const [geoJSON, setGeoJSON] = useState(geoJSONInitialState);
  const [pointGeoJSON, setPointGeoJSON] = useState(geoJSONInitialState);
  // stores the geoJSON which are selected when user clicks on a polygon
  const [clickedGeoJSON, setClickedGeoJSON] = useState<any[]>([geoJSONInitialState]);
  // stores the plant locations details of the selected geoJSON
  const [selectedPlantLocations, setSelectedPlantLocations] = useState([]);

  const [showSinglePlantLocation, setShowSinglePlantLocation] = useState(false);
  // stores the plant locations details of the selected geoJSON
  const [singleSelectedGeoJSON, setSingleSelectedGeoJSON] = useState(geoJSONInitialState);
  // stores the plant locations details of the selected geoJSON
  const [singleSelectedPlantLocation, setSingleSelectedPlantLocation] = useState();
  const [countryCode, setCountryCode] = useState('');

  const { state, dispatch } = useContext(InventoryContext);

  const camera = useRef<MapboxGL.Camera | null>(null);

  const carouselRef = useRef(null);
  const sampleCarouselRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    if (state.inventoryFetchProgress === inventoryFetchConstant.COMPLETED) {
      initializeInventory();
    }
  }, [state.inventoryFetchProgress, userInfo]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (state?.inventoryID) {
        setLoadingInventoryData(true);
        getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
          setSingleSelectedPlantLocation(inventoryData);
          setLoadingInventoryData(false);
        });
      }
    });
    return () => {
      unsubscribeFocus();
    };
  }, [state]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (state?.inventoryID) {
  //       getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
  //         setSingleSelectedPlantLocation(inventoryData);
  //       });
  //     }
  //     return () => {};
  //   }, [state]),
  // );

  useEffect(() => {
    let isCancelled = false;

    initializeInventory();

    getUserInformation().then(data => {
      setCountryCode(data.country);
    });

    if (!isCancelled) {
      checkPermission();
    }

    return () => {
      isCancelled = true;
      setGeoJSON(geoJSONInitialState);
    };
  }, []);

  useEffect(() => {
    onUpdateUserLocation(location);
  }, [isCameraRefVisible, location]);

  const checkPermission = async (showAlert = true) => {
    try {
      await locationPermission();
      MapboxGL.setTelemetryEnabled(false);

      updateCurrentPosition(showAlert);
      return true;
    } catch (err: any) {
      if (err?.message == 'blocked') {
        setIsPermissionBlocked(true);
      } else if (err?.message == 'denied') {
        setIsPermissionDenied(true);
      } else {
        bugsnag.notify(err);
      }
      return false;
    }
  };

  /**
   * Fetches the registrations details of the polygon which are selected and
   * deletes the polygons from the map if inventory id or data is not present
   * for the selected polygon and updates the same on the map
   * @param features - takes the array of features which are selected by user
   */
  const getSelectedPlantLocations = async (features: any) => {
    const registrations: any = [];
    const indexToDelete: Number[] = [];

    const alreadyAddedInventoryId: any[] = [];
    const newClickedGeoJson: any[] = [];

    for (const i in features) {
      const feature = features[i];
      if (
        feature?.properties?.inventoryId &&
        !alreadyAddedInventoryId.includes(feature?.properties?.inventoryId)
      ) {
        const inventory = await getInventory({ inventoryID: feature.properties.inventoryId });

        if (inventory) {
          const newGeoJson = await getGeoJsonData({
            inventoryData: inventory,
            includeInventoryId: true,
          });
          newClickedGeoJson.push(newGeoJson);

          registrations.push(inventory);
          alreadyAddedInventoryId.push(inventory.inventory_id);
        } else {
          indexToDelete.push(Number(i));
        }
      } else {
        indexToDelete.push(Number(i));
      }
    }

    for (const index of indexToDelete) {
      features.splice(Number(index), 1);
    }

    setClickedGeoJSON(newClickedGeoJson);

    setSelectedPlantLocations(registrations);
    setShowClickedGeoJSON(true);

    if (features.length === 1 && features[0].geometry.type !== POINT) {
      onPressViewSampleTrees(0, registrations, newClickedGeoJson);
    } else if (features.length === 1) {
      navigateToDetailsScreen(registrations[0]);
    }
  };

  // initialize the state by fetching all the geoJSON of the SYNCED registrations
  const initializeInventory = () => {
    getInventoryByStatus([SYNCED]).then(async (syncedInventory: any) => {
      const geoJSONFeatures = [];
      const pointGeoJSONFeatures = [];
      // fetches geoJSON which includes inventory id and ignores sample tree of all the SYNCED registrations
      for (const inventoryData of JSON.parse(JSON.stringify(syncedInventory))) {
        const data: any = await getGeoJsonData({
          inventoryData,
          includeInventoryId: true,
          ignoreSampleTrees: true,
        });
        if (inventoryData.treeType === SINGLE) {
          pointGeoJSONFeatures.push(...data.features);
        } else {
          geoJSONFeatures.push(...data.features);
        }
      }

      setGeoJSON({
        type: 'FeatureCollection',
        features: geoJSONFeatures,
      });
      setPointGeoJSON({
        type: 'FeatureCollection',
        features: pointGeoJSONFeatures,
      });
    });
  };

  // recenter the map to the current coordinates of user location
  const onPressMyLocationIcon = (position: MapboxGL.Location | Geolocation.GeoPosition) => {
    if (isCameraRefVisible && camera?.current?.setCamera) {
      setIsInitial(false);
      camera.current.setCamera({
        centerCoordinate: [position.coords.longitude, position.coords.latitude],
        // centerCoordinate: [-90.133284, 18.675638],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  };

  // only for the first time map will follow the user's current location by default
  const onUpdateUserLocation = (
    userLocation: MapboxGL.Location | Geolocation.GeoPosition | undefined,
  ) => {
    if (isInitial && userLocation) {
      onPressMyLocationIcon(userLocation);
    }
  };

  //getting current position of the user with high accuracy
  const updateCurrentPosition = async (showAlert = true) => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          onUpdateUserLocation(position);
          setLocation(position);
          resolve(position);
        },
        err => {
          if (showAlert) setIsLocationAlertShow(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          accuracy: {
            android: 'high',
            ios: 'bestForNavigation',
          },
        },
      );
    });
  };

  const onPressViewSampleTrees = (
    index: number,
    plantLocations: any = null,
    clickedJSON: any = null,
  ) => {
    plantLocations = plantLocations || selectedPlantLocations;
    clickedJSON = clickedJSON || clickedGeoJSON;

    setInventoryId(plantLocations[index]?.inventory_id || '')(dispatch);
    setSingleSelectedPlantLocation(plantLocations[index]);
    setSingleSelectedGeoJSON(clickedJSON[index]);
    setShowSinglePlantLocation(true);
  };

  const navigateToDetailsScreen = (item: any) => {
    setInventoryId(item.inventory_id)(dispatch);
    if (item.status !== INCOMPLETE && item.status !== INCOMPLETE_SAMPLE_TREE) {
      if (item.treeType === SINGLE) {
        navigation.navigate('SingleTreeOverview', { navigateBackToHomeScreen: true });
      } else {
        navigation.navigate('InventoryOverview', { navigateToScreen: 'MainScreen' });
      }
    } else {
      navigation.navigate(item.lastScreen);
    }
  };

  const navigateBackToClickedGeoJSON = () => {
    setShowSinglePlantLocation(false);
    setSingleSelectedPlantLocation(undefined);
    setSingleSelectedGeoJSON(geoJSONInitialState);
    setInventoryId('')(dispatch);
  };

  const navigateBackToMainMap = () => {
    setShowClickedGeoJSON(false);
    setClickedGeoJSON([geoJSONInitialState]);
    setSelectedPlantLocations([]);
    setInventoryId('')(dispatch);
  };

  return (
    <View style={styles.container}>
      <GeoJSONMap
        setLoader={setLoader}
        setIsCameraRefVisible={setIsCameraRefVisible}
        showClickedGeoJSON={showClickedGeoJSON}
        clickedGeoJSON={clickedGeoJSON}
        carouselRef={carouselRef}
        isCameraRefVisible={isCameraRefVisible}
        camera={camera}
        location={location}
        setLocation={setLocation}
        geoJSON={geoJSON}
        pointGeoJSON={pointGeoJSON}
        getSelectedPlantLocations={getSelectedPlantLocations}
        isCarouselRefVisible={isCarouselRefVisible}
        showSinglePlantLocation={showSinglePlantLocation}
        singleSelectedGeoJSON={singleSelectedGeoJSON}
        isSampleCarouselRefVisible={isSampleCarouselRefVisible}
        sampleCarouselRef={sampleCarouselRef}
        onPressViewSampleTrees={onPressViewSampleTrees}
        siteCenterCoordinate={siteCenterCoordinate}
        siteBounds={siteBounds}
        projectSites={projectSites}
      />

      {/* shows alert if location permission is not provided */}
      <AlertModal
        visible={isLocationAlertShow}
        heading={i18next.t('label.location_service')}
        message={i18next.t('label.location_service_message')}
        primaryBtnText={IS_ANDROID ? i18next.t('label.ok') : i18next.t('label.open_settings')}
        secondaryBtnText={i18next.t('label.back')}
        onPressPrimaryBtn={() => {
          setIsLocationAlertShow(false);
          if (IS_ANDROID) {
            updateCurrentPosition();
          } else {
            Linking.openURL('app-settings:');
          }
        }}
        onPressSecondaryBtn={() => setIsLocationAlertShow(false)}
        showSecondaryButton={true}
      />
      <PermissionBlockedAlert
        isPermissionBlockedAlertShow={isPermissionBlocked}
        setIsPermissionBlockedAlertShow={setIsPermissionBlocked}
        message={i18next.t('label.need_location_permission_to_continue')}
        onPressPrimaryBtn={() => {}}
        onPressSecondaryBtn={() => {
          BackHandler.exitApp();
        }}
      />
      <PermissionDeniedAlert
        isPermissionDeniedAlertShow={isPermissionDenied}
        setIsPermissionDeniedAlertShow={setIsPermissionDenied}
        message={i18next.t('label.need_location_permission_to_continue')}
        onPressPrimaryBtn={() => checkPermission()}
        onPressSecondaryBtn={() => checkPermission()}
      />

      {/* shows the back button when plant location is selected */}
      {/* shows single plant location hid if single plant location is selected */}
      {showClickedGeoJSON || showSinglePlantLocation ? (
        <View style={styles.extraInfoContainer}>
          <BackButton
            onBackPress={() => {
              if (showSinglePlantLocation && selectedPlantLocations.length === 1) {
                navigateBackToClickedGeoJSON();
                navigateBackToMainMap();
              } else if (showSinglePlantLocation) {
                navigateBackToClickedGeoJSON();
              } else {
                navigateBackToMainMap();
              }
            }}
          />
          {showSinglePlantLocation && singleSelectedPlantLocation ? (
            <>
              <Text style={styles.heading}>HID: {singleSelectedPlantLocation?.hid}</Text>
              <TouchableOpacity
                style={styles.textButtonContainer}
                onPress={() => navigateToDetailsScreen(singleSelectedPlantLocation)}>
                <Text style={styles.textButton}>{i18next.t('label.more_details')}</Text>
                <Icon name="chevron-right" size={18} color={Colors.TEXT_COLOR} />
              </TouchableOpacity>
            </>
          ) : (
            []
          )}
        </View>
      ) : (
        <>
          {/* shows my location icons */}
          <View>
            <TouchableOpacity
              onPress={() => {
                if (location) {
                  onPressMyLocationIcon(location);
                } else {
                  checkPermission();
                }
              }}
              style={[styles.myLocationIcon, IS_ANDROID ? { bottom: 72 } : { bottom: 56 }]}
              accessibilityLabel="my_location"
              accessible={true}
              testID="my_location">
              <View>
                <Icon name={'my-location'} size={24} color={Colors.PLANET_BLACK} />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* shows the selected polygon details in horizontal scrollable card */}
      {showSinglePlantLocation ? (
        <SelectedPlantLocationSampleTreesCards
          singleSelectedPlantLocation={singleSelectedPlantLocation}
          carouselRef={sampleCarouselRef}
          setIsCarouselRefVisible={setIsSampleCarouselRefVisible}
          countryCode={countryCode}
          location={location}
          loadingInventoryData={loadingInventoryData}
        />
      ) : selectedPlantLocations.length > 0 && showClickedGeoJSON ? (
        <SelectedPlantLocationsCards
          plantLocations={selectedPlantLocations}
          carouselRef={carouselRef}
          setIsCarouselRefVisible={setIsCarouselRefVisible}
          onPressViewSampleTrees={onPressViewSampleTrees}
          navigateToDetailsScreen={navigateToDetailsScreen}
        />
      ) : (
        []
      )}
    </View>
  );
};

export default MainMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  extraInfoContainer: {
    position: 'absolute',
    top: IS_ANDROID ? 25 : 56,
    left: 25,
    alignItems: 'flex-start',
  },
  backIconContainer: {
    backgroundColor: Colors.WHITE,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  myLocationIcon: {
    position: 'absolute',
    right: -16,
    bottom: 36,
    width: 45,
    height: 45,
    backgroundColor: Colors.WHITE,
    borderRadius: 100,
    marginHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  heading: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    color: Colors.TEXT_COLOR,
    marginTop: 10,
  },
  textButtonContainer: {
    padding: 10,
    borderRadius: 8,
    position: 'relative',
    left: -8,
    top: -4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
