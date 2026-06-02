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
import { updateUserPojectSpecies, updateUserSpeciesadded } from 'src/store/slice/appStateSlice'
import { getUserAllSpeceis, getUserProjectSpecies, getUserSpecies } from 'src/api/api.fetch'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { RootState } from 'src/store'
import { RefreshControl } from 'react-native'


const cardSize = scaleSize(60)

interface Props {
  toggleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[]
  isManageSpecies: boolean
  v3Approved: boolean
  currentProjectUid: string
  handleSpeciesPress: (item: IScientificSpecies, onlyProjectSpecies: boolean) => void
}

const ManageSpeciesHome = (props: Props) => {
  const {
    toggleFavSpecies,
    userFavSpecies,
    isManageSpecies,
    handleSpeciesPress,
    v3Approved,
    currentProjectUid
  } = props
  const [loading, setLoading] = useState(false)
  const [onlyProjectSpecies, setOnlyProjectSpecies] = useState(true)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const { addUserSpecies } = useManageScientificSpecies()
  const { isLoggedIn, userProjectSpecies } = useSelector((state: RootState) => state.appState)
  const { currentProject } = useSelector((state: RootState) => state.projectState)
  const showProjectFilter = isLoggedIn && !!currentProject.projectId

  useEffect(() => {
    if (isLoggedIn) {
      syncUserSpecies()
    }
  }, [])

  const handleNav = () => {
    navigation.navigate('SpeciesSearch', { manageSpecies: isManageSpecies })
  }


  const syncUserSpecies = async () => {
    setLoading(true)
    try {
      const { responseData, responseError } = await getUserAllSpeceis(v3Approved, currentProjectUid)
      console.log("responseData", JSON.stringify(responseData,null,2))
      if (responseError) {
        console.log("There was error gettting user species")
        return
      }
      const normalizedSpecies: IScientificSpecies[] = (responseData ?? []).map((specie) => ({
        guid: specie.scientificSpecies,
        scientificName: specie.scientificName || '',
        aliases: specie.aliases || '',
        image: specie.image || '',
        description: specie.description || '',
        specieId: specie.id || '',
        isUserSpecies: true,
        isUploaded: true,
        isUpdated: true,
      }))
      dispatch(updateUserPojectSpecies(normalizedSpecies))
      if (responseData && responseData.length > 0) {
         await addUserSpecies(responseData)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log("error", error)
    }
  }



  const handleRemoveFav = (item: IScientificSpecies) => {
    toggleFavSpecies(item, false)
  }

  const renderSpecieCard = (item: IScientificSpecies,onlyProjectSpecies:boolean) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={()=>{handleSpeciesPress(item,onlyProjectSpecies)}}
        actionName={''}
        onlyProjectSpecies={onlyProjectSpecies}
        handleRemoveFavorite={handleRemoveFav} isSelectSpecies={false} />
    )
  }

  const displayedSpecies = showProjectFilter && onlyProjectSpecies
    ? userProjectSpecies
    : userFavSpecies

  return (
    <FlashList
      data={displayedSpecies}
      renderItem={({ item }) => renderSpecieCard(item,onlyProjectSpecies)}
      estimatedItemSize={cardSize}
      ListHeaderComponent={
        <ManageSpeciesHeader
          openSearchModal={handleNav}
          showProjectFilter={showProjectFilter}
          onlyProjectSpecies={onlyProjectSpecies}
          onToggleProjectSpecies={setOnlyProjectSpecies}
          isFetching={loading}
          v3Approved={v3Approved}
        />
      }
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
