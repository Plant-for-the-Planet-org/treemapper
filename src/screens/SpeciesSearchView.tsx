import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import {Colors} from 'src/utils/constants'
import SpeciesSearchHeader from 'src/components/species/SpeciesSearchHeader'
import EmptySpeciesSearchList from 'src/components/species/EmptySpeciesSearchList'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import SpeciesSearchCard from 'src/components/species/SpeciesSearchCard'
import {FlashList} from '@shopify/flash-list'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const SpeciesSearchView = () => {
  const [specieList, setSpciesList] = useState<IScientificSpecies[]>([])
  const {updateUserFavSpecies} = useManageScientificSpecies()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleBackPress = () => {
    navigation.goBack()
  }

  const handleFavSpecies = async (
    item: IScientificSpecies,
    status: boolean,
  ) => {
    setSpciesList(prevSpecies => {
      return prevSpecies.map(species =>
        species.guid === item.guid
          ? {...species, is_user_species: status}
          : species,
      )
    })
    updateUserFavSpecies(item.guid, status)
  }

  return (
    <View style={styles.contnetWrapper}>
      <FlashList
        data={specieList}
        renderItem={({item}) => (
          <SpeciesSearchCard item={item} toogleFavSpecies={handleFavSpecies} />
        )}
        keyExtractor={item => item.guid}
        keyboardShouldPersistTaps="always"
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SpeciesSearchHeader
            backPress={handleBackPress}
            toogleSyncModal={null}
            setSpciesList={setSpciesList}
          />
        }
        ListEmptyComponent={EmptySpeciesSearchList}
      />
    </View>
  )
}

export default SpeciesSearchView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    backgroundColor: Colors.WHITE,
  },
  contnetWrapper: {
    flex: 1,
    paddingTop: 10,
  },
})