import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import MarkerMap from 'src/components/map/MarkerMap'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'
import UserlocationMarker from 'src/components/map/UserlocationMarker'

const PointMarkerView = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  return (
    <View style={styles.container}>
      <Header label={formFlowData.location_title} />
      <MarkerMap formData={formFlowData}/>
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
