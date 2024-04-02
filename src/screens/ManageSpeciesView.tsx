import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import ManageSpeciesHome from 'src/components/species/ManageSpeciesHome'
import RemoveSpeciesModal from 'src/components/species/RemoveSpeciesModal'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import {useQuery} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'

const ManageSpeciesView = () => {
  const [showRemoveFavModal, setShowRemoveModal] = useState(false)
  const [delteSpeciedId, setDeleteSpecieID] = useState('')
  const route = useRoute<RouteProp<RootStackParamList, 'ManageSpecies'>>()
  const isSelectSpecies = route.params && route.params.isSelectSpecies
  const {updateUserFavSpecies} = useManageScientificSpecies()

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

  return (
    <View style={styles.container}>
      <ManageSpeciesHome
        toogleFavSpecies={addRemoveUserFavSpecies}
        userFavSpecies={userFavSpecies}
        isSelectSpecies={isSelectSpecies}
      />
      <RemoveSpeciesModal
        isVisible={showRemoveFavModal}
        toogleModal={toogleRemoveFavModal}
        removeFavSpecie={removeSpecies}
      />
    </View>
  )
}

export default ManageSpeciesView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
