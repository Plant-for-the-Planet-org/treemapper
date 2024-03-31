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

const cardSize = scaleSize(60)

interface Props {
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  userFavSpecies: IScientificSpecies[] | any
}

const ManageSpeciesHome = (props: Props) => {
  const {toogleFavSpecies, userFavSpecies} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const dummy = () => {
    return null
  }

  const openSpeciesInfo = (guid: string) => {
    navigation.navigate('SpeciesInfo', {guid})
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
        onPressSpecies={openSpeciesInfo}
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
