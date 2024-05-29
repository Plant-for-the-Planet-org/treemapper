import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { scaleSize } from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
// import IterventionCoverImage from 'src/components/previewIntervention/IterventionCoverImage'
import InterventionBasicInfo from 'src/components/previewIntervention/InterventionBasicInfo'
import InterventionArea from 'src/components/previewIntervention/InterventionArea'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import {
  handleIncompleteIntervention,
  makeInterventionGeoJson,
  metaDataTranformer,
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { Colors } from 'src/utils/constants'
import SampleTreePreviewList from 'src/components/previewIntervention/SampleTreePreviewList'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { InterventionData } from 'src/types/interface/slice.interface'
import { updateInerventionData } from 'src/store/slice/interventionSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { initiateForm } from 'src/store/slice/registerFormSlice'
import InterventionDeleteContainer from 'src/components/previewIntervention/InterventionDeleteContainer'
import ExportGeoJSONButton from 'src/components/intervention/ExportGeoJSON'
import InterventionAdditionalData from 'src/components/previewIntervention/InterventionAdditionalData'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import InterventionMetaData from 'src/components/previewIntervention/InterventionMetaData'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { Metadata } from 'src/types/interface/app.interface'

const InterventionPreviewView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const [interventionId, setInterventoinId] = useState('')
  const [loading, setLoading] = useState(true)
  const DeviceLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionPreview'>>()
  const { addNewLog } = useLogManagement()
  const InterventionData = useSelector(
    (state: RootState) => state.interventionState,
  )


  const { saveIntervention, updateInterventionMetaData } = useInterventionManagement()
  const dispatch = useDispatch()

  useEffect(() => {
    if (route.params.id === 'review') {
      setInterventoinId(formFlowData.form_id)
      dispatch(updateNewIntervention())
      setupMetaData()
    } else {
      setInterventoinId(route.params.intervention)
    }
  }, [])


  const setupMetaData = async () => {
    const localMetada = realm.objects<Metadata>(RealmSchema.Metadata)
    const updatedMetadata = {
      private: {},
      public: {},
      app: {}
    };
    if (localMetada && localMetada.length) {
      localMetada.forEach(el => {
        if (el.accessType === 'private') {
          updatedMetadata.private = { ...updatedMetadata.private, [el.key]: el.value }
        }
        if (el.accessType === 'public') {
          updatedMetadata.public = { ...updatedMetadata.public, [el.key]: el.value }
        }
      })
    }
    updatedMetadata.app = {
      deviceLocation: {
        "coordinates": DeviceLocation,
        "type": "Point"
      },
    }
    const parsedMeta = JSON.parse(formFlowData.meta_data)
    if (Object.keys(parsedMeta).length === 0) {
      const finalMeta = metaDataTranformer(parsedMeta, updatedMetadata)
      await updateInterventionMetaData(formFlowData.form_id, finalMeta)
    }

  }

  useEffect(() => {
    if (interventionId) {
      getAndSetIntervention()
    }
  }, [InterventionData.last_updated_at, interventionId])

  const getAndSetIntervention = async () => {
    const selectedIntervention = realm.objectForPrimaryKey(
      RealmSchema.Intervention,
      interventionId,
    )
    const finalData = JSON.parse(JSON.stringify(selectedIntervention))
    if (route.params.id === 'preview') {
      setupIncompleteForm(finalData)
    }
    dispatch(updateInerventionData(finalData))
    setLoading(false)
    if (route.params && route.params.sampleTree) {
      navigation.replace("ReviewTreeDetails", { detailsCompleted: false, interventionID: route.params.sampleTree, synced: true })
    }
  }


  const setupIncompleteForm = async (data: InterventionData) => {
    const getFormDetails = handleIncompleteIntervention(data)
    if (getFormDetails.screen !== 'InterventionPreview') {
      dispatch(initiateForm(getFormDetails.formData))
      navigation.replace(getFormDetails.screen, { ...getFormDetails.params })
    }
  }


  const navigateToNext = async () => {
    await saveIntervention(InterventionData.intervention_id)
    addNewLog({
      logType: 'INTERVENTION',
      message: "New Intervention registered",
      logLevel: 'info',
      statusCode: '000',
    })
    dispatch(updateNewIntervention())
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

  const resetData = () => {
    dispatch(updateNewIntervention())
    navigation.popToTop()
  }



  if (InterventionData.intervention_id.length === 0 || loading) {
    return <View style={styles.activityIndicatorView}>
      <ActivityIndicator
        size="large"
        color={Colors.NEW_PRIMARY}
      />
    </View>
  }

  const renderRightContainer = () => {
    if (InterventionData.status === 'SYNCED') {
      return null
    }
    return <InterventionDeleteContainer interventionId={InterventionData.intervention_id} resetData={resetData} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollWrapper}>
        <Header label="Review" rightComponet={renderRightContainer()} />
        {/* <IterventionCoverImage image={InterventionData.cover_image_url} interventionID={InterventionData.intervention_id} tag={'EDIT_INTERVENTION'} /> */}
        <InterventionBasicInfo
          title={InterventionData.intervention_title}
          intervention_date={InterventionData.intervention_date}
          project_name={InterventionData.project_name}
          site_name={InterventionData.site_name}
        />
        {InterventionData.location.coordinates.length > 0 && <InterventionArea data={InterventionData} />}
        {InterventionData.sample_trees.length > 0 && (
          <SampleTreePreviewList
            sampleTress={InterventionData.sample_trees}
            interventionId={InterventionData.intervention_id}
            hasSampleTress={InterventionData.has_sample_trees} isSynced={InterventionData.status === 'SYNCED'} />
        )}
        {InterventionData.meta_data !== '{}' && <InterventionMetaData data={InterventionData.meta_data} />}
        <InterventionAdditionalData data={[...InterventionData.form_data, ...InterventionData.additional_data]} id={InterventionData.intervention_id} />
        <ExportGeoJSONButton details={InterventionData} type='intervention' />
        <View style={styles.footer} />
      </ScrollView>
      {!InterventionData.is_complete && <CustomButton
        label={"Save"}
        pressHandler={navigateToNext}
        containerStyle={styles.btnContainer}
      />}
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
    position: 'absolute',
    bottom: 20
  },
  footer: {
    width: '100%',
    height: 100
  },
  activityIndicatorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollWrapper: {
    backgroundColor: Colors.GRAY_LIGHT + '1A'
  }
})
