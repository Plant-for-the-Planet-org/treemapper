import React, { useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { Colors } from '_styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { active_marker, marker_png } from '../../assets/index';
import { addCoordinateSingleRegisterTree } from '../../repositories/inventory';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import { InventoryContext } from '../../reducers/inventory';
import distanceCalculator from '../../utils/distanceCalculator';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const IS_ANDROID = Platform.OS == 'android';

class SelectCoordinates extends React.Component {
  state = {
    isAlrightyModalShow: false,
    centerCoordinates: [0, 0],
    activePolygonIndex: 0,
    loader: false,
    markedCoords: null,
    locateTree: 'on-site',
  };

  async UNSAFE_componentWillMount() {
    if (IS_ANDROID) {
      MapboxGL.setTelemetryEnabled(false);
      await MapboxGL.requestAndroidLocationPermissions().then(() => {});
    }
  }

  renderFakeMarker = () => {
    return (
      <View style={styles.fakeMarkerCont}>
        <SvgXml xml={active_marker} style={styles.markerImage} />
        {this.state.loader ? (
          <ActivityIndicator size="large" color={Colors.WHITE} style={styles.loader} />
        ) : (
          <Text style={styles.activeMarkerLocation}>{'A'}</Text>
        )}
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
      // alert('Unable to retrive location')
      return;
    }
    if (!this.state.isInitial) {
      const currentCoords = [location.coords.longitude, location.coords.latitude];
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
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          let currentCoords = position.coords;
          let markerCoords = centerCoordinates;

          let distance = distanceCalculator(
            currentCoords.latitude,
            currentCoords.longitude,
            markerCoords[1],
            centerCoordinates[0],
            'K',
          );
          let distanceInMeters = distance * 1000;

          if (distanceInMeters < 100) {
            this.pushMaker(currentCoords);
            this.setState({ locateTree: 'on-site' });
          } else {
            this.pushMaker(currentCoords);
            this.setState({ locateTree: 'off-site' });
          }
        },
        (err) => alert(err.message),
      );
    } catch (err) {
      // TODO:i18n - if this is used, please add translations or convert to db logging
      alert(JSON.stringify(err));
    }
  };

  pushMaker = (currentCoords) => {
    let { centerCoordinates } = this.state;
    this.setState({ markedCoords: centerCoordinates }, () => {
      const { inventoryID, updateScreenState, navigation } = this.props;
      const { markedCoords, locateTree } = this.state;
      Geolocation.getCurrentPosition(
        (position) => {
          let currentCoords = position.coords;
          addCoordinateSingleRegisterTree({
            inventory_id: inventoryID,
            markedCoords: markedCoords,
            currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
          }).then(() => {
            navigation.navigate('InventoryOverview');
          });
        },
        (err) => alert(err.message),
      );
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
          <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
            <Text style={styles.markerText}>{'A'}</Text>
          </ImageBackground>
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
        {this.renderMarker()}
        <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
        <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={this.onUpdateUserLocation} />
      </MapboxGL.MapView>
    );
  };

  renderMyLocationIcon = () => {
    return (
      <TouchableOpacity
        onPress={this.onPressMyLocationIcon}
        style={[styles.myLocationIcon]}
        accessibilityLabel="Coordinate Location"
        testID="coordinate_location"
        accessible={true}>
        <View style={Platform.OS == 'ios' && styles.myLocationIconContainer}>
          <Ionicons style={{}} name={'md-locate'} size={22} />
        </View>
      </TouchableOpacity>
    );
  };

  onPressMyLocationIcon = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({ isInitial: false }, () => this.onUpdateUserLocation(position));
      },
      (err) => alert(err.message),
    );
  };

  onPressBack = () => {
    const { locateTree } = this.state;
    const { activeMarkerIndex, updateActiveMarkerIndex, navigation, toogleState2 } = this.props;
    if (locateTree == 'off-site') {
      if (activeMarkerIndex > 0) {
        this.setState({ isAlrightyModalShow: true });
      } else {
        navigation.goBack();
      }
    } else {
      // on-site
      if (activeMarkerIndex > 0) {
        updateActiveMarkerIndex(activeMarkerIndex - 1);
        toogleState2();
      } else {
        navigation.goBack();
      }
    }
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
              style={{ width: '90%' }}
            />
          </View>
        </View>
        <LinearGradient style={styles.headerCont} colors={[Colors.WHITE, 'rgba(255, 255, 255, 0)']}>
          <SafeAreaView />
          <Header
            onBackPress={this.onPressBack}
            headingText={i18next.t('label.tree_map_marking_header')}
          />
        </LinearGradient>
        <View></View>
      </View>
    );
  }
}

export default function SelectCoordinatesMain(props) {
  const navigation = useNavigation();
  const globalState = useContext(InventoryContext);
  const { state } = globalState;
  return <SelectCoordinates {...props} {...state} navigation={navigation} />;
}

const styles = StyleSheet.create({
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
  headerCont: {
    paddingHorizontal: 25,
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0)',
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
