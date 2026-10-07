import { Alert, StyleSheet, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { Colors } from 'src/utils/constants'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { Map, Camera, UserLocation, OfflineManager, LngLatBounds } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { getAreaName } from 'src/api/api.fetch'
import LoaderModal from './LoaderModal'
import useOfflineMapManager from 'src/hooks/realm/useOfflineMapManger'
import i18next from 'src/locales'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import SatelliteIconWrapper from '../map/SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import { TourTarget } from '@wrack/react-native-tour-guide'
import useOfflineMapTour from 'src/hooks/useOfflineMapTour'
import { useTourAction } from 'src/hooks/useTourController'
import { OFFLINE_TOUR_STEPS, OFFLINE_TOUR_TARGETS } from 'src/utils/tour/offlineMapTour'





// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const OfflineMapDisplay = () => {
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [visibleBounds, setVisibleBounds] = useState<LngLatBounds>([0, 0, 0, 0]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const cameraRef = useRef(null);
  const mapRef = useRef(null)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const mainMapView = useSelector(
    (state: RootState) => state.displayMapState.mainMapView,
  )

  const { createNewOfflineMap } = useOfflineMapManager()
  const { advanceIfOn } = useOfflineMapTour()
  const posthog = usePostHog()


  const handleCamera = () => {
    if (currentUserLocation && cameraRef.current !== null) {
      cameraRef.current.easeTo({
        center: [...currentUserLocation],
        zoom: 15,
        duration: 1000,
      })
    }
  }

  const errorListener = async (offlineRegion, status) => {
  }

  const alert = (message: string) => {
    Alert.alert(message)
  }

  const progressListener = async (_offlineRegion, status, areaName, mapID) => {
    if (status.percentage == 100) {
      setIsLoaderShow(false)
      const writeData = {
        name: mapID,
        areaName: areaName,
        size: status.completedTileSize,
      }
      const result = await createNewOfflineMap(writeData)
      if (result) {
        captureAnalyticsEvent(posthog, AnalyticsEvents.OFFLINE_MAP_DOWNLOADED, {
          area_name: areaName,
          tile_size: status.completedTileSize,
        })
        alert(i18next.t('label.download_map_complete'));
        navigation.goBack()
      } else {
        alert(i18next.t('label.download_map_area_failed'));
      }
    }
  }

  const onPressDownloadArea = async () => {
    // Last step of the walkthrough, so this closes the tour rather than
    // advancing it. It has to close here: the download runs behind a
    // full-screen loader modal that the inline overlay cannot draw over.
    advanceIfOn(OFFLINE_TOUR_STEPS.SAVE)
    setIsLoaderShow(true);
    try {
      const coords = await mapRef.current.getCenter();
      const { response } = await getAreaName(coords)
      const placeName = response?.features?.[0]?.place_name || 'Not specified'
      if (placeName) {
        setAreaName(placeName);
      }
      const pack = await OfflineManager.createPack(
        {
          mapStyle: process.env.EXPO_PUBLIC_OFFLINE_LINK,
          minZoom: 14,
          maxZoom: 20,
          bounds: visibleBounds,
        },
        (o, s) => { progressListener(o, s, placeName, o.id) },
        errorListener,
      );
    } catch (err) {
      setIsLoaderShow(false);
    }
  };



  // The button is the only thing the step asks for, so a press anywhere on
  // the backdrop runs it too.
  useTourAction(OFFLINE_TOUR_STEPS.SAVE, onPressDownloadArea)

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {/* The tour wraps the map so the user can pan and zoom inside the
            spotlight: what gets saved is whatever the map is showing. */}
        <TourTarget id={OFFLINE_TOUR_TARGETS.MAP} style={styles.mapStyle}>
          <Map ref={mapRef} style={styles.mainMapStyle}
            logo={false}
            compassPosition={{ bottom: scaleSize(200), right: scaleSize(26) }}
            attribution={false}
            onDidFinishLoadingMap={handleCamera}
            onRegionDidChange={(e) => setVisibleBounds(e.nativeEvent.bounds)}
            mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
            <Camera ref={cameraRef} />
            <UserLocation heading minDisplacement={1} />
          </Map>
          <SatelliteIconWrapper bottom={20} />
        </TourTarget>
        <TourTarget id={OFFLINE_TOUR_TARGETS.SAVE} style={styles.btnContainer}>
          <CustomButton
            label="Save Area"
            pressHandler={onPressDownloadArea}
            showDown
          />
        </TourTarget>
      </View>
      <LoaderModal isLoaderShow={isLoaderShow} areaName={areaName} />
    </View>
  )
}

export default OfflineMapDisplay

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%' },
  wrapper: {
    width: '100%',
    height: '80%',
    position: 'absolute',
    zIndex: 1,
    top: '-5%',
    alignItems: 'center',
  },
  mapStyle: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mainMapStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    borderColor: Colors.NEW_PRIMARY,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    marginTop: 10,
  },
})
