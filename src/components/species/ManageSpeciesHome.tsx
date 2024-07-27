import React, { useEffect, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { scaleSize } from 'src/utils/constants/mixins'
import ManageSpeciesHeader from './ManageSpeciesHeader'
import EmptyManageSpeciesList from './EmptyManageSpeciesList'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { SpecieCard } from './ManageSpeciesCard'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { PlantedSpecies } from 'src/types/interface/slice.interface'
import { updateUserSpeciesadded } from 'src/store/slice/appStateSlice'
import { getUserSpecies } from 'src/api/api.fetch'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { RootState } from 'src/store'
import { RefreshControl } from 'react-native'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { errotHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useToast } from 'react-native-toast-notifications'

const cardSize = scaleSize(60)

interface Props {
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[]
  isManageSpecies: boolean
  showTreeModal: (item: IScientificSpecies) => void
  interventionEdit: string
  form_id: string
  interventionKey: INTERVENTION_TYPE
}

const ManageSpeciesHome = (props: Props) => {
  const {
    toogleFavSpecies,
    userFavSpecies,
    isManageSpecies,
    interventionEdit,
    showTreeModal,
    form_id,
    interventionKey
  } = props
  const [loading, setLoading] = useState(false)


  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const { addUserSpecies } = useManageScientificSpecies()
  const { updateInterventionPlantedSpecies } = useInterventionManagement()
  const { userSpecies, isLogedIn } = useSelector((state: RootState) => state.appState)
  const toast = useToast()

  useEffect(() => {
    if (!userSpecies && isLogedIn) {
      setTimeout(() => {
        syncUserSpecies()
      }, 3000);
    }
  }, [])


  const syncUserSpecies = async () => {
    setLoading(true)
    try {
      const result = await getUserSpecies()
      if (result && result.length > 0) {
        const resposne = await addUserSpecies(result)
        if (resposne) {
          dispatch(updateUserSpeciesadded(true))
        }
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log("error", error)
    }
  }



  const handleSpeciesPress = async (item: IScientificSpecies) => {
    const speciesData = JSON.parse(JSON.stringify(item))
    if (interventionEdit) {
      showTreeModal(speciesData);
      return;
    }
    const { is_multi_species, tree_details_required } = setUpIntervention(interventionKey)
    if (!isManageSpecies) {
      if (is_multi_species) {
        showTreeModal(speciesData)
      } else {
        const updatedSPecies: PlantedSpecies = {
          guid: speciesData.guid,
          scientificName: speciesData.scientificName,
          aliases: speciesData.aliases,
          count: 1,
          image: speciesData.image
        }
        const result = await updateInterventionPlantedSpecies(form_id, updatedSPecies)
        if (!result) {
          errotHaptic()
          toast.show('Error occured while adding species')
          return
        }
        if (tree_details_required) {
          navigation.navigate('ReviewTreeDetails', { detailsCompleted: false, id: form_id })
        } else {
          console.log("lksd")
          navigation.navigate('LocalForm',{id:form_id})
        }
      }
    } else {
      navigation.navigate('SpeciesInfo', { guid: speciesData.guid })
    }
  }

  const handleRemoveFav = (item: IScientificSpecies) => {
    toogleFavSpecies(item, false)
  }

  const renderSpecieCard = (item: IScientificSpecies) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={handleSpeciesPress}
        actionName={''}
        handleRemoveFavourite={handleRemoveFav} isSelectSpecies={false} />
    )
  }
  return (
    <FlashList
      data={userFavSpecies}
      renderItem={({ item }) => renderSpecieCard(item)}
      estimatedItemSize={cardSize}
      ListHeaderComponent={<ManageSpeciesHeader isManageSecies={isManageSpecies} />}
      ListEmptyComponent={<EmptyManageSpeciesList />}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={syncUserSpecies}
        />}
    />
  )
}

export default ManageSpeciesHome
