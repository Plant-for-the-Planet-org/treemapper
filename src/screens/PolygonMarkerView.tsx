import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PolygonMarkerMap from 'src/components/map/PolygonMarkerMap'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

const PolygonMarker = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)

  return (
    <View style={styles.container}>
      <Header label={formFlowData.location_title} />
      <PolygonMarkerMap formData={formFlowData} />
    </View>
  )
}

export default PolygonMarker

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
