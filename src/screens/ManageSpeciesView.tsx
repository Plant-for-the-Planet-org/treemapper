import { StyleSheet } from 'react-native'
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
import { Colors } from 'src/utils/constants'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { InterventionData, PlantedSpecies } from 'src/types/interface/slice.interface'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { useToast } from 'react-native-toast-notifications'
import Header from 'src/components/common/Header'
import i18next from 'i18next'
import { TouchableOpacity } from 'react-native'
import AlertModal from 'src/components/common/AlertModal'
import SyncIcon from 'assets/images/svg/SyncIcon.svg'


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

  const isManageSpecies = route.params?.manageSpecies;
  const EditInterventionSpecies = route.params?.reviewTreeSpecies;
  const interventionID = route.params?.id ?? '';
  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false)
  useEffect(() => {
    const InterventionData = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
    if (InterventionData) {
      setInterventionData(InterventionData)
    }
  }, [interventionID])


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
    const result = await updateInterventionPlantedSpecies(interventionData.form_id, speciesDetails)
    if (!result) {
      toast.show("Error occurred while adding species")
      return
    }
    navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: interventionData.form_id })
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
      const result = await updateInterventionPlantedSpecies(interventionData.form_id, speciesDetails)
      if (!result) {
        toast.show("Error occurred while adding species")
        return
      }
      navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: interventionData.form_id })
    }
  }

  const handleSpeciesSyncPress = async () => {
    setShowSpeciesSyncAlert(false)
    setTimeout(() => {
      navigation.navigate('SyncSpecies', { inApp: true })
    }, 300);
  }

  const renderRightComponent = () => {
    return (<TouchableOpacity onPress={() => { setShowSpeciesSyncAlert(true) }} style={{marginRight:20}}>
      <SyncIcon width={20} height={20} />
    </TouchableOpacity>)
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t("label.manage_species")} rightComponent={renderRightComponent()} />
      <ManageSpeciesHome
        toggleFavSpecies={addRemoveUserFavSpecies}
        userFavSpecies={[...userFavSpecies]}
        interventionKey={interventionData ? interventionData.intervention_key : 'single-tree-registration'}
        form_id={interventionData ? interventionData.form_id : ""}
        isManageSpecies={isManageSpecies}
        showTreeModal={handleSelectedMultiSpecies}
        interventionEdit={EditInterventionSpecies}
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
})
