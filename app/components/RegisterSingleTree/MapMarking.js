import Geolocation from 'react-native-geolocation-service';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  ImageBackground,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  PermissionsAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Config from 'react-native-config';
import LinearGradient from 'react-native-linear-gradient';
import { SvgXml } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '_styles';
import { active_marker, marker_png, off_site_enable_banner } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { addCoordinateSingleRegisterTree, getInventory } from '../../repositories/inventory';
import { AlertModal, Alrighty, Header, PrimaryButton } from '../Common';
import distanceCalculator from '../../utils/distanceCalculator';
import { Typography } from '_styles';
import { bugsnag } from '_utils';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const IS_ANDROID = Platform.OS === 'android';

const MapMarking = ({ updateScreenState, inventoryState }) => {
  const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);
  const [centerCoordinates, setCenterCoordinates] = useState([0, 0]);
  const [isAccuracyModalShow, setIsAccuracyModalShow] = useState(false);
  const [loader, setLoader] = useState(false);
  const [markedCoords, setMarkedCoords] = useState(null);
  const [locateTree, setLocateTree] = useState('on-site');
  const [inventory, setInventory] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [accuracyInMeters, setAccuracyInMeters] = useState('');
  const [isAlertShow, setIsAlertShow] = useState(false);
  const [isInitial, setIsInitial] = useState(false);
  const [isLocation, setIsLocation] = useState(false);
  const [isLocationAlertShow, setIsLocationAlertShow] = useState(false);
  const [location, setLocation] = useState(null);
  const camera = useRef(null);
  const map = useRef(null);
  const navigation = useNavigation();
  useEffect(() => {
    if (IS_ANDROID) {
      MapboxGL.requestAndroidLocationPermissions().then((permission) => {
        console.log(permission, 'permission');
        if (permission) {
          MapboxGL.setTelemetryEnabled(false);
          updateCurrentPosition();
        }
      });
    }
    console.log(inventoryState, 'inventoryState');
    const { inventoryID } = inventoryState.inventoryID;
    console.log(inventoryID, 'inventoryID');
    getInventory({ inventoryID: inventoryID }).then((inventory) => {
      setInventory(inventory);
      if (inventory.polygons.length !== 0) {
        const { latitude, longitude } = inventory.polygons[0].coordinates[0];
        // this.onUpdateUserLocation([longitude, latitude]);
        console.log([longitude, latitude], 'setMarkedCoords already present');
        setMarkedCoords([longitude, latitude]);
      }
    });
  }, []);

  const renderFakeMarker = () => {
    return (
      <View style={styles.fakeMarkerCont}>
        <SvgXml xml={active_marker} style={styles.markerImage} />
      </View>
    );
  };

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = async () => {
    const center = await map.current.getCenter();
    console.log(center, 'center onChangeRegionComplete');
    setCenterCoordinates(center);
    setLoader(false);
  };

  const onUpdateUserLocation = (location) => {
    if (!location) {
      // alert('Unable to retrieve location')
      return;
    }
    // else {
    //   const currentCoords = [location.coords.longitude, location.coords.latitude];
    //   setCenterCoordinates(currentCoords);
    // }
    if (!isInitial) {
      const currentCoords = [location.coords.longitude, location.coords.latitude];
      console.log(currentCoords, 'currentCoords');
      setCenterCoordinates(currentCoords);
      setIsInitial(true);
      camera.current.setCamera({
        centerCoordinate: currentCoords,
        zoomLevel: 18,
        animationDuration: 2000,
      });
    }
  };

  const addMarker = async () => {
    // Check distance
    console.log(accuracy, 'accuracy');
    if (accuracy !== 'Bad') {
      try {
        updateCurrentPosition().then(() => {
          let currentCoords = [location.coords.latitude, location.coords.longitude];
          console.log(currentCoords, 'currentCoords addMarker');
          let markerCoords = centerCoordinates;
          console.log(location, 'location addMarker');
          console.log(centerCoordinates, 'centerCoordinates addMarker');
          let distance = distanceCalculator(
            currentCoords[0],
            currentCoords[1],
            centerCoordinates[1],
            centerCoordinates[0],
            'K',
          );

          let distanceInMeters = distance * 1000;
          console.log(distanceInMeters, 'distanceInMeters');
          if (distanceInMeters < 100) {
            setLocateTree('on-site');
          } else {
            setLocateTree('off-site');
          }
          onPressContinue(currentCoords);
        });
      } catch (err) {
        alert(JSON.stringify(err), 'Alert');
      }
    } else {
      setIsAlertShow(true);
    }
  };

  const pushMaker = (currentCoords) => {
    console.log(centerCoordinates, 'centerCoordinates pushMaker');
    setMarkedCoords(centerCoordinates);
    onPressContinue();
  };

  const renderMarker = () => {
    return (
      markedCoords && (
        <MapboxGL.PointAnnotation
          key={'markerCoordskey'}
          id={'markerCoordsid'}
          coordinate={markedCoords}>
          {/* <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
            <Text style={styles.markerText}>{'A'}</Text>
          </ImageBackground> */}
        </MapboxGL.PointAnnotation>
      )
    );
  };

  const renderMapView = () => {
    return (
      <MapboxGL.MapView
        showUserLocation={true}
        style={styles.container}
        ref={map}
        onRegionWillChange={onChangeRegionStart}
        onRegionDidChange={onChangeRegionComplete}>
        <MapboxGL.Camera ref={camera} />
        {isLocation && (
          <MapboxGL.UserLocation
            showsUserHeadingIndicator
            onUpdate={() => {
              updateCurrentPosition();
            }}
          />
        )}
      </MapboxGL.MapView>
    );
  };

  const renderMyLocationIcon = () => {
    return (
      <TouchableOpacity
        onPress={() => {
          setIsInitial(false);
          onUpdateUserLocation(location);
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

  const updateCurrentPosition = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        // console.log(refresh, 'refresh');
        setAccuracyInMeters(position.coords.accuracy);
        accuracyRating();
        onUpdateUserLocation(position);
        setLocation(position);
        setIsLocation(true);
      },
      (err) => {
        console.log(err, 'updateCurrentPosition');
        setIsLocationAlertShow(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 2000,
        maximumAge: 20000,
        accuracy: {
          android: 'high',
          ios: 'bestForNavigation',
        },
      },
    );
  };
  const accuracyRating = () => {
    if (accuracyInMeters < 10) {
      setAccuracy('Good');
    } else if (accuracyInMeters < 31) {
      setAccuracy('Fair');
    } else {
      setAccuracy('Bad');
    }
  };

  const onPressContinue = (currentCoords) => {
    const inventoryID = inventoryState.inventoryID;
    console.log(markedCoords, inventoryID, 'inventoryID');
    setMarkedCoords(centerCoordinates);
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position, 'position onPressContinue');
        let currentCoords = position.coords;
        addCoordinateSingleRegisterTree({
          inventory_id: inventoryID,
          markedCoords: centerCoordinates,
          locateTree: locateTree,
          currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
        }).then(() => {
          setIsAlrightyModalShow(true);
        });
      },
      (err) => {
        console.log(err, 'onPressContinue');
        alert(err.message);
      },
      // { enableHighAccuracy: true },
    );
  };

  const renderAlrightyModal = () => {
    const onPressClose = () => setIsAlrightyModalShow(false);
    const moveScreen = () => updateScreenState('ImageCapturing');
    const offSiteContinue = () => {
      navigation.navigate('SelectSpecies', {
        inventory: inventory,
        visible: true,
      });
      onPressClose();
    };

    let subHeading = i18next.t('label.alright_modal_sub_header');
    let heading = i18next.t('label.alright_modal_header');
    let bannerImage = undefined;
    let whiteBtnText = i18next.t('label.alright_modal_white_btn');
    if (locateTree == 'off-site') {
      subHeading = i18next.t('label.alright_modal_off_site_sub_header');
      heading = i18next.t('label.alright_modal_off_site_header');
      bannerImage = off_site_enable_banner;
      whiteBtnText = undefined;
    }
    return (
      <Modal animationType={'slide'} visible={isAlrightyModalShow}>
        <View style={styles.cont}>
          <Alrighty
            closeIcon
            bannerImage={bannerImage}
            onPressClose={onPressClose}
            onPressWhiteButton={onPressClose}
            onPressContinue={locateTree === 'off-site' ? offSiteContinue : moveScreen}
            heading={heading}
            subHeading={subHeading}
            whiteBtnText={whiteBtnText}
          />
        </View>
      </Modal>
    );
  };

  const onPressBack = () => {
    // const { activeMarkerIndex, updateActiveMarkerIndex, navigation, toogleState2 } = this.props;
    navigation.navigate('TreeInventory');
    return;
    // if (locateTree == 'off-site') {
    //   if (activeMarkerIndex > 0) {
    //     this.setState({ isAlrightyModalShow: true });
    //   } else {
    //     navigation.goBack();
    //   }
    // } else {
    //   // on-site
    //   if (activeMarkerIndex > 0) {
    //     updateActiveMarkerIndex(activeMarkerIndex - 1);
    //     toogleState2();
    //   } else {
    //     navigation.goBack();
    //   }
    // }
  };

  const renderAccuracyModal = () => {
    return (
      <Modal transparent visible={isAccuracyModalShow}>
        <View style={styles.modalContainer}>
          <View style={styles.contentContainer}>
            <Text
              style={{
                color: '#000000',
                fontFamily: Typography.FONT_FAMILY_BOLD,
                fontSize: Typography.FONT_SIZE_18,
                paddingBottom: 18,
              }}>
              GPS Accuracy
            </Text>
            <Text style={styles.accuracyModalText}>
              You can use the GPS data to determine accuracy of a location. Tree Mapper only allows
              on site registration if location is accurate to 25 meter
            </Text>
            <Text style={styles.accuracyModalText}>
              <Text style={{ color: '#87B738', fontFamily: Typography.FONT_FAMILY_BOLD }}>
                Green
              </Text>{' '}
              = Accurate to 5 meter
            </Text>
            <Text style={styles.accuracyModalText}>
              <Text style={{ color: '#CBBB03', fontFamily: Typography.FONT_FAMILY_BOLD }}>
                Yellow
              </Text>{' '}
              = Accurate to 25 meter
            </Text>
            <Text style={styles.accuracyModalText}>
              <Text style={{ color: '#FF0000', fontFamily: Typography.FONT_FAMILY_BOLD }}>Red</Text>{' '}
              = Greater than 25 meter
            </Text>
            <TouchableOpacity
              style={{
                alignSelf: 'center',
                paddingTop: 25,
              }}>
              <Text
                style={{
                  color: '#87B738',
                  fontFamily: Typography.FONT_FAMILY_REGULAR,
                  fontSize: Typography.FONT_SIZE_14,
                }}
                onPress={() => setIsAccuracyModalShow(false)}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderConfirmationModal = () => {
    return (
      <AlertModal
        visible={isAlertShow}
        heading={'Poor Accuracy'}
        message={
          'Your location accuracy is POOR, which is not recommended. Are you sure you want to continue?'
        }
        primaryBtnText={'Try Again'}
        secondaryBtnText={'Continue'}
        onPressPrimaryBtn={onPressTryAgain}
        onPressSecondaryBtn={onPressAlertContinue}
      />
    );
  };

  const renderLocationAlert = () => {
    return (
      <AlertModal
        visible={isLocationAlertShow}
        heading={'Alert'}
        message={'Location settings are not satisfied'}
        primaryBtnText={'Ok'}
        onPressPrimaryBtn={() => {
          setIsLocationAlertShow(false);
          onPressBack();
        }}
      />
    );
  };

  const onPressTryAgain = () => {
    setIsAlertShow(false);
  };

  const onPressAlertContinue = () => {
    setAccuracy('ForceContinue');
    setIsAlertShow(false);
    addMarker();
  };

  const renderAccuracyInfo = () => {
    return (
      <TouchableOpacity
        style={[
          styles.gpsContainer,
          accuracy == 'Good'
            ? { backgroundColor: '#1CE003' }
            : accuracy == 'Fair'
              ? { backgroundColor: '#FFC400' }
              : { backgroundColor: '#FF0000' },
        ]}
        onPress={() => setIsAccuracyModalShow(true)}>
        <Text style={styles.gpsText}>GPS ~{Math.round(accuracyInMeters * 100) / 100}m</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} fourceInset={{ top: 'always' }}>
      <View style={styles.container}>
        {renderMapView()}
        {renderFakeMarker()}
      </View>
      <View>
        {renderMyLocationIcon()}
        <View style={styles.continueBtnCont}>
          <PrimaryButton
            onPress={() => addMarker()}
            disabled={loader}
            btnText={i18next.t('label.tree_map_marking_btn')}
            style={styles.bottomBtnWith}
          />
        </View>
      </View>
      <LinearGradient style={styles.headerCont} colors={[Colors.WHITE, 'rgba(255, 255, 255, 0)']}>
        <SafeAreaView />
        <Header
          onBackPress={onPressBack}
          closeIcon
          headingText={i18next.t('label.tree_map_marking_header')}
          topRightComponent={renderAccuracyInfo}
        />
      </LinearGradient>
      <View></View>
      {renderAccuracyModal()}
      {renderConfirmationModal()}
      {renderLocationAlert()}
      {renderAlrightyModal()}
    </View>
  );
};

export default function MapMarkingMain(props) {
  const navigation = useNavigation();
  const { state } = useContext(InventoryContext);
  return <MapMarking {...props} {...state} navigation={navigation} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
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
  headerCont: {
    paddingHorizontal: 25,
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    width: '100%',
  },
  gpsContainer: {
    marginTop: 20,
    width: 96,
    height: 24,
    backgroundColor: '#FFC400',
    borderRadius: 25,
  },
  gpsText: {
    color: '#FFFFFF',
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    backgroundColor: Colors.WHITE,
    width: 300,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingLeft: 25,
    paddingRight: 15,
    paddingVertical: 25,
  },
  accuracyModalText: {
    color: '#000000',
    lineHeight: 26,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
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
  bottomBtnWith: {
    width: '90%',
  },
});
