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
import useManageSpeciesTour from 'src/hooks/useManageSpeciesTour'
import { SPECIES_TOUR_STEPS } from 'src/utils/tour/manageSpeciesTour'
import { useTourAction } from 'src/hooks/useTourController'


const cardSize = scaleSize(60)

interface Props {
  toggleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[]
  isManageSpecies: boolean
  currentProjectUid: string
  handleSpeciesPress: (item: IScientificSpecies, onlyProjectSpecies: boolean) => void
}

const ManageSpeciesHome = (props: Props) => {
  const {
    toggleFavSpecies,
    userFavSpecies,
    isManageSpecies,
    handleSpeciesPress,
    currentProjectUid
  } = props
  const [loading, setLoading] = useState(false)
  const [onlyProjectSpecies, setOnlyProjectSpecies] = useState(true)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const { addUserSpecies } = useManageScientificSpecies()
  const { isLoggedIn, userProjectSpecies } = useSelector((state: RootState) => state.appState)
  const { currentProject } = useSelector((state: RootState) => state.projectState)
  const { advanceIfOn } = useManageSpeciesTour()
  const showProjectFilter = isLoggedIn && !!currentProject.projectId

  useEffect(() => {
    if (isLoggedIn) {
      syncUserSpecies()
    }
  }, [])

  const handleNav = () => {
    navigation.navigate('SpeciesSearch', { manageSpecies: isManageSpecies })
  }

  // The walkthrough's first step lets the tap fall through to the search bar,
  // but a near-miss on the backdrop should open it too: one control, one
  // decision. Lending the real handler keeps the route params in one place.
  useTourAction(SPECIES_TOUR_STEPS.SEARCH, handleNav)


  const syncUserSpecies = async () => {
    setLoading(true)
    try {
      const { responseData, responseError } = await getUserAllSpeceis(currentProjectUid)
      console.log('Fetched user species from server:', responseData, 'error:', responseError)
      if (responseError) {
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
      console.log('Updating user project species in state with',normalizedSpecies, 'species')
      dispatch(updateUserPojectSpecies(normalizedSpecies))
      setLoading(false)
    } catch (error) {
      console.error('Error syncing user species:', error)
      setLoading(false)
    }
  }



  const handleRemoveFav = (item: IScientificSpecies) => {
    toggleFavSpecies(item, false)
  }

  const renderSpecieCard = (item: IScientificSpecies, onlyProjectSpecies: boolean, index: number) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={() => { handleSpeciesPress(item, onlyProjectSpecies) }}
        actionName={''}
        onlyProjectSpecies={onlyProjectSpecies}
        // The walkthrough points at the top card, so only that one registers as
        // a tour target. Target ids are unique per screen.
        isTourTarget={index === 0}
        handleRemoveFavorite={handleRemoveFav} isSelectSpecies={false} />
    )
  }

  // Flipping the switch is what the walkthrough's filter step asks for, so the
  // act itself moves the tour on. Outside the tour this is a no-op.
  const handleToggleProjectSpecies = (value: boolean) => {
    setOnlyProjectSpecies(value)
    advanceIfOn(SPECIES_TOUR_STEPS.FILTER)
  }

  const displayedSpecies = showProjectFilter && onlyProjectSpecies
    ? userProjectSpecies
    : userFavSpecies
  console.log('displayedSpecies', displayedSpecies)
  return (
    <FlashList
      data={displayedSpecies}
      renderItem={({ item, index }) => renderSpecieCard(item, onlyProjectSpecies, index)}
      estimatedItemSize={cardSize}
      ListHeaderComponent={
        <ManageSpeciesHeader
          openSearchModal={handleNav}
          showProjectFilter={showProjectFilter}
          onlyProjectSpecies={onlyProjectSpecies}
          onToggleProjectSpecies={handleToggleProjectSpecies}
          isFetching={loading}
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
