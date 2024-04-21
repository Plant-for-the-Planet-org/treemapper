import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PolygonMarkerMap from 'src/components/map/PolygonMarkerMap'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'
import UserlocationMarker from 'src/components/map/UserlocationMarker'

const PolygonMarker = () => {
  const {species_required,location_title} = useSelector((state: RootState) => state.formFlowState)

  return (
    <View style={styles.container}>
      <Header label={location_title} />
      <PolygonMarkerMap species_required={species_required}/>
      <UserlocationMarker />
    </View>
  )
}

export default PolygonMarker

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
