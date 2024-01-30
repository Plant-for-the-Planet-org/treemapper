import {
  View,
  Text,
  Modal,
  Linking,
  Platform,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import i18next from 'i18next';
import Config from 'react-native-config';
import MapLibreGL from '@maplibre/maplibre-react-native';
import React, { useEffect, useRef, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNetInfo } from '@react-native-community/netinfo';

import dbLog from '../../repositories/logs';
import { Colors, Typography } from '../../styles';
import { LogTypes } from '../../utils/constants';
import { locationPermission } from '../../utils/permissions';
import { AlertModal, Header, PrimaryButton } from '../Common';
import { createOfflineMap, getAllOfflineMaps, getAreaName } from '../../repositories/maps';

const isAndroid = Platform.OS === 'android';
const ATTR_POSITION = {
  bottom: 7,
  left: 96,
};
const MAP_ZOOM_LEVEL = 15;

MapLibreGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const DownloadMap = ({ navigation }) => {
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [numberOfOfflineMaps, setNumberOfOfflineMaps] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);
  const [offlineModal, setOfflineModal] = useState(false);
  const netInfo = useNetInfo();

  const MapBoxGLRef = useRef();
  const camera = useRef();

  useEffect(() => {
    navigation.addListener('focus', () => {
      getAllOfflineMapslocal();
    });
  }, []);

  const getAllOfflineMapslocal = async () => {
    getAllOfflineMaps().then(offlineMaps => {
      setNumberOfOfflineMaps(offlineMaps.length);
      initialMapCamera();
    });
  };

  const initialMapCamera = () => {
    locationPermission()
      .then(() => {
        Geolocation.getCurrentPosition(
          position => {
            if (camera?.current?.setCamera) {
              camera.current.setCamera({
                centerCoordinate: [position.coords.longitude, position.coords.latitude],
                zoomLevel: 15,
                animationDuration: 1000,
              });
            }
          },
          err => {
            alert(err.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            accuracy: {
              android: 'high',
              ios: 'bestForNavigation',
            },
            useSignificantChanges: true,
            interval: 1000,
            fastestInterval: 1000,
          },
        );
      })
      .catch(err => {
        dbLog.error({
          logType: LogTypes.OTHER,
          message: 'Error while checking location permission',
          logStack: JSON.stringify(err),
        });
        if (err.message === 'blocked') {
          setIsPermissionBlockedAlertShow(true);
        }
      });
  };

  const zoomLevelChanged = async () => {
    setZoomLevel(await MapBoxGLRef.current.getZoom());
  };

  const onPressDownloadArea = async () => {
    let offlineMapId = `TreeMapper-offline-map-id-${Date.now()}`;
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      setIsLoaderShow(true);
      let coords = await MapBoxGLRef.current.getCenter();
      let bounds = await MapBoxGLRef.current.getVisibleBounds();
      getAreaName({ coords })
        .then(async areaName => {
          setAreaName(areaName);
          const progressListener = (offlineRegion, status) => {
            if (status.percentage == 100) {
              createOfflineMap({
                name: offlineMapId,
                size: status.completedTileSize,
                areaName: areaName,
              })
                .then(() => {
                  setIsLoaderShow(false);
                  setTimeout(() => alert(i18next.t('label.download_map_complete')), 1000);
                  getAllOfflineMapslocal();
                  setAreaName('');
                })
                .catch(err => {
                  dbLog.error({
                    logType: LogTypes.OTHER,
                    message: 'Error while creating Offline Map',
                    logStack: JSON.stringify(err),
                  });
                  setIsLoaderShow(false);
                  setAreaName('');
                  alert(i18next.t('label.download_map_area_exists'));
                });
            }
          };
          const errorListener = (offlineRegion, err) => {
            if (err.message !== 'timeout') {
              setIsLoaderShow(false);
              setAreaName('');
              alert(err.message);
            }
          };
          await MapLibreGL.offlineManager.createPack(
            {
              name: offlineMapId,
              styleURL: 'mapbox://styles/sagararl/ckdfyrsw80y3a1il9eqpecoc7',
              minZoom: 14,
              maxZoom: 20,
              bounds: bounds,
            },
            progressListener,
            errorListener,
          );
        })
        .catch(err => {
          dbLog.error({
            logType: LogTypes.OTHER,
            message: 'Error while getting area name',
            logStack: JSON.stringify(err),
          });
          setIsLoaderShow(false);
          setAreaName('');
          alert(i18next.t('label.download_map_area_failed'));
        });
    } else {
      setOfflineModal(true);
    }
  };

  const onPressViewAll = () => {
    navigation.navigate('SavedAreas');
  };

  const handleCurrLoc = () => {
    initialMapCamera();
  };

  const onPressPrimaryBtn = () => setOfflineModal(false);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header headingText={i18next.t('label.download_map_area')} />
        <View style={styles.mapViewContainer}>
          <MapLibreGL.MapView
            ref={MapBoxGLRef}
            style={styles.cont}
            zoomLevel={MAP_ZOOM_LEVEL}
            styleURL={MapLibreGL.StyleURL.Street}
            attributionPosition={ATTR_POSITION}
            onWillStartRenderingFrame={zoomLevelChanged}
            onDidFinishRenderingMapFully={initialMapCamera}>
            <MapLibreGL.UserLocation showsUserHeadingIndicator />
            <MapLibreGL.Camera ref={camera} />
          </MapLibreGL.MapView>
          <TouchableOpacity
            accessible={true}
            onPress={handleCurrLoc}
            style={styles.myLocationIcon}
            testID="register_tree_camera"
            accessibilityLabel="Register Tree Camera">
            <View style={Platform.OS == 'ios' && styles.myLocationIconContainer}>
              <Icon name={'my-location'} size={24} color={Colors.PLANET_BLACK} />
            </View>
          </TouchableOpacity>
        </View>
        {numberOfOfflineMaps == 0 ? (
          <PrimaryButton
            disabled={zoomLevel < 11}
            onPress={onPressDownloadArea}
            btnText={i18next.t('label.download_map')}
          />
        ) : (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={onPressViewAll}
              btnText={i18next.t('label.download_map_view')}
              halfWidth
              theme={'white'}
            />
            <PrimaryButton
              halfWidth
              disabled={zoomLevel < 11}
              onPress={onPressDownloadArea}
              btnText={i18next.t('label.download_map')}
            />
          </View>
        )}
      </View>
      <AlertModal
        visible={offlineModal}
        onPressPrimaryBtn={onPressPrimaryBtn}
        primaryBtnText={i18next.t('label.ok')}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
      />
      <PermissionBlockedAlert
        isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
        setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
      />
      <LoaderModal isLoaderShow={isLoaderShow} areaName={areaName} />
    </SafeAreaView>
  );
};
export default DownloadMap;

