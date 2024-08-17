import { Alert, StyleSheet, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { Colors } from 'src/utils/constants'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { getAreaName } from 'src/api/api.fetch'
import LoaderModal from './LoaderModal'
import useOfflineMapManager from 'src/hooks/realm/useOfflineMapManger'
import i18next from 'src/locales'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'





// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const OfflineMapDisplay = () => {
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const [areaName, setAreaName] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const cameraRef = useRef(null);
  const mapRef = useRef(null)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )

  const { createNewOfflineMap } = useOfflineMapManager()


  const handleCamera = () => {
    if (currentUserLocation && cameraRef.current !== null) {

      cameraRef.current.setCamera({
        centerCoordinate: [...currentUserLocation],
        zoomLevel: 15,
        animationDuration: 1000,
      })
    }
  }

  const errorListener = async (offlineRegion, status) => {
    console.log("Error", offlineRegion, status)
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
        alert(i18next.t('label.download_map_complete'));
        navigation.goBack()
      } else {
        alert(i18next.t('label.download_map_area_failed'));
      }
    }
  }

  const onPressDownloadArea = async () => {
    setIsLoaderShow(true);
    try {
      const offlineMapId = `TreeMapper-offline-map-id-${Date.now()}`;
      const coords = await mapRef.current.getCenter();
      const bounds = await mapRef.current.getVisibleBounds();
      const LocationDetails = await getAreaName(coords)
      const placeName = LocationDetails?.features?.[0]?.place_name || 'Not specified'
      if (placeName) {
        setAreaName(placeName);
      }      
      await MapLibreGL.offlineManager.createPack(
        {
          name: offlineMapId,
          styleURL: process.env.EXPO_PUBLIC_OFFLINE_LINK,
          minZoom: 14,
          maxZoom: 20,
          bounds: bounds,
        },
        (o, s) => { progressListener(o, s, placeName, offlineMapId) },
        errorListener,
      );
    } catch (err) {
      setIsLoaderShow(false);
      console.log("err", err)
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.mapStyle}>
          <MapLibreGL.MapView ref={mapRef} style={styles.mainMapStyle}
            logoEnabled={false}
            compassViewPosition={3}
            attributionEnabled={false}
            onDidFinishLoadingMap={handleCamera}
            compassViewMargins={{ x: scaleSize(26), y: scaleSize(200) }}
            styleURL={JSON.stringify(MapStyle)}>
            <MapLibreGL.Camera ref={cameraRef} />
            <MapLibreGL.UserLocation
              showsUserHeadingIndicator
              androidRenderMode="gps"
              minDisplacement={1}
            />
          </MapLibreGL.MapView>
        </View>
        <CustomButton
          label="Save Area"
          containerStyle={styles.btnContainer}
          pressHandler={onPressDownloadArea}
          showDown
        />
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
