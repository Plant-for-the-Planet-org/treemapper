import Geolocation from 'react-native-geolocation-service';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext } from 'react';
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

class MapMarking extends React.Component {
  state = {
    isAlrightyModalShow: false,
    centerCoordinates: [0, 0],
    // activePolygonIndex: 0,
    isAccuracyModalShow: false,
    loader: false,
    markedCoords: null,
    locateTree: 'on-site',
    inventory: null,
    accuracy: null,
    isGranted: false,
    isAlertShow: false,
  };

  async UNSAFE_componentWillMount() {
    if (IS_ANDROID) {
      MapboxGL.requestAndroidLocationPermissions().then((permission) => {
        console.log(permission, 'permission');
        this.setState({ isGranted: permission });
        if (permission) {
          MapboxGL.setTelemetryEnabled(false);
        }
      });
      // await MapboxGL.requestAndroidLocationPermissions().then(async () => {
      //   try {
      //     console.log('Asking permission');
      //     const granted = await PermissionsAndroid.request(
      //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      //       {
      //         title: 'Location Permission',
      //         message: 'App needs access to High accuracy location',
      //         buttonPositive: 'Ok',
      //       },
      //     );
      //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      //       console.log('Permission granted');
      //       this.setState({ isGranted: true });
      //       return true;
      //     } else {
      //       Alert.alert(
      //         'Permission Denied!',
      //         'You need to give location permission to register on-site tree',
      //       );
      //       return false;
      //     }
      //   } catch (err) {
      //     bugsnag.notify(err);
      //     console.log(err, 'Permission error');
      //     return false;
      //   }
      // });
    }
  }

  componentDidMount() {
    const { inventoryID } = this.props;
    getInventory({ inventoryID: inventoryID }).then((inventory) => {
      this.setState({ inventory: inventory });
      if (inventory.polygons.length !== 0) {
        const { latitude, longitude } = inventory.polygons[0].coordinates[0];
        // this.onUpdateUserLocation([longitude, latitude]);
        this.setState({ markedCoords: [longitude, latitude] });
      }
    });
  }

  renderFakeMarker = () => {
    return (
      <View style={styles.fakeMarkerCont}>
        <SvgXml xml={active_marker} style={styles.markerImage} />
        {/* {this.state.loader ? (
          <ActivityIndicator color={Colors.WHITE} style={styles.loader} />
        ) : (
          <Text style={styles.activeMarkerLocation}>{'A'}</Text>
        )} */}
      </View>
    );
  };

  onChangeRegionStart = () => this.setState({ loader: true });

  onChangeRegionComplete = async () => {
    const center = await this._map.getCenter();
    this.setState({ centerCoordinates: center, loader: false });
  };

  onUpdateUserLocation = (location) => {
    if (!location) {
      // alert('Unable to retrieve location')
      return;
    }
    if (!this.state.isInitial) {
      const currentCoords = [location.coords.longitude, location.coords.latitude];
      // const currentCoords = location;
      this.setState({ centerCoordinates: currentCoords, isInitial: true });
      this._camera.setCamera({
        centerCoordinate: currentCoords,
        zoomLevel: 18,
        animationDuration: 2000,
      });
    }
  };

  addMarker = async () => {
    let { centerCoordinates } = this.state;
    // Check distance
    console.log(this.state.accuracy, 'this.state.accuracy');
    if (this.state.accuracy !== 'Bad') {
      try {
        Geolocation.getCurrentPosition(
          (position) => {
            let currentCoords = position.coords;
            let markerCoords = centerCoordinates;
            console.log(position, 'position addMarker');
            let distance = distanceCalculator(
              currentCoords.latitude,
              currentCoords.longitude,
              markerCoords[1],
              centerCoordinates[0],
              'K',
            );
            let distanceInMeters = distance * 1000;
            if (distanceInMeters < 100) {
              this.setState({ locateTree: 'on-site' }, () => {
                this.pushMaker(currentCoords);
              });
            } else {
              this.setState({ locateTree: 'off-site' }, () => {
                this.pushMaker(currentCoords);
              });
            }
          },
          (err) => {
            console.log(err, 'addMarker');
            alert(err.message);
          },
          // { enableHighAccuracy: true },
        );
      } catch (err) {
        alert(JSON.stringify(err));
      }
    } else {
      this.setState({ isAlertShow: true });
    }
  };

  pushMaker = (currentCoords) => {
    let { centerCoordinates } = this.state;
    this.setState({ markedCoords: centerCoordinates }, () => {
      this.onPressContinue();
    });
  };