// eslint-disable-next-line react/display-name
const LoaderModal = React.memo(
  ({ isLoaderShow, areaName }) => {
    return (
      <Modal transparent visible={isLoaderShow}>
        <View style={styles.dowloadModalContainer}>
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
            <Text style={styles.areaName}>{areaName}</Text>
          </View>
        </View>
      </Modal>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.isLoaderShow === nextProps.isLoaderShow) {
      return true; // props are equal
    }
    return false; // props are not equal -> update the component
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  cont: { flex: 1 },
  mapViewContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    overflow: 'hidden',
    borderWidth: 2,
    marginVertical: 10,
    borderRadius: 10,
    borderColor: Colors.PRIMARY,
  },
  fakeMarkerCont: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaName: {
    fontSize: 16,
    textAlign: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  dowloadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    backgroundColor: Colors.WHITE,
    width: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  loader: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    marginVertical: 20,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  markerImage: {
    position: 'absolute',
    resizeMode: 'contain',
    bottom: 0,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
  },
  myLocationIcon: {
    width: 45,
    height: 45,
    backgroundColor: Colors.WHITE,
    position: 'absolute',
    right: 6,
    bottom: 6,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  myLocationIconContainer: {
    top: 0,
    left: 0,
  },
});

const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
  handleBackPress,
}) => {
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={i18next.t('label.permission_blocked_message')}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.cancel')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        if (isAndroid) {
          Linking.openSettings();
        } else {
          Linking.openURL('app-settings:');
        }
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
      }}
      showSecondaryButton={true}
    />
  );
};
