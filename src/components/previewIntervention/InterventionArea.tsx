import { StyleSheet, View } from 'react-native'
import React from 'react'
import { InterventionData } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import PreviewMap from '../map/PreviewMap'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import { Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
interface Props {
  data: InterventionData
}

const InterventionArea = (props: Props) => {
  const { data } = props
  const { geoJSON } = makeInterventionGeoJson(
    data.location.type,
    JSON.parse(data.location.coordinates),
    data.intervention_id,
    { key: data.intervention_key }
  )

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()


  const FeatureCollectionGeoJSON = {
    type: 'FeatureCollection',
    features: [geoJSON],
  }

  const openEdit = () => {
    navigation.navigate('EditPolygon', { id: data.intervention_id })
  }


  return (
    <View style={styles.container}>
      <PreviewMap
        geoJSON={FeatureCollectionGeoJSON}
        sampleTrees={data.sample_trees}
        has_sample_trees={data.has_sample_trees}
        openPolygon={openEdit}
        showEdit={data.status !== 'SYNCED'}
        isEntireSite={data.entire_site}
        intervention={data}
      />
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
    marginLeft: '5%',
    marginVertical: 10,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(18),
    color: Colors.TEXT_COLOR,
    marginBottom: 20,
  },
})
