import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { Colors } from 'src/utils/constants'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import { updateUserLocation } from 'src/store/slice/gpsStateSlice'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { getAreaName } from 'src/api/api.fetch'





// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const OfflineMapDisplay = () => {
  const cameraRef = useRef(null);
  const mapRef = useRef(null)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const dispatch = useDispatch()



  const getInitalLocation = async () => {
    const { lat, long } = await getUserLocation()
    dispatch(
      updateUserLocation({
        lat: lat,
        long: long,
      }),
    )
  }

  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [currentUserLocation.long, currentUserLocation.lat],
      zoomLevel: 15,
      animationDuration: 1000,
    })
  }

  const errorListener = async (offlineRegion, status) => {
    console.log("Error", offlineRegion, status)
  }


  const progressListener = async (offlineRegion, status) => {
    console.log("progressListener", offlineRegion, status)
  }

  const onPressDownloadArea = async () => {
    try {
      const offlineMapId = `TreeMapper-offline-map-id-${Date.now()}`;
      const coords = await mapRef.current.getCenter();
      const bounds = await mapRef.current.getVisibleBounds();
      let areaName = ''
      const LocationDetails = await getAreaName(coords)
      if (LocationDetails && LocationDetails.features && LocationDetails.features[0] && LocationDetails.features[0].place_name) {
        areaName = LocationDetails.features[0].place_name
        console.log("areaName",areaName)
      }
      await MapLibreGL.offlineManager.createPack(
        {
          name: offlineMapId,
          styleURL: JSON.stringify(MapStyle),
          minZoom: 14,
          maxZoom: 20,
          bounds: bounds,
        },
        progressListener,
        errorListener,
      );
    } catch (err) {
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
            onDidFinishLoadingMap={getInitalLocation}
            compassViewMargins={{ x: scaleSize(26), y: scaleSize(200) }}
            styleURL={JSON.stringify(MapStyle)}>
            <Camera ref={cameraRef} />
          </MapLibreGL.MapView>
        </View>
        <CustomButton
          label="Save Area"
          containerStyle={styles.btnContainer}
          pressHandler={onPressDownloadArea}
        />
      </View>
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
