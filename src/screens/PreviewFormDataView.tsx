import {ScrollView, StyleSheet, View} from 'react-native'
import React from 'react'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {scaleSize} from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
import IterventionCoverImage from 'src/components/previewIntervention/IterventionCoverImage'
import InterventionBasicInfo from 'src/components/previewIntervention/InterventionBasicInfo'
import InterventionArea from 'src/components/previewIntervention/InterventionArea'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from 'src/store'
import {
  getPreviewData,
  interventionFinalData,
  makeInterventionGeoJson,
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import {resetSampleTreeform} from 'src/store/slice/sampleTreeSlice'
import {Colors} from 'src/utils/constants'
import SampleTreePreviewList from 'src/components/previewIntervention/SampleTreePreviewList'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'

const PreviewFormData = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const is_sampleTree = SampleTreeData.form_id.length > 0
  const {addNewIntervention, addSampleTrees} = useInterventionManagement()
  const dispatch = useDispatch()

  const navigateToNext = async () => {
    const finalData = interventionFinalData(formFlowData)
    if (!is_sampleTree || finalData.sample_trees.length === 1) {
      await addNewIntervention(finalData)
    } else {
      await addSampleTrees(finalData)
    }
    if (
      !is_sampleTree ||
      SampleTreeData.sample_tree_count === formFlowData.tree_details.length
    ) {
      dispatch(resetSampleTreeform())
      const {geoJSON} = makeInterventionGeoJson(
        formFlowData.location_type,
        formFlowData.coordinates,
        finalData.intervention_id,
        false,
      )
      const bounds = bbox(geoJSON)
      dispatch(
        updateMapBounds({
          bodunds: bounds,
          key: 'DISPLAY_MAP',
        }),
      )
      navigation.popToTop()
    } else {
      navigation.reset({
        index: 1,
        routes: [{name: 'Home'}, {name: 'PointMarker'}],
      })
    }
  }

  const {previewImage, basicInfo} = getPreviewData(formFlowData)

  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          <Header label="Review" />
          <IterventionCoverImage image={previewImage} />
          <InterventionBasicInfo data={basicInfo} />
          <InterventionArea formData={formFlowData} />
          <SampleTreePreviewList sampleTress={formFlowData.tree_details} />
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
    </View>
  )
}

export default PreviewFormData

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
