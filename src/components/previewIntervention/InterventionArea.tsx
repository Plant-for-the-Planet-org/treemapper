import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import PreviewInterventionMap from './PreviewInterventionMap'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'

interface Props {
  formData: RegisterFormSliceInitalState
}

const InterventionArea = (props: Props) => {
  const {formData} = props
  const {geoJSON} = makeInterventionGeoJson(
    formData.location_type,
    formData.coordinates,
  )
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Intervention Area</Text>
      <View style={styles.mapWrapper}>
        <PreviewInterventionMap geoJSON={[geoJSON]} />
      </View>
      {/* <CoordinatesList /> */}
    </View>
  )
}

export default InterventionArea

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  mapWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginLeft: '10%',
    marginBottom: 10,
  },
})
