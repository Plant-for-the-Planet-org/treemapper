import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
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
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { resetRegisterationForm } from 'src/store/slice/registerFormSlice'
import InterventionDeleteContainer from 'src/components/previewIntervention/InterventionDeleteContainer'

const InterventionPreviewView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const [interventionId, setInterventoinId] = useState('')
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionPreview'>>()
  const InterventionData = useSelector(
    (state: RootState) => state.interventionState,
  )


  const { addNewIntervention, saveIntervention } = useInterventionManagement()
  const dispatch = useDispatch()

  useEffect(() => {
    if (route.params.id === 'review') {
      const finalData: InterventionData =
        convertFormDataToIntervention(formFlowData)
      addNewIntervention(finalData)
      setInterventoinId(finalData.intervention_id)
      dispatch(resetRegisterationForm())
      dispatch(resetSampleTreeform())
    } else {
      setInterventoinId(route.params.intervention)
    }
  }, [])

  useEffect(() => {
    if (interventionId) {
      getAndSetIntervention()
    }
  }, [InterventionData.last_updated_at, interventionId])

  const getAndSetIntervention = () => {
    const selectedIntervention = realm.objectForPrimaryKey(
      RealmSchema.Intervention,
      interventionId,
    )
    const finalData = JSON.parse(JSON.stringify(selectedIntervention))
    dispatch(updateInerventionData(finalData))
  }

  const navigateToNext = async () => {
    await saveIntervention(InterventionData.intervention_id)
    dispatch(resetSampleTreeform())
    const { geoJSON } = makeInterventionGeoJson(
      InterventionData.location_type,
      JSON.parse(InterventionData.location.coordinates),
      InterventionData.intervention_id,
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

  const resetData=()=>{
    navigation.popToTop()
  }



  if (InterventionData.intervention_id.length === 0) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View>
          <Header label="Review" rightComponet={<InterventionDeleteContainer interventionId={InterventionData.intervention_id} resetData={resetData}/>} />
          <IterventionCoverImage image={InterventionData.cover_image_url} interventionID={InterventionData.intervention_id} tag={'EDIT_INTERVENTION'} />
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
              interventionId={InterventionData.intervention_id}
              hasSampleTress={InterventionData.has_sample_trees}
            />
          )}
          <InterventionFormData formData={InterventionData.form_data} />
          {!InterventionData.is_complete && <CustomButton
            label={"Done"}
            pressHandler={navigateToNext}
            containerStyle={styles.btnContainer}
          />}
        </View>
        <View style={styles.footer} />
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
  footer: {
    width: '100%',
    height: 50
  }
})
