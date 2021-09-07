import MapboxGL, { LineLayerStyle } from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleProp, StyleSheet, TouchableOpacity, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getInventory, getInventoryByStatus } from '../../repositories/inventory';
import { Colors } from '../../styles';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import { SYNCED } from '../../utils/inventoryConstants';
import { AlertModal } from '../Common';
import SelectedPlantLocations from './SelectedPlantLocations';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import { BBox, Feature, Point, Polygon } from '@turf/helpers';

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
          type: 'LineString',
          coordinates: [],
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
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  // stores the geoJSON
  const [geoJSON, setGeoJSON] = useState(geoJSONInitialState);
  // stores the geoJSON which are selected when user clicks on a polygon
  const [clickedGeoJSON, setClickedGeoJSON] = useState<any[]>([geoJSONInitialState]);
  // stores the plant locations details of the selected geoJSON
  const [selectedPlantLocations, setSelectedPlantLocations] = useState([]);
  // sets the bound to focus the selected polygon
  const [bounds, setBounds] = useState<any>([]);
  // used to store and focus on the center of the bounding box of the polygon selected
  const [centerCoordinate, setCenterCoordinate] = useState<any>([]);

  const camera = useRef<MapboxGL.Camera | null>(null);
  const map = useRef(null);
  const carouselRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    let isCancelled = false;

    initializeInventory();

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

  useEffect(() => {
    if (isCameraRefVisible && carouselRef?.current) {
      setActiveCarouselIndex(carouselRef.current.currentIndex);
      const selectedGeoJSON = clickedGeoJSON[carouselRef.current.currentIndex];

      setCenterCoordinate(turfCenter(selectedGeoJSON.features[0]));

      setBounds(bbox(selectedGeoJSON.features[0]));
    }
  }, [carouselRef?.current?.currentIndex, isCarouselRefVisible]);

  // used to focus the selected polygon whenever the bounds are changed or center coordinate is updated
  useEffect(() => {
    if (isCameraRefVisible && bounds.length > 0 && camera?.current?.fitBounds) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 100, 1000);
    }
    if (isCameraRefVisible && centerCoordinate.length > 0 && camera?.current?.setCamera) {
      let config = {
        centerCoordinate,
      };
      camera.current.setCamera(config);
    }
  }, [isCameraRefVisible, bounds, centerCoordinate]);

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

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => {
    setLoader(false);
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

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.container}
        ref={map}
        compassViewPosition={3}
        compassViewMargins={{
          x: 30,
          y: 180,
        }}
        logoEnabled
        onRegionWillChange={onChangeRegionStart}
        onRegionDidChange={onChangeRegionComplete}>
        <MapboxGL.Camera
          ref={(el) => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />

        {/* Shows only clicked polygons after user clicks on the polygon. */}
        {/* Can show more than 1 if clicked on overlapping polygons.  */}
        {/* If not clicked on any polygon then shows all the polygons. */}
        {showClickedGeoJSON && clickedGeoJSON.length > 0 ? (
          clickedGeoJSON.map((singleGeoJson, index) => {
            return (
              <MapboxGL.ShapeSource
                id={`polygonClicked-${index}`}
                shape={singleGeoJson}
                onPress={(e) => {
                  if (isCarouselRefVisible) {
                    carouselRef.current.snapToItem(index);
                    setActiveCarouselIndex(index);
                  }
                }}>
                <MapboxGL.FillLayer
                  id={`polyFillClicked-${index}`}
                  style={activeCarouselIndex !== index ? inactiveFillStyle : fillStyle}
                />
                <MapboxGL.LineLayer
                  id={`polylineClicked-${index}`}
                  style={activeCarouselIndex !== index ? inactivePolyline : polyline}
                />

                <MapboxGL.CircleLayer
                  id={`circleClicked-${index}`}
                  style={activeCarouselIndex !== index ? inactiveCircleStyle : circleStyle}
                  // belowLayerID={'polylineClicked'}
                  // belowLayerID={
                  //   activeCarouselIndex !== index
                  //     ? `polylineClicked-${activeCarouselIndex}`
                  //     : undefined
                  // }
                  // aboveLayerID={`polyFillClicked-${index}`}
                />
              </MapboxGL.ShapeSource>
            );
          })
        ) : (
          <MapboxGL.ShapeSource
            id={'polygon'}
            shape={geoJSON}
            onPress={(e) => {
              if (e?.features.length > 0) {
                console.log(e?.features.length, e?.features);
                getSelectedPlantLocations(e.features);
              }
            }}>
            <MapboxGL.FillLayer id={'polyFill'} style={fillStyle} />
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
            {/* <MapboxGL.CircleLayer id={'circle'} style={circleStyle} aboveLayerID={'fillpoly'} /> */}
          </MapboxGL.ShapeSource>
        )}
        {location && (
          <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={(data) => setLocation(data)} />
        )}
      </MapboxGL.MapView>

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
      {showClickedGeoJSON ? (
        <TouchableOpacity
          onPress={() => {
            console.log('setShowClickedGeoJSON');
            setShowClickedGeoJSON(false);
            setClickedGeoJSON(geoJSONInitialState);
            setSelectedPlantLocations([]);
          }}
          style={styles.backIconContainer}>
          <Icon name="chevron-left" size={30} />
        </TouchableOpacity>
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
      {selectedPlantLocations.length > 0 && showClickedGeoJSON ? (
        <SelectedPlantLocations
          plantLocations={selectedPlantLocations}
          setIsCarouselRefVisible={setIsCarouselRefVisible}
          carouselRef={carouselRef}
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
  backIconContainer: {
    backgroundColor: Colors.WHITE,
    padding: 10,
    borderRadius: 16,
    position: 'absolute',
    top: 25,
    left: 25,
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
});
const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PRIMARY,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
};
const inactivePolyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PLANET_BLACK,
  lineOpacity: 0.3,
  lineJoin: 'bevel',
};

const fillStyle = { fillColor: Colors.PRIMARY, fillOpacity: 0.3 };
const inactiveFillStyle = { fillColor: Colors.PLANET_BLACK, fillOpacity: 0.2 };

const circleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 1 };
const inactiveCircleStyle = { circleColor: Colors.PLANET_BLACK, circleOpacity: 0.2 };
