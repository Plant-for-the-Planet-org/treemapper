import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ManageSpeciesHome from 'src/components/species/ManageSpeciesHome'
import RemoveSpeciesModal from 'src/components/species/RemoveSpeciesModal'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { useQuery, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import TreeCountModal from 'src/components/species/TreeCountModal'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { InterventionData, PlantedSpecies } from 'src/types/interface/slice.interface'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { useToast } from 'react-native-toast-notifications'
import Header from 'src/components/common/Header'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import SyncIcon from 'assets/images/svg/SyncIcon.svg'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { updateSelectedSpeciesId, updateSpeciesUpdatedAt } from 'src/store/slice/tempStateSlice'
import RotatingView from 'src/components/common/RotatingView'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { updateSpeciesDownloaded } from 'src/store/slice/appStateSlice'


const ManageSpeciesView = () => {
  const [showRemoveFavModal, setShowRemoveFavModal] = useState(false)
  const [deleteSpecieId, setDeleteSpecieId] = useState('')
  const [interventionData, setInterventionData] = useState<InterventionData | null>(null)
  const [treeModalDetails, setTreeModalDetails] = useState<IScientificSpecies | null>(null)


  const route = useRoute<RouteProp<RootStackParamList, 'ManageSpecies'>>()
  const realm = useRealm()
  const { updateInterventionPlantedSpecies, updateSampleTreeSpecies } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updateUserFavSpecies } = useManageScientificSpecies()
  const toast = useToast()
  const { selectedId, speciesDownloading, speciesWriting } = useSelector((state: RootState) => state.tempState)
  const SelectedID = selectedId;
  const SpeciesSynced = useSelector((state: RootState) => state.appState.speciesSync)

  const isManageSpecies = route.params?.manageSpecies;
  const EditInterventionSpecies = route.params?.reviewTreeSpecies;
  const isMultiTreeEdit = route.params?.multiTreeEdit;
  const interventionID = route.params?.id ?? '';

  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false)
  const dispatch = useDispatch()
  useEffect(() => {
    const InterventionData = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
    if (InterventionData) {
      setInterventionData(InterventionData)
    }
  }, [interventionID])

  useEffect(() => {
    if (SelectedID !== '') {
      const specieData = realm.objectForPrimaryKey<IScientificSpecies>(RealmSchema.ScientificSpecies, SelectedID)
      dispatch(updateSelectedSpeciesId(''))
      if (specieData) {
        handleSpeciesPress(JSON.parse(JSON.stringify(specieData)))
      }
    }
  }, [SelectedID])



  const userFavSpecies = useQuery<IScientificSpecies>(RealmSchema.ScientificSpecies, data => {
    return data.filtered('isUserSpecies == true')
  })

  const toggleRemoveFavModal = () => {
    setShowRemoveFavModal(!showRemoveFavModal)
  }

  const addRemoveUserFavSpecies = (item: IScientificSpecies) => {
    setDeleteSpecieId(item.guid)
    toggleRemoveFavModal()
  }

  const editInterventionSpecies = async (item: IScientificSpecies) => {
    await updateSampleTreeSpecies(interventionID, EditInterventionSpecies, item)
    navigation.goBack()
  }

  const removeSpecies = () => {
    toggleRemoveFavModal()
    updateUserFavSpecies(deleteSpecieId, false)
  }





  const closeSpeciesModal = async (count: string) => {
    const speciesDetails: PlantedSpecies = {
      guid: treeModalDetails.guid,
      scientificName: treeModalDetails.scientificName,
      aliases: treeModalDetails.aliases,
      count: Number(count),
      image: treeModalDetails.image
    }
    setTreeModalDetails(null)
    const result = await updateInterventionPlantedSpecies(interventionData.form_id, speciesDetails, isMultiTreeEdit)
    if (!result) {
      toast.show("Error occurred while adding species")
      return
    }
    setTimeout(() => {
      navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: interventionData.form_id, isEditTrees: isMultiTreeEdit })
    }, 300);
  }

  const handleSelectedMultiSpecies = async (item: IScientificSpecies) => {
    const finalData = JSON.parse(JSON.stringify(item))
    if (EditInterventionSpecies) {
      editInterventionSpecies(finalData);
      return;
    }
    const { species_count_required } = setUpIntervention(interventionData.intervention_key)
    if (species_count_required) {
      setTreeModalDetails(finalData)
    } else {
      const speciesDetails: PlantedSpecies = {
        guid: finalData.guid,
        scientificName: finalData.scientificName,
        aliases: finalData.aliases,
        count: 1,
        image: finalData.image
      }
      const result = await updateInterventionPlantedSpecies(interventionData.form_id, speciesDetails, isMultiTreeEdit)
      if (!result) {
        toast.show("Error occurred while adding species")
        return
      }
      navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: interventionData.form_id, isEditTrees: isMultiTreeEdit })
    }
  }

  const handleSpeciesSyncPress = async () => {
    setShowSpeciesSyncAlert(false)
    dispatch(updateSpeciesDownloaded(''))
    dispatch(updateSpeciesUpdatedAt())
  }

  const handleSpeciesPress = async (item: IScientificSpecies) => {
    const speciesData = JSON.parse(JSON.stringify(item))
    if (EditInterventionSpecies) {
      handleSelectedMultiSpecies(speciesData);
      return;
    }
    const { is_multi_species, tree_details_required } = setUpIntervention(interventionData ? interventionData.intervention_key : 'single-tree-registration')
    if (!isManageSpecies) {
      if (is_multi_species) {
        handleSelectedMultiSpecies(speciesData)
      } else {
        const updatedSPecies: PlantedSpecies = {
          guid: speciesData.guid,
          scientificName: speciesData.scientificName,
          aliases: speciesData.aliases,
          count: 1,
          image: speciesData.image
        }
        const result = await updateInterventionPlantedSpecies(interventionData ? interventionData.form_id : "", updatedSPecies, isMultiTreeEdit)
        if (!result) {
          errorHaptic()
          toast.show('Error occurred while adding species')
          return
        }
        if (tree_details_required) {
          navigation.navigate('ReviewTreeDetails', { detailsCompleted: false, id: interventionData ? interventionData.form_id : "" })
        } else {
          navigation.navigate('LocalForm', { id: interventionData ? interventionData.form_id : "" })
        }
      }
    } else {
      navigation.navigate('SpeciesInfo', { guid: speciesData.guid })
    }
  }


  const renderRightComponent = () => {
    if (speciesWriting) {
      return (
        <View style={styles.blockContainer}>
          <RotatingView isClockwise={true}>
            <RefreshIcon />
          </RotatingView>
          <Text style={styles.label}>Syncing</Text>
        </View>
      )
    }
    if (speciesDownloading) {
      return (
        <View style={styles.blockContainer}>
          <RotatingView isClockwise={true}>
            <RefreshIcon />
          </RotatingView>
          <Text style={styles.label}>Downloading</Text>
        </View>
      )
    }

    if (SpeciesSynced) {
      return (<TouchableOpacity onPress={() => { setShowSpeciesSyncAlert(true) }} style={{ marginRight: 20 }}>
        <SyncIcon width={20} height={20} />
      </TouchableOpacity>)
    }

    return <></>
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t("label.manage_species")} rightComponent={renderRightComponent()} />
      <ManageSpeciesHome
        handleSpeciesPress={handleSpeciesPress}
        toggleFavSpecies={addRemoveUserFavSpecies}
        userFavSpecies={[...userFavSpecies]}
        isManageSpecies={isManageSpecies}
      />
      <RemoveSpeciesModal
        isVisible={showRemoveFavModal}
        toggleModal={toggleRemoveFavModal}
        removeFavSpecie={removeSpecies}
      />
      <TreeCountModal
        showTreeCountModal={treeModalDetails !== null}
        setShowTreeCountModal={setTreeModalDetails}
        activeSpecie={treeModalDetails}
        onPressTreeCountNextBtn={closeSpeciesModal}
      />
      <AlertModal
        visible={showSpeciesSyncAlert}
        heading={i18next.t('label.species_sync_update_alert_title')}
        message={i18next.t('label.species_sync_update_alert_message')}
        showSecondaryButton={true}
        primaryBtnText={i18next.t('label.yes')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={handleSpeciesSyncPress}
        onPressSecondaryBtn={() => setShowSpeciesSyncAlert(false)}
      />
    </SafeAreaView>
  )
}

export default ManageSpeciesView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  blockContainer: {
    paddingHorizontal: 10,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    borderRadius: 10,
    marginRight: 10
  },
  label: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 8
  },
  infoIconWrapper: {
    marginRight: 5,
    marginLeft: 10
  },
})
