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
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import {updateSampleTreeForNextTree} from 'src/store/slice/sampleTreeSlice'

const PreviewFormData = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const dispatch = useDispatch()
  const is_sampleTree = SampleTreeData.form_id.length > 0
  const {addNewIntervention} = useInterventionManagement()
  const navigateToNext = async () => {
    const finalData = interventionFinalData(formFlowData)
    const result = await addNewIntervention(finalData)
    if (result && is_sampleTree && SampleTreeData.sample_tree_count > 1) {
      dispatch(updateSampleTreeForNextTree())
      navigation.navigate('PointMarker')
      return
    }
    if (result) {
      navigation.popToTop()
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
          <CustomButton
            label={
              is_sampleTree && SampleTreeData.sample_tree_count > 1
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
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
  },
})
