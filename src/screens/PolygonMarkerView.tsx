import { SafeAreaView, StyleSheet } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PolygonMarkerMap from 'src/components/map/PolygonMarkerMap'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import { Colors } from 'src/utils/constants'

const PolygonMarker = () => {
  const { species_required, location_title } = useSelector((state: RootState) => state.formFlowState)

  return (
    <SafeAreaView style={styles.container}>
      <Header label={location_title} />
      <PolygonMarkerMap species_required={species_required} />
      <UserlocationMarker />
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
