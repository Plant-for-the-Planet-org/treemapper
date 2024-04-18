import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {InterventionData} from 'src/types/interface/slice.interface'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'
import PreviewMap from '../map/PreviewMap'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import {Typography} from 'src/utils/constants'
import {scaleSize} from 'src/utils/constants/mixins'
import CoordinatesList from './CoordinatesList'
interface Props {
  data: InterventionData
}

const InterventionArea = (props: Props) => {
  const {data} = props
  const {geoJSON} = makeInterventionGeoJson(
    data.location.type,
    JSON.parse(data.location.coordinates),
    data.intervention_id,
    true,
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
        sampleTrees={data.sample_trees}
        has_sample_trees={data.has_sample_trees}
      />
      <CoordinatesList coordinates={JSON.parse(data.location.coordinates)} />
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
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(18),
    color: Colors.TEXT_COLOR,
    marginBottom: 20,
  },
})
