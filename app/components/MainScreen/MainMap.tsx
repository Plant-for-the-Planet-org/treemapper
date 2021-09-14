import MapboxGL, { LineLayerStyle } from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/core';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getInventory, getInventoryByStatus } from '../../repositories/inventory';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import { SYNCED } from '../../utils/inventoryConstants';
import { AlertModal } from '../Common';
import GeoJSONMap from './GeoJSONMap';
import SelectedPlantLocationSampleTreesCards from './SelectedPlantLocationSampleTreesCards';
import SelectedPlantLocationsCards from './SelectedPlantLocationsCards';

const IS_ANDROID = Platform.OS === 'android';

interface IMainMapProps {
  showClickedGeoJSON: boolean;
  setShowClickedGeoJSON: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainMap = ({ showClickedGeoJSON, setShowClickedGeoJSON }: IMainMapProps) => {
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

  const [isCarouselRefVisible, setIsCarouselRefVisible] = useState(false);
  const [isSampleCarouselRefVisible, setIsSampleCarouselRefVisible] = useState(false);

  // stores the geoJSON
  const [geoJSON, setGeoJSON] = useState(geoJSONInitialState);
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

  const camera = useRef<MapboxGL.Camera | null>(null);

  const carouselRef = useRef(null);
  const sampleCarouselRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    let isCancelled = false;

    initializeInventory();

    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });

    if (!isCancelled) {
      if (IS_ANDROID) {
        MapboxGL.requestAndroidLocationPermissions().then((permission) => {
          if (permission) {
            MapboxGL.setTelemetryEnabled(false);
            updateCurrentPosition();
          }
        });
      } else {
        Geolocation.requestAuthorization('whenInUse').then((permission) => {
          if (permission === 'granted') {
            updateCurrentPosition();
          } else {
            setIsLocationAlertShow(true);
          }
        });
      }
    }

    return () => {
      isCancelled = true;
    };
  }, []);

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

    console.log('\n\nindexToDelete', indexToDelete);

    for (const index of indexToDelete) {
      features.splice(Number(index), 1);
    }

    setClickedGeoJSON(newClickedGeoJson);

    // console.log('\n\n', registrations, registrations.length);
    setSelectedPlantLocations(registrations);
    setShowClickedGeoJSON(true);
  };

  // initialize the state by fetching all the geoJSON of the SYNCED registrations
  const initializeInventory = () => {
    getInventoryByStatus([SYNCED]).then(async (syncedInventory: any) => {
      const geoJSONFeatures = [];
      // fetches geoJSON which includes inventory id and ignores sample tree of all the SYNCED registrations
      for (const inventoryData of syncedInventory) {
        const data: any = await getGeoJsonData({
          inventoryData,
          includeInventoryId: true,
          ignoreSampleTrees: true,
        });
        geoJSONFeatures.push(...data.features);
      }

      console.log('geoJSONFeatures', geoJSONFeatures.length);
      setGeoJSON({
        type: 'FeatureCollection',
        features: geoJSONFeatures,
      });
    });
  };

  // recenter the map to the current coordinates of user location
  const onPressMyLocationIcon = (position: MapboxGL.Location | Geolocation.GeoPosition) => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }
    if (isCameraRefVisible && camera?.current?.setCamera) {
      setIsInitial(false);
      camera.current.setCamera({
        // centerCoordinate: [position.coords.longitude, position.coords.latitude],
        centerCoordinate: [-90.133284, 18.675638],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  };

  // only for the first time map will follow the user's current location by default
  const onUpdateUserLocation = (userLocation: MapboxGL.Location | Geolocation.GeoPosition) => {
    if (isInitial && userLocation) {
      onPressMyLocationIcon(userLocation);
    }
  };

  //getting current position of the user with high accuracy
  const updateCurrentPosition = async () => {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          onUpdateUserLocation(position);
          setLocation(position);
          resolve(position);
        },
        (err) => {
          setIsLocationAlertShow(true);
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

  const onPressViewSampleTrees = (index: number) => {
    console.log('onPressViewSampleTrees', index);
    setSingleSelectedPlantLocation(selectedPlantLocations[index]);
    setSingleSelectedGeoJSON(clickedGeoJSON[index]);
    setShowSinglePlantLocation(true);
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
        getSelectedPlantLocations={getSelectedPlantLocations}
        isCarouselRefVisible={isCarouselRefVisible}
        showSinglePlantLocation={showSinglePlantLocation}
        singleSelectedGeoJSON={singleSelectedGeoJSON}
        isSampleCarouselRefVisible={isSampleCarouselRefVisible}
        sampleCarouselRef={sampleCarouselRef}
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

      {/* shows the back button when plant location is selected */}
      {/* shows single plant location hid if single plant location is selected */}
      {showClickedGeoJSON || showSinglePlantLocation ? (
        <View style={styles.extraInfoContainer}>
          <TouchableOpacity
            onPress={() => {
              if (showSinglePlantLocation) {
                console.log('showSinglePlantLocation');
                setShowSinglePlantLocation(false);
                setSingleSelectedPlantLocation(undefined);
                setSingleSelectedGeoJSON(geoJSONInitialState);
              } else {
                console.log('setShowClickedGeoJSON');
                setShowClickedGeoJSON(false);
                setClickedGeoJSON([geoJSONInitialState]);
                setSelectedPlantLocations([]);
              }
            }}
            style={styles.backIconContainer}>
            <Icon name="chevron-left" size={30} />
          </TouchableOpacity>
          {showSinglePlantLocation && singleSelectedPlantLocation ? (
            <>
              <Text style={styles.heading}>HID: {singleSelectedPlantLocation?.hid}</Text>
              <TouchableOpacity style={styles.textButtonContainer}>
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
                  setIsLocationAlertShow(true);
                }
              }}
              style={[styles.myLocationIcon, Platform.OS === 'ios' ? { bottom: 160 } : {}]}
              accessibilityLabel="Register Tree Camera"
              accessible={true}
              testID="register_tree_camera">
              <View style={Platform.OS === 'ios' && styles.myLocationIconContainer}>
                <Icon name={'my-location'} size={22} />
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
        />
      ) : selectedPlantLocations.length > 0 && showClickedGeoJSON ? (
        <SelectedPlantLocationsCards
          plantLocations={selectedPlantLocations}
          carouselRef={carouselRef}
          setIsCarouselRefVisible={setIsCarouselRefVisible}
          onPressViewSampleTrees={onPressViewSampleTrees}
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
    top: 25,
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
    width: 45,
    height: 45,
    backgroundColor: Colors.WHITE,
    position: 'absolute',
    borderRadius: 100,
    right: 0,
    marginHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    bottom: 80,
  },
  myLocationIconContainer: {
    top: 1.5,
    left: 0.8,
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
