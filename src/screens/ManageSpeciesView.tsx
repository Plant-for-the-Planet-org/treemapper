import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import ManageSpeciesHome from 'src/components/species/ManageSpeciesHome'
import RemoveSpeciesModal from 'src/components/species/RemoveSpeciesModal'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import TreeCountModal from 'src/components/species/TreeCountModal'

import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateTreesSpecies } from 'src/store/slice/interventionSlice'
import { updatePlantedSpecies } from 'src/store/slice/registerFormSlice'
import { PlantedSpecies } from 'src/types/interface/slice.interface'
const ManageSpeciesView = () => {
  const [showRemoveFavModal, setShowRemoveModal] = useState(false)
  const [delteSpeciedId, setDeleteSpecieID] = useState('')
  const [treeModalDetails, setTreeModalDetails] =
    useState<IScientificSpecies | null>(null)

  const route = useRoute<RouteProp<RootStackParamList, 'ManageSpecies'>>()
  const isManageSpecies = route.params && route.params.manageSpecies
  const EditInterventionSpecies = route.params && route.params.reviewTreeSpecies

  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const InterventionState = useSelector((state: RootState) => state.interventionState)

  const { updateInterventionPlantedSpecies } = useInterventionManagement()

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { updateUserFavSpecies } = useManageScientificSpecies()
  const { updateSampleTreeSpecies } = useInterventionManagement()


  const dispatch = useDispatch()
  const userFavSpecies = useQuery(RealmSchema.ScientificSpecies, data => {
    return data.filtered('is_user_species == true')
  })

  const toogleRemoveFavModal = () => {
    setShowRemoveModal(!showRemoveFavModal)
  }

  const addRemoveUserFavSpecies = (item: IScientificSpecies) => {
    setDeleteSpecieID(item.guid)
    toogleRemoveFavModal()
  }

  const editInterventionSpecies = async (item: IScientificSpecies) => {
    await updateSampleTreeSpecies(InterventionState.intervention_id, EditInterventionSpecies, item)
    dispatch(updateTreesSpecies({ treeId: EditInterventionSpecies, data: item }))
    navigation.goBack()
  }

  const removeSpecies = () => {
    toogleRemoveFavModal()
    setTimeout(() => {
      updateUserFavSpecies(delteSpeciedId, false)
    }, 300)
  }
  const closeSpeciesModal = async (count: string) => {
    const speciesDetails: PlantedSpecies = {
      guid: treeModalDetails.guid,
      scientific_name: treeModalDetails.scientific_name,
      aliases: treeModalDetails.aliases,
      count: Number(count),
      image: treeModalDetails.image
    }

    const filteredData = formFlowData.plantedSpecies.filter(
      el => el.guid !== speciesDetails.guid,
    )
    dispatch(updatePlantedSpecies([...filteredData, speciesDetails]))
    await updateInterventionPlantedSpecies(formFlowData.form_id, speciesDetails)
    setTreeModalDetails(null)
    navigation.navigate('TotalTrees', { isSelectSpecies: false })
  }

  const handleSelecteMultiSpecies = (item: IScientificSpecies) => {
    const finalData = JSON.parse(JSON.stringify(item))
    if (EditInterventionSpecies) {
      editInterventionSpecies(finalData);
      return;
    }
    if (formFlowData.species_count_required) {
      setTreeModalDetails(finalData)
    } else {
      const speciesDetails: PlantedSpecies = {
        guid: finalData.guid,
        scientific_name: finalData.scientific_name,
        aliases: finalData.aliases,
        count: 1,
        image: finalData.image
      }
      const filteredData = formFlowData.plantedSpecies.filter(
        el => el.guid !== finalData.guid,
      )

      dispatch(updatePlantedSpecies([...filteredData, speciesDetails]))
      navigation.navigate('TotalTrees', { isSelectSpecies: false })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ManageSpeciesHome
        toogleFavSpecies={addRemoveUserFavSpecies}
        userFavSpecies={userFavSpecies}
        isManageSpecies={isManageSpecies}
        formData={formFlowData}
        showTreeModal={handleSelecteMultiSpecies}
        interventionEdit={EditInterventionSpecies}
      />
      <RemoveSpeciesModal
        isVisible={showRemoveFavModal}
        toogleModal={toogleRemoveFavModal}
        removeFavSpecie={removeSpecies}
      />
      <TreeCountModal
        showTreeCountModal={treeModalDetails !== null}
        setShowTreeCountModal={setTreeModalDetails}
        activeSpecie={treeModalDetails}
        onPressTreeCountNextBtn={closeSpeciesModal}
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
