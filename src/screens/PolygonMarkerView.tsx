import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import PolygonMarkerMap from 'src/components/map/PolygonMarkerMap'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import { Colors } from 'src/utils/constants'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import { SafeAreaView } from 'react-native-safe-area-context'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import InfoModal from 'src/components/common/InfoModal'

const PolygonMarker = () => {
  const { species_required, location_title } = useSelector((state: RootState) => state.formFlowState)
  const [showInfoModal, setShowInfoModal] = useState(false)

  return (
    <SafeAreaView style={styles.container}>
      <Header label={location_title}
        rightComponet={<GpsAccuracyTile showModalInfo={setShowInfoModal}/>}/>

      <PolygonMarkerMap species_required={species_required} />
      <UserlocationMarker />
      <InfoModal isVisible={showInfoModal} toogleModal={setShowInfoModal} />
      <LocationPermissionModal required />
    </SafeAreaView>
  )
}

export default PolygonMarker

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
