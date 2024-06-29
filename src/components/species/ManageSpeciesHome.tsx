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
import { updatePlantedSpecies } from 'src/store/slice/registerFormSlice'
import { PlantedSpecies, RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'
import { updateUserSpeciesadded } from 'src/store/slice/appStateSlice'
import { getUserSpecies } from 'src/api/api.fetch'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { RootState } from 'src/store'
import { RefreshControl } from 'react-native'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'

const cardSize = scaleSize(60)

interface Props {
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[] | any
  isManageSpecies: boolean
  formData: RegisterFormSliceInitalState | undefined
  showTreeModal: (item: IScientificSpecies) => void
  interventionEdit: string
}

const ManageSpeciesHome = (props: Props) => {
  const {
    toogleFavSpecies,
    userFavSpecies,
    isManageSpecies,
    formData,
    interventionEdit,
    showTreeModal,
  } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const { addUserSpecies } = useManageScientificSpecies()
  const { updateInterventionPlantedSpecies } = useInterventionManagement()
  const { userSpecies, isLogedIn } = useSelector((state: RootState) => state.appState)
  const [loading, setLoading] = useState(false)

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
    if (interventionEdit) {
      showTreeModal(item);
      return;
    }
    if (!isManageSpecies) {
      if (formData.is_multi_species) {
        showTreeModal(item)
      } else {
        const updatedSPecies: PlantedSpecies = {
          guid: item.guid,
          scientificName: item.scientificName,
          aliases: item.aliases,
          count: 1,
          image: item.image
        }
        dispatch(updatePlantedSpecies([updatedSPecies]))
        await updateInterventionPlantedSpecies(formData.form_id, updatedSPecies)
        if (formData.tree_details_required) {
          navigation.navigate('ReviewTreeDetails')
        } else {
          navigation.navigate('LocalForm')
        }
      }
    } else {
      navigation.navigate('SpeciesInfo', { guid: item.guid })
    }
  }

  const handleRemoveFav = (item: IScientificSpecies) => {
    toogleFavSpecies(item, false)
  }

  const renderSpecieCard = (item: IScientificSpecies | any) => {
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
