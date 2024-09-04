import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { scaleSize } from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
import InterventionBasicInfo from 'src/components/previewIntervention/InterventionBasicInfo'
import InterventionArea from 'src/components/previewIntervention/InterventionArea'
import { useDispatch, useSelector } from 'react-redux'
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import { RootState } from 'src/store'
import {
  makeInterventionGeoJson,
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { Colors, Typography } from 'src/utils/constants'
import SampleTreePreviewList from 'src/components/previewIntervention/SampleTreePreviewList'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { InterventionData } from 'src/types/interface/slice.interface'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useObject, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import InterventionDeleteContainer from 'src/components/previewIntervention/InterventionDeleteContainer'
import ExportGeoJSONButton from 'src/components/intervention/ExportGeoJSON'
import InterventionAdditionalData from 'src/components/previewIntervention/InterventionAdditionalData'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { Metadata } from 'src/types/interface/app.interface'
import * as Application from 'expo-application'
import i18next from 'i18next'
import { useToast } from 'react-native-toast-notifications'
import { getDeviceDetails } from 'src/utils/helpers/appHelper/getAdditionalData'
import InterventionMetaData from 'src/components/previewIntervention/InterventionMetaData'

const InterventionPreviewView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [loading, setLoading] = useState(true)
  const DeviceLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const UserType = useSelector((state: RootState) => state.userState.type)
  const toast = useToast()
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionPreview'>>()
  const interventionID = route.params?.interventionId ?? "";

  const [highlightedTree, setHighlightedTree] = useState('')

  const { addNewLog } = useLogManagement()
  const InterventionData = useObject<InterventionData>(
    RealmSchema.Intervention, interventionID
  )
  const { saveIntervention, updateInterventionMetaData } = useInterventionManagement()
  const dispatch = useDispatch()

  useEffect(() => {
    setLoading(false)
    checkIsTree()
    showInitialToast()
    if (route.params.id === 'review') {
      setupMetaData()
    }
  }, [])


  const showInitialToast = () => {
    if (UserType === 'tpo' && !!InterventionData && !InterventionData.project_id && InterventionData.status !== 'SYNCED') {
      toast.show("Project not assign")
    }
  }

  const setupMetaData = async () => {
    const localMeta = realm.objects<Metadata>(RealmSchema.Metadata)
    const parsedMeta = JSON.parse(InterventionData.meta_data)
    const updatedMetadata = { ...parsedMeta };
    if (localMeta?.length) {
      localMeta.forEach(el => {
        if (el.accessType === 'private') {
          updatedMetadata.private = { ...updatedMetadata.private, [el.key]: el.value }
        }
        if (el.accessType === 'public') {
          updatedMetadata.public = { ...updatedMetadata.public, [el.key]: el.value }
        }
      })
    }
    const appMeta = getDeviceDetails()
    updatedMetadata.app = {
      deviceLocation: {
        "coordinates": DeviceLocation,
        "type": "Point"
      },
      ...appMeta
    }
    await updateInterventionMetaData(InterventionData.intervention_id, JSON.stringify(updatedMetadata))
  }



  const checkIsTree = async () => {
    if (route?.params?.sampleTree) {
      setHighlightedTree(route.params.sampleTree);
    }
  }


  const navigateToNext = async () => {
    if (UserType === 'tpo' && !InterventionData.project_id) {
      toast.show("Please assign project")
      return
    }
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
        bounds: bounds,
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
    if (InterventionData.is_complete && InterventionData.status !== 'SYNCED') {
      return null
    }
    if (InterventionData.status === 'SYNCED') {
      return <View style={styles.syncContainer}>
        <SyncIcon width={20} height={20} />
        <Text style={styles.label}>{i18next.t("label.fully_synced")}</Text>
      </View>
    }
    return <InterventionDeleteContainer interventionId={InterventionData.intervention_id} resetData={resetData} />
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollWrapper} bounces={false} showsVerticalScrollIndicator={false}>
        <Header label="Review" rightComponent={renderRightContainer()} />
        {InterventionData.location.coordinates.length > 0 && <InterventionArea data={InterventionData} />}
        <InterventionBasicInfo
          data={InterventionData}
          userType={UserType}
        />
        {InterventionData.sample_trees.length > 0 && (
          <SampleTreePreviewList
            status={InterventionData.status}
            sampleTress={InterventionData.sample_trees}
            interventionId={InterventionData.intervention_id}
            hasSampleTress={InterventionData.has_sample_trees} isSynced={InterventionData.status === 'SYNCED'}
            selectedTree={highlightedTree}
          />
        )}
        {InterventionData.meta_data !== '{}' && <InterventionMetaData data={InterventionData.meta_data} synced={InterventionData.status === 'SYNCED'} />}
        <InterventionAdditionalData data={[...InterventionData.form_data, ...InterventionData.additional_data]} id={InterventionData.intervention_id} canEdit={InterventionData.status === 'INITIALIZED'} />
        <ExportGeoJSONButton details={InterventionData} type='intervention' />
        {InterventionData.status !== 'SYNCED' && <Text style={styles.versionNote}>{i18next.t("label.collected_using")}{InterventionData.is_legacy ? '1.0.8' : Application.nativeApplicationVersion}</Text>}
        <View style={styles.footer} />
      </ScrollView>
      {!InterventionData.is_complete && <CustomButton
        label={i18next.t("label.save")}
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
    bottom: 30
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
  },
  versionNote: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    width: '100%',
    textAlign: 'center',
    marginVertical: 20
  },
  label: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 8
  },
  syncContainer: {
    paddingHorizontal: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    marginRight: '5%',
    borderRadius: 10
  },
})
