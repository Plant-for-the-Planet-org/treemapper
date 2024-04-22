import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { scaleSize } from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
import IterventionCoverImage from 'src/components/previewIntervention/IterventionCoverImage'
import InterventionBasicInfo from 'src/components/previewIntervention/InterventionBasicInfo'
import InterventionArea from 'src/components/previewIntervention/InterventionArea'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import {
  convertFormDataToIntervention,
  makeInterventionGeoJson,
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { resetSampleTreeform } from 'src/store/slice/sampleTreeSlice'
import { Colors } from 'src/utils/constants'
import SampleTreePreviewList from 'src/components/previewIntervention/SampleTreePreviewList'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { InterventionData } from 'src/types/interface/slice.interface'
import { updateInerventionData } from 'src/store/slice/interventionSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
import InterventionFormData from 'src/components/previewIntervention/InterventionFormData'

const InterventionPreviewView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const route = useRoute<RouteProp<RootStackParamList, 'TakePicture'>>()
  const InterventionData = useSelector(
    (state: RootState) => state.interventionState,
  )
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const is_sampleTree = SampleTreeData.form_id.length > 0
  const { addNewIntervention } = useInterventionManagement()
  const dispatch = useDispatch()
  const isPreview = route.params.id === 'preview'

  useEffect(() => {
    if (route.params.id === 'review') {
      const finalData: InterventionData =
        convertFormDataToIntervention(formFlowData)
      dispatch(updateInerventionData(finalData))
    }
  }, [])

  const navigateToNext = async () => {
    if (isPreview) {
      navigation.goBack()
      return
    }
    const finalData = convertFormDataToIntervention(formFlowData)
    await addNewIntervention(finalData)
    dispatch(resetSampleTreeform())
    const { geoJSON } = makeInterventionGeoJson(
      formFlowData.location_type,
      formFlowData.coordinates,
      finalData.intervention_id,
    )
    const bounds = bbox(geoJSON)
    dispatch(
      updateMapBounds({
        bodunds: bounds,
        key: 'DISPLAY_MAP',
      }),
    )
    navigation.popToTop()
  }

  if (InterventionData.intervention_id.length === 0) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View>
          <Header label="Review" />
          <IterventionCoverImage image={InterventionData.cover_image_url} />
          <InterventionBasicInfo
            title={InterventionData.intervention_title}
            intervention_date={InterventionData.intervention_date}
            project_name={InterventionData.project_name}
            site_name={InterventionData.site_name}
          />
          <InterventionArea data={InterventionData} />
          {InterventionData.sample_trees.length > 0 && (
            <SampleTreePreviewList
              sampleTress={InterventionData.sample_trees}
            />
          )}
          <InterventionFormData formData={InterventionData.form_data} />
          <CustomButton
            label={
              is_sampleTree &&
                SampleTreeData.sample_tree_count !==
                formFlowData.tree_details.length
                ? 'Next Tree'
                : 'Done'
            }
            pressHandler={navigateToNext}
            containerStyle={styles.btnContainer}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default InterventionPreviewView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
  },
})
