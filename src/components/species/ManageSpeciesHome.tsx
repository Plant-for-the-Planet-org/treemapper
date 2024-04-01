import React from 'react'
import {FlashList} from '@shopify/flash-list'
import {scaleSize} from 'src/utils/constants/mixins'
import ManageSpeciesHeader from './ManageSpeciesHeader'
import EmptyManageSpeciesList from './EmptyManageSpeciesList'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import {SpecieCard} from './ManageSpeciesCard'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {useDispatch} from 'react-redux'
import {updateFormSpecies} from 'src/store/slice/registerFormSlice'

const cardSize = scaleSize(60)

interface Props {
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[] | any
  isSelectSpecies: boolean
}

const ManageSpeciesHome = (props: Props) => {
  const {toogleFavSpecies, userFavSpecies, isSelectSpecies} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const dummy = () => {
    return null
  }

  const handleSpeciesPress = (guid: string) => {
    if (isSelectSpecies) {
      dispatch(
        updateFormSpecies({
          species_guid: guid,
          tree_id: String(new Date().getTime()),
        }),
      )
      navigation.navigate('DynamicForm')
    } else {
      navigation.navigate('SpeciesInfo', {guid})
    }
  }

  const handleRemoveFav = (item: IScientificSpecies) => {
    toogleFavSpecies(item, false)
  }

  const renderSpecieCard = (item: IScientificSpecies | any, index: number) => {
    return (
      <SpecieCard
        item={item}
        index={index}
        registrationType={null}
        onPressSpecies={handleSpeciesPress}
        addSpecieToInventory={dummy}
        editOnlySpecieName={'editOnlySpecieName'}
        onPressBack={dummy}
        isSampleTree={false}
        navigateToSpecieInfo={dummy}
        screen={'ManageSpecies'}
        handleRemoveFavourite={handleRemoveFav}
      />
    )
  }
  return (
    <FlashList
      data={userFavSpecies}
      renderItem={({item, index}) => renderSpecieCard(item, index)}
      estimatedItemSize={cardSize}
      ListHeaderComponent={<ManageSpeciesHeader />}
      ListEmptyComponent={EmptyManageSpeciesList}
    />
  )
}

export default ManageSpeciesHome
