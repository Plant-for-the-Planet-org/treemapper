import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PointMarkerMap from 'src/components/map/PoinMarkerMap'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'

const PointMarkerView = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  return (
    <View style={styles.container}>
      <Header
        label={formFlowData.location_title}
        rightComponet={<GpsAccuracyTile />}
      />
      <PointMarkerMap formData={formFlowData} />
      <UserlocationMarker />
    </View>
  )
}

export default PointMarkerView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
