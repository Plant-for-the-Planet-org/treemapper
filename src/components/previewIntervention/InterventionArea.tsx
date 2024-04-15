import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'
import PreviewMap from '../map/PreviewMap'
import {v4 as uuid} from 'uuid'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import { Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import CoordinatesList from './CoordinatesList'
interface Props {
  formData: RegisterFormSliceInitalState
}

const InterventionArea = (props: Props) => {
  const {formData} = props
  const {geoJSON} = makeInterventionGeoJson(
    formData.location_type,
    formData.coordinates,
    uuid(),
    false,
  )

  const FeatureCollectionGeoJSON = {
    type: 'FeatureCollection',
    features: [geoJSON],
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Intervention Area</Text>
      <PreviewMap
        geoJSON={FeatureCollectionGeoJSON}
        sampleTrees={formData.tree_details}
        has_sample_trees={formData.has_sample_trees}
      />
      <CoordinatesList coordinates={formData.coordinates} />
    </View>
  )
}

export default InterventionArea

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  header: {
    marginLeft: '10%',
    marginVertical: 10,
    fontFamily:Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(18),
    color: Colors.TEXT_COLOR,
    marginBottom:20
  },
})