  renderMarker = () => {
    const { markedCoords } = this.state;
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

  renderMapView = () => {
    return (
      <MapboxGL.MapView
        showUserLocation={true}
        style={styles.container}
        ref={(ref) => (this._map = ref)}
        onRegionWillChange={this.onChangeRegionStart}
        onRegionDidChange={this.onChangeRegionComplete}>
        {/* {this.renderMarker()} */}
        <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
        <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={this.onPressMyLocationIcon} />
      </MapboxGL.MapView>
    );
  };

  renderMyLocationIcon = () => {
    return (
      <TouchableOpacity
        onPress={this.onPressMyLocationIcon}
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

  onPressMyLocationIcon = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position, 'position onPressMyLocationIcon');
        let accuracy = position.coords.accuracy;
        // alert(position.coords.accuracy, 'position onPressMyLocationIcon');
        this.setState({ isInitial: false }, () => this.onUpdateUserLocation(position));
        if (accuracy < 10) {
          this.setState({ accuracy: 'Good' });
        } else if (accuracy < 31) {
          this.setState({ accuracy: 'Fair' });
        } else {
          this.setState({ accuracy: 'Bad' });
        }
      },
      (err) => {
        console.log(err, 'onPressMyLocationIcon');
        alert(err.message);
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

  onPressContinue = () => {
    const { inventoryID } = this.props;
    const { markedCoords, locateTree } = this.state;
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position, 'position onPressContinue');
        let currentCoords = position.coords;
        addCoordinateSingleRegisterTree({
          inventory_id: inventoryID,
          markedCoords: markedCoords,
          locateTree: locateTree,
          currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
        }).then(() => {
          this.setState({ isAlrightyModalShow: true });
        });
      },
      (err) => {
        console.log(err, 'onPressContinue');
        alert(err.message);
      },
      // { enableHighAccuracy: true },
    );
  };

  renderAlrightyModal = () => {
    const { isAlrightyModalShow, locateTree } = this.state;
    const { updateScreenState, navigation } = this.props;

    const onPressClose = () => this.setState({ isAlrightyModalShow: false });

    const moveScreen = () => updateScreenState('ImageCapturing');
    const offSiteContinue = () => {
      navigation.navigate('SelectSpecies', {
        inventory: this.state.inventory,
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

  onPressBack = () => {
    // const { locateTree } = this.state;
    // const { activeMarkerIndex, updateActiveMarkerIndex, navigation, toogleState2 } = this.props;
    const { navigation } = this.props;
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
  renderAccuracyModal = () => {
    const { isAccuracyModalShow } = this.state;

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
                onPress={() => this.setState({ isAccuracyModalShow: false })}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  renderConfirmationModal = () => {
    const { isAlertShow } = this.state;
    console.log(isAlertShow, 'isAlertShow');
    return (
      <AlertModal
        visible={isAlertShow}
        heading={'Poor Accuracy'}
        message={
          'Your location accuracy is POOR, which is not recommended. Are you sure you want to continue?'
        }
        primaryBtnText={'Try Again'}
        secondaryBtnText={'Continue'}
        onPressPrimaryBtn={this.onPressTryAgain}
        onPressSecondaryBtn={this.onPressAlertContinue}
      />
    );
  };

  onPressTryAgain = () => {
    this.setState({ isAlertShow: false });
  };

  onPressAlertContinue = () => {
    this.setState({ accuracy: 'ForceContinue', isAlertShow: false });
    this.addMarker();
  };

  renderAccuracyInfo = () => {
    let { accuracy } = this.state;
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
        onPress={() => this.setState({ isAccuracyModalShow: true })}>
        <Text style={styles.gpsText}>GPS Accuracy</Text>
      </TouchableOpacity>
    );
  };

  render() {
    const { loader } = this.state;
    return (
      <View style={styles.container} fourceInset={{ top: 'always' }}>
        <View style={styles.container}>
          {this.renderMapView()}
          {this.renderFakeMarker()}
        </View>
        <View>
          {this.renderMyLocationIcon()}
          <View style={styles.continueBtnCont}>
            <PrimaryButton
              onPress={this.addMarker}
              disabled={loader}
              btnText={i18next.t('label.tree_map_marking_btn')}
              style={styles.bottomBtnWith}
            />
          </View>
        </View>
        <LinearGradient style={styles.headerCont} colors={[Colors.WHITE, 'rgba(255, 255, 255, 0)']}>
          <SafeAreaView />
          <Header
            onBackPress={this.onPressBack}
            closeIcon
            headingText={i18next.t('label.tree_map_marking_header')}
            topRightComponent={this.renderAccuracyInfo}
          />
        </LinearGradient>
        <View></View>
        {this.renderAccuracyModal()}
        {this.renderConfirmationModal()}
        {this.renderAlrightyModal()}
      </View>
    );
  }
}

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
