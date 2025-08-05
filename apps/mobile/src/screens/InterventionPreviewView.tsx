import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
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
import UnsyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import { RootState } from 'src/store'
import {
  makeInterventionGeoJson,
} from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { Colors, Typography } from 'src/utils/constants'
import PenIcon from 'assets/images/svg/PenIcon.svg'
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
import DeleteModal from 'src/components/common/DeleteModal'

const InterventionPreviewView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [loading, setLoading] = useState(true)
  const DeviceLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const UserType = useSelector((state: RootState) => state.userState.type)
  const toast = useToast()
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionPreview'>>()
  const interventionID = route.params?.interventionId ?? "";
  const [editModal, setEditModal] = useState(null)

  const [highlightedTree, setHighlightedTree] = useState('')

  const { addNewLog } = useLogManagement()
  const InterventionData = useObject<InterventionData>(
    RealmSchema.Intervention, interventionID
  )
  const { saveIntervention, updateInterventionMetaData, resetIntervention } = useInterventionManagement()
  const dispatch = useDispatch()

  const scrollViewRef = useRef(null); // Reference for the ScrollView
  const childRefs = useRef([]);

  const handleEdit = async (item: InterventionData) => {
    setEditModal(null)
    await resetIntervention(item.intervention_id)
    dispatch(updateNewIntervention())
  }

  const closeAllModals = () => {
    setEditModal(null)
  }


  const openEditModal = (item: InterventionData) => {
    const obj = JSON.parse(JSON.stringify(item))
    setEditModal(obj)
  }

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
  function formatString(str) {
    return str.toLowerCase().replace(/\s+/g, '-');
  }

  const setupMetaData = async () => {
    const localMeta = realm.objects<Metadata>(RealmSchema.Metadata)
    const parsedMeta = JSON.parse(InterventionData.meta_data)
    const updatedMetadata = { ...parsedMeta };
    if (localMeta?.length) {
      localMeta.forEach(el => {
        if (el.accessType === 'private') {
          const privateKey = formatString(el.key)
          updatedMetadata.private = {
            ...updatedMetadata.private, [privateKey]: {
              "key":privateKey,
              "originalKey": privateKey,
              "value": el.value,
              "label": el.key,
              "type": "input",
              "unit": "",
              "visibility": "private",
              "dataType": "string",
              "elementType": "metaData"
            }
          }
        }
        if (el.accessType === 'public') {
          const publicKey = formatString(el.key)
          updatedMetadata.public = {
            ...updatedMetadata.public, [publicKey]: {
              "key": publicKey,
              "originalKey": publicKey,
              "value": el.value,
              "label": el.key,
              "type": "input",
              "unit": "",
              "visibility": "public",
              "dataType": "string",
              "elementType": "metaData"
            }
          }
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

  useEffect(() => {
    try {
      if (highlightedTree) {
        setTimeout(() => {
          const findIndex = InterventionData.sample_trees.findIndex(el => el.tree_id === highlightedTree)
          if (highlightedTree) {
            const index = findIndex
            if (childRefs.current[index]) {
              childRefs.current[index].measureLayout(
                scrollViewRef.current,
                (x, y) => {
                  scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
                },
                (error) => console.log('Measure failed', error)
              );
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.log("error", error)
    }
  }, [highlightedTree])



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

  const moveToHome = () => {
    navigation.popToTop()
    //@ts-expect-error Extra params
    navigation.navigate('Home', {
      screen: 'Map'
    });
  }


  const renderRightContainer = () => {
    if (InterventionData.is_complete && InterventionData.status === 'PENDING_DATA_UPLOAD') {
      return (
        <View style={styles.rightWrapper}>
          <TouchableOpacity style={styles.editWrapper} onPress={() => { openEditModal(InterventionData) }}>
            <Text style={styles.editText}>Edit</Text>
            <PenIcon width={30} height={30} />
          </TouchableOpacity>
        </View>
      )
    }

    if (InterventionData.is_complete && InterventionData.status !== 'SYNCED') {
      return <TouchableOpacity style={[styles.syncContainer]} onPress={moveToHome}>
        <UnsyncIcon width={20} height={20} />
        <Text style={styles.label}>Sync Now</Text>
      </TouchableOpacity>
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
      <DeleteModal isVisible={editModal !== null} toggleModal={setEditModal} removeFavSpecie={handleEdit} headerLabel={'Edit Intervention'} noteLabel={'Do you want to edit intervention.'} primeLabel={'Edit'} secondaryLabel={'Cancel'} extra={editModal} secondaryHandler={closeAllModals} />
      <ScrollView
        decelerationRate='normal'
        style={styles.scrollWrapper} bounces={false} showsVerticalScrollIndicator={false} ref={scrollViewRef}>
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
            passRefs={(ref, index) => (childRefs.current[index] = ref)}
          />
        )}
        {InterventionData.meta_data !== '{}' && <InterventionMetaData data={InterventionData.meta_data} />}
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
    borderRadius: 10,
    marginRight: '5%'
  },
  editWrapper: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 10,
    paddingLeft: 20,
    backgroundColor: Colors.BACKDROP_COLOR
  },
  editText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 20,
    color: Colors.TEXT_COLOR
  },
  rightWrapper: {
    flexDirection: 'row',
    marginRight: '5%'
  }
})
