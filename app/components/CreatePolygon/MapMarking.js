import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  Modal,
} from 'react-native';
import { Header, PrimaryButton, Alrighty } from '../Common';
import { Colors } from '_styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { active_marker, marker_png } from '../../assets/index';
import { getInventory, addCoordinates, polygonUpdate } from '../../repositories/inventory';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import { toLetters } from '../../utils/mapMarkingCoordinate';
import distanceCalculator from '../../utils/distanceCalculator';
import { InventoryContext } from '../../reducers/inventory';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const infographicText = [
  {
    heading: i18next.t('label.info_graphic_header_1'),
    subHeading: i18next.t('label.info_graphic_sub_header_1'),
  },
  {
    heading: i18next.t('label.info_graphic_header_2'),
    subHeading: i18next.t('label.info_graphic_sub_header_2'),
  },
  {
    heading: i18next.t('label.info_graphic_header_3'),
    subHeading: i18next.t('label.info_graphic_sub_header_3'),
  },
];
const ALPHABETS = i18next.t('label.locate_tree_alphabets');
const IS_ANDROID = Platform.OS == 'android';

export default function MapMarking({
  inventoryID,
  updateActiveMarkerIndex,
  activeMarkerIndex,
  toggleState,
  setIsCompletePolygon,
}) {
  const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);
  const [isAccuracyModalShow, setIsAccuracyModalShow] = useState(false);
  const [loader, setLoader] = useState(false);
  const [locateTree, setLocateTree] = useState('on-site');
  const [inventory, setInventory] = useState(null);
  const [accuracyInMeters, setAccuracyInMeters] = useState('');
  const [isAlertShow, setIsAlertShow] = useState(false);
  const [isInitial, setIsInitial] = useState(false);
  const [isLocation, setIsLocation] = useState(false);
  const [isLocationAlertShow, setIsLocationAlertShow] = useState(false);
  const [location, setLocation] = useState();

  // currently active polygon index
  const [activePolygonIndex, setActivePolygonIndex] = useState(0);

  const [isShowCompletePolygonButton, setIsShowCompletePolygonButton] = useState();

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
  const camera = useRef(null);
  // used to show alphabet for each map location
  const [alphabets, setAlphabets] = useState([]);

  // reference for map
  const map = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    generateAlphabets();
    initializeState();
    // Do something
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
  }, []);

  // initializes the state by updating state
  const initializeState = () => {
    getInventory({ inventoryID: inventoryID }).then((inventory) => {
      console.log('inventory', inventory);
      if (inventory.polygons.length > 0) {
        let featureList = inventory.polygons.map((onePolygon) => {
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
        let geoJSONData = {
          type: 'FeatureCollection',
          features: featureList,
        };
        if (
          activeMarkerIndex !== null &&
          activeMarkerIndex < geoJSONData.features[0].geometry.coordinates.length
        ) {
          updateActiveMarkerIndex(activeMarkerIndex);
        } else {
          updateActiveMarkerIndex(geoJSONData.features[0].geometry.coordinates.length);
        }
        setGeoJSON(geoJSONData);
      } else {
        updateActiveMarkerIndex(0);
      }
      setLocateTree(inventory.locate_tree);
    });
  };

  // generates the alphabets
  const generateAlphabets = () => {
    let alphabetsArray = [];
    for (var x = 1, y; x <= 130; x++) {
      y = toLetters(x);
      alphabetsArray.push(y);
    }
    setAlphabets(alphabetsArray);
  };

  //only the first time marker will follow the user's current location by default
  const onUpdateUserLocation = (location) => {
    if (!location) {
      return;
    }
    if (!isInitial) {
      onPressMyLocationIcon(location);
    }
  };

  //checks if the marker is within 100 meters range or not and assigns a LocateTree label accordingly
  const addMarker = async () => {
    console.log('locateTree', locateTree);
    if (locateTree === 'on-site') {
      // if (accuracyInMeters < 30 || forceContinue) {
      updateCurrentPosition()
        .then(async () => {
          let currentCoords = [location.coords.latitude, location.coords.longitude];
          let centerCoordinates = await map.current.getCenter();
          console.log('currentCoords', currentCoords);
          console.log('centerCoordinates', centerCoordinates);

          let isValidMarkers = true;
          for (const oneMarker of geoJSON.features[activePolygonIndex].geometry.coordinates) {
            let distance = distanceCalculator(
              centerCoordinates[1],
              centerCoordinates[0],
              oneMarker[1],
              oneMarker[0],
              'K',
            );
            let distanceInMeters = distance * 1000;
            if (distanceInMeters < 10) {
              isValidMarkers = false;
            }
          }

          let distance = distanceCalculator(
            currentCoords[0],
            currentCoords[1],
            centerCoordinates[1],
            centerCoordinates[0],
            'K',
          );

          let distanceInMeters = distance * 1000;

          console.log('isValidMarkers', isValidMarkers);
          console.log('distanceInMeters', distanceInMeters);
          if (!isValidMarkers) {
            alert(i18next.t('label.locate_tree_add_marker_valid'));
          } else if (distanceInMeters < 100) {
            pushMaker(currentCoords);
          } else {
            alert(i18next.t('label.locate_tree_add_marker_invalid'));
          }
        })
        .catch((err) => {
          alert(JSON.stringify(err), 'Alert');
        });
      // } else {
      //   setIsAlertShow(true);
      // }
    } else {
      setIsAccuracyModalShow(true);
      try {
        Geolocation.getCurrentPosition(
          (position) => {
            let currentCoords = position.coords;
            pushMaker(currentCoords);
          },
          (err) => alert(err.message),
        );
      } catch (err) {
        alert('Unable to retrive location');
      }
    }
    // Check distance
  };

  const pushMaker = async (currentCoords) => {
    geoJSON.features[0].geometry.coordinates[activeMarkerIndex] = await map.current.getCenter();

    setGeoJSON(geoJSON);

    let data = {
      inventory_id: inventoryID,
      geoJSON: geoJSON,
      currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
    };
    addCoordinates(data).then(() => {
      if (locateTree === 'on-site') {
        toggleState();
      } else {
        // For off site
        // if (complete) {
        //   navigation.navigate('InventoryOverview');
        // } else {
        updateActiveMarkerIndex(activeMarkerIndex + 1);
        // }
      }
    });
  };

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => setLoader(false);

  const renderFakeMarker = () => {
    return (
      <View style={styles.fakeMarkerCont}>
        <SvgXml xml={active_marker} style={styles.markerImage} />
        {loader ? (
          <ActivityIndicator color={Colors.WHITE} style={styles.loader} />
        ) : (
          <Text style={styles.activeMarkerLocation}>{alphabets[activeMarkerIndex]}</Text>
        )}
      </View>
    );
  };

  const renderMapView = () => {
    let shouldRenderShape = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;
    return (
      <MapboxGL.MapView
        showUserLocation={true}
        style={styles.container}
        ref={map}
        onRegionWillChange={onChangeRegionStart}
        onRegionDidChange={onChangeRegionComplete}>
        {renderMarkers()}

        <MapboxGL.Camera ref={camera} />
        {shouldRenderShape && (
          <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
          </MapboxGL.ShapeSource>
        )}
        <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={onUpdateUserLocation} />
      </MapboxGL.MapView>
    );
  };

  const renderMarkers = () => {
    const markers = [];
    for (let i = 0; i < geoJSON.features.length; i++) {
      let onePolygon = geoJSON.features[i];

      for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
        let oneMarker = onePolygon.geometry.coordinates[j];
        markers.push(
          <MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker}>
            <ImageBackground
              source={marker_png}
              style={styles.markerContainer}
              resizeMode={'cover'}>
              <Text style={styles.markerText}>{alphabets[j]}</Text>
            </ImageBackground>
          </MapboxGL.PointAnnotation>,
        );
      }
    }
    return markers;
  };

  const onPressCompletePolygon = async () => {
    setIsCompletePolygon(true);

    geoJSON.features[0].properties.isPolygonComplete = true;
    geoJSON.features[0].geometry.coordinates.push(geoJSON.features[0].geometry.coordinates[0]);
    let lastCoords = geoJSON.features[0].geometry.coordinates[0];
    addCoordinates({
      inventory_id: inventoryID,
      geoJSON: geoJSON,
      currentCoords: { latitude: lastCoords.latitude, longitude: lastCoords.longitude },
    }).then(() => {
      if (locateTree === 'on-site') {
        console.log('onsite locate tree');
      } else {
        // For off site
        this.props.navigation.navigate('InventoryOverview');
      }
    });
  };

  //recenter the marker to the current coordinates
  const onPressMyLocationIcon = (position) => {
    var recenterCoords;
    if (position) {
      recenterCoords = [position.coords.longitude, position.coords.latitude];
    } else {
      recenterCoords = [location.coords.longitude, location.coords.latitude];
    }
    setIsInitial(true);
    camera.current.setCamera({
      centerCoordinate: recenterCoords,
      zoomLevel: 18,
      animationDuration: 2000,
    });
  };

  //getting current position of the user with high accuracy
  const updateCurrentPosition = async () => {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('position', position);
          setAccuracyInMeters(position.coords.accuracy);
          onUpdateUserLocation(position);
          setLocation(position);
          setIsLocation(true);
          resolve(true);
        },
        (err) => {
          console.error('geolocation error', err);
          setIsLocationAlertShow(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 20000,
          accuracy: {
            android: 'high',
            ios: 'bestForNavigation',
          },
        },
      );
    });
  };

  const renderMyLocationIcon = () => {
    return (
      <TouchableOpacity
        onPress={() => {
          if (location) {
            onPressMyLocationIcon(location);
          } else {
            setIsLocationAlertShow(true);
          }
        }}
        style={[styles.myLocationIcon]}
        accessibilityLabel="Register Tree Camera"
        accessible={true}
        testID="register_tree_camera">
        <View style={Platform.OS == 'ios' && styles.myLocationIconContainer}>
          <Icon name={'my-location'} size={22} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAlrightyModal = () => {
    console.log('renderAlrightyModal create poly');

    let coordsLength = geoJSON.features[activePolygonIndex].geometry.coordinates.length;
    const onPressContinue = () => setIsAlrightyModalShow(false);
    const updateAndCompletePolygon = () => {
      polygonUpdate({ inventory_id: inventoryID }).then(() => {
        onPressCompletePolygon();
        onPressContinue();
      });
    };

    const onPressClose = () => {
      updateActiveMarkerIndex(activeMarkerIndex - 1);
      setIsAlrightyModalShow(false);
    };

    let infoIndex = coordsLength <= 1 ? 0 : coordsLength <= 2 ? 1 : 2;
    const { heading, subHeading } = infographicText[infoIndex];

    return (
      <Modal animationType={'slide'} visible={isAlrightyModalShow}>
        <View style={styles.mainContainer}>
          <Alrighty
            coordsLength={coordsLength}
            onPressContinue={onPressContinue}
            onPressWhiteButton={updateAndCompletePolygon}
            onPressClose={onPressClose}
            heading={heading}
            subHeading={subHeading}
          />
        </View>
      </Modal>
    );
  };

  const onPressBack = () => {
    navigation.navigate('TreeInventory');
  };

  // useEffect(() => {
  //   setIsShowCompletePolygonButton(
  //     geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1,
  //   );
  // }, [geoJSON]);

  return (
    <View style={styles.container} fourceInset={{ top: 'always' }}>
      <View style={styles.headerCont}>
        {/* <SafeAreaView /> */}
        <Header
          onBackPress={onPressBack}
          headingText={`${i18next.t('label.locate_tree_location')} ${
            alphabets.length > 0 ? alphabets[activeMarkerIndex] : ''
          }`}
          closeIcon
          subHeadingText={i18next.t('label.locate_tree_map_marking_sub_header')}
        />
      </View>
      <View style={styles.container}>
        {renderMapView()}
        {renderFakeMarker()}
      </View>
      <View>
        {renderMyLocationIcon()}
        <View style={styles.continueBtnCont}>
          <PrimaryButton
            disabled={loader}
            onPress={addMarker}
            btnText={i18next.t('label.tree_map_marking_btn')}
            style={styles.bottonBtnContainer}
          />
        </View>
      </View>

      {renderAlrightyModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  continueBtnCont: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'transparent',
    width: '100%',
    justifyContent: 'center',
  },
  completePolygonBtnCont: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    backgroundColor: 'transparent',
    width: '100%',
    justifyContent: 'center',
  },
  bottonBtnContainer: {
    width: '90%',
  },
  headerCont: {
    paddingHorizontal: 25,
    width: '100%',
  },
  fakeMarkerCont: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    position: 'absolute',
    resizeMode: 'contain',
    bottom: 0,
  },
  loader: {
    position: 'absolute',
    bottom: 67,
  },
  activeMarkerLocation: {
    position: 'absolute',
    bottom: 67,
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
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
    borderColor: Colors.TEXT_COLOR,
    bottom: 90,
  },
  myLocationIconContainer: {
    top: 1.5,
    left: 0.8,
  },
  markerContainer: {
    width: 30,
    height: 43,
    paddingBottom: 85,
  },
  markerText: {
    width: 30,
    height: 43,
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    paddingTop: 4,
  },
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
