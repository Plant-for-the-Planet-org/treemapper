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
import { updateUserSpeciesadded } from 'src/store/slice/appStateSlice'
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
  handleSpeciesPress: (item: IScientificSpecies) => void
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


  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const { addUserSpecies } = useManageScientificSpecies()
  const { userSpecies, isLoggedIn } = useSelector((state: RootState) => state.appState)

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
      if (responseError) {
        console.log("There was error gettting user species")
        return
      }
      if (responseData.length > 0) {
        const result = await addUserSpecies(responseData)
        if (result) {
          dispatch(updateUserSpeciesadded(true))
        }
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

  const renderSpecieCard = (item: IScientificSpecies) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={handleSpeciesPress}
        actionName={''}
        handleRemoveFavorite={handleRemoveFav} isSelectSpecies={false} />
    )
  }
  return (
    <FlashList
      data={userFavSpecies}
      renderItem={({ item }) => renderSpecieCard(item)}
      estimatedItemSize={cardSize}
      ListHeaderComponent={<ManageSpeciesHeader openSearchModal={handleNav} />}
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
