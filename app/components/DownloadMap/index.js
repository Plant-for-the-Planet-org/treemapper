import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Modal, ActivityIndicator, Image } from 'react-native';
import { Header, PrimaryButton, AlertModal } from '../Common';
import { SafeAreaView, Linking, Platform } from 'react-native';
import { Colors, Typography } from '_styles';
import { getAreaName, getAllOfflineMaps, createOfflineMap } from '../../repositories/maps';
import MapboxGL from '@react-native-mapbox-gl/maps';
import Config from 'react-native-config';
import Geolocation from 'react-native-geolocation-service';
import { permission } from '../../utils/permissions';
import i18next from 'i18next';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);
const IS_ANDROID = Platform.OS === 'android';

const DownloadMap = ({ navigation }) => {
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [numberOfOfflineMaps, setNumberOfOfflineMaps] = useState(0);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);

  const MapBoxGLRef = useRef();
  const MapBoxGLCameraRef = useRef();

  useEffect(() => {
    navigation.addListener('focus', () => {
      getAllOfflineMapslocal();
    });
  }, []);

  const getAllOfflineMapslocal = async () => {
    getAllOfflineMaps().then((offlineMaps) => {
      setNumberOfOfflineMaps(offlineMaps.length);
    });
  };

  const initialMapCamera = () => {
    permission()
      .then(
        Geolocation.getCurrentPosition(
          (position) => {
            MapBoxGLCameraRef.current.setCamera({
              centerCoordinate: [position.coords.longitude, position.coords.latitude],
              zoomLevel: 15,
              animationDuration: 2000,
            });
          },
          (err) => {
            alert(err.message);
          },
        ),
      )
      .catch((err) => {
        if (err === 'blocked') {
          setIsPermissionBlockedAlertShow(true);
        }
      });
  };

  const onPressDownloadArea = async () => {
    let offllineMapId = `TreeMapper-offline-map-id-${Date.now()}`;

    setIsLoaderShow(true);
    let coords = await MapBoxGLRef.current.getCenter();
    let bounds = await MapBoxGLRef.current.getVisibleBounds();
    getAreaName({ coords })
      .then(async (areaName) => {
        setAreaName(areaName);
        const progressListener = (offlineRegion, status) => {
          if (status.percentage == 100) {
            createOfflineMap({
              name: offllineMapId,
              size: status.completedTileSize,
              areaName: areaName,
            })
              .then(() => {
                setIsLoaderShow(false);
                setTimeout(() => alert(i18next.t('label.download_map_complete')), 1000);
                getAllOfflineMapslocal();

                setAreaName('');
              })
              .catch((err) => {
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
        await MapboxGL.offlineManager.createPack(
          {
            name: offllineMapId,
            styleURL: 'mapbox://styles/sagararl/ckdfyrsw80y3a1il9eqpecoc7',
            minZoom: 14,
            maxZoom: 20,
            bounds: bounds,
          },
          progressListener,
          errorListener,
        );
      })
      .catch((err) => {
        setIsLoaderShow(false);
        setAreaName('');
        alert(i18next.t('label.download_map_area_failed'));
      });
  };

  const renderLoaderModal = () => {
    return (
      <Modal transparent visible={isLoaderShow}>
        <View style={styles.dowloadModalContainer}>
          <View style={styles.contentContainer}>
            <ActivityIndicator size={40} style={styles.loader} />
            <Text style={styles.areaName}>{areaName}</Text>
          </View>
        </View>
      </Modal>
    );
  };

  const onPressViewAll = () => {
    navigation.navigate('SavedAreas');
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header headingText={i18next.t('label.download_map_area')} />
        <View style={styles.mapViewContainer}>
          <MapboxGL.MapView
            onDidFinishRenderingMapFully={initialMapCamera}
            ref={MapBoxGLRef}
            style={styles.cont}
            styleURL={MapboxGL.StyleURL.Street}
            zoomLevel={15}
            centerCoordinate={[11.256, 43.77]}>
            <MapboxGL.UserLocation showsUserHeadingIndicator />
            <MapboxGL.Camera ref={MapBoxGLCameraRef} />
          </MapboxGL.MapView>
        </View>
        {numberOfOfflineMaps == 0 ? (
          <PrimaryButton onPress={onPressDownloadArea} btnText={i18next.t('label.download_map')} />
        ) : (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={onPressViewAll}
              btnText={i18next.t('label.download_map_view')}
              halfWidth
              theme={'white'}
            />
            <PrimaryButton
              onPress={onPressDownloadArea}
              btnText={i18next.t('label.download_map')}
              halfWidth
            />
          </View>
        )}
      </View>
      <PermissionBlockedAlert
        isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
        setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
      />
      {renderLoaderModal()}
    </SafeAreaView>
  );
};
export default DownloadMap;

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
        if (IS_ANDROID) {
          Linking.openSettings();
        } else {
          Linking.openURL('app-settings:');
        }
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
      }}
    />
  );
};
