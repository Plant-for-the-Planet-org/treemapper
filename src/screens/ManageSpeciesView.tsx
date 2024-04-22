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
import {
  addSampleTreeSpecies,
} from 'src/store/slice/sampleTreeSlice'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
const ManageSpeciesView = () => {
  const [showRemoveFavModal, setShowRemoveModal] = useState(false)
  const [delteSpeciedId, setDeleteSpecieID] = useState('')
  const [treeModalDetails, setTreeModalDetails] =
    useState<IScientificSpecies | null>(null)

  const route = useRoute<RouteProp<RootStackParamList, 'ManageSpecies'>>()
  const isManageSpecies = route.params && route.params.manageSpecies

  const formFlowData = useSelector((state: RootState) => state.formFlowState)

  const {species} = useSelector(
    (state: RootState) => state.sampleTree,
  )

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { updateUserFavSpecies } = useManageScientificSpecies()

  const dispatch = useDispatch()
  const userFavSpecies = useQuery(RealmSchema.ScientificSpecies, data => {
    return data.filtered('is_user_species == true').sorted('guid', false)
  })

  const toogleRemoveFavModal = () => {
    setShowRemoveModal(!showRemoveFavModal)
  }

  const addRemoveUserFavSpecies = (item: IScientificSpecies) => {
    setDeleteSpecieID(item.guid)
    toogleRemoveFavModal()
  }

  const removeSpecies = () => {
    toogleRemoveFavModal()
    setTimeout(() => {
      updateUserFavSpecies(delteSpeciedId, false)
    }, 300)
  }
  const closeSpeciesModal = (count: string) => {
    const speciesDetails: IScientificSpecies = {
      guid: treeModalDetails.guid,
      scientific_name: treeModalDetails.scientific_name,
      is_user_species: treeModalDetails.is_user_species,
      aliases: treeModalDetails.aliases,
      image: treeModalDetails.image,
    }
    const filteredData = species.filter(
      el => el.info.guid !== treeModalDetails.guid,
    )
    filteredData.push({
      info: { ...speciesDetails },
      count: Number(count),
    })
    dispatch(addSampleTreeSpecies(filteredData))
    setTreeModalDetails(null)
    navigation.navigate('TotalTrees', { isSelectSpecies: false })
  }

  const handleSelecteMultiSpecies=(item:IScientificSpecies)=>{
    const finalData = JSON.parse(JSON.stringify(item))
    if(formFlowData.species_count_required){
      setTreeModalDetails(finalData)
    }else{
      const speciesDetails: IScientificSpecies = {
        guid: finalData.guid,
        scientific_name: finalData.scientific_name,
        is_user_species: finalData.is_user_species,
        aliases: finalData.aliases,
        image: finalData.image,
      }
      const filteredData = species.filter(
        el => el.info.guid !== finalData.guid,
      )
      filteredData.push({
        info: { ...speciesDetails },
        count: 0,
      })
      dispatch(addSampleTreeSpecies(filteredData))
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
