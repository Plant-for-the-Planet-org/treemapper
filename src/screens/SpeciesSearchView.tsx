import { StyleSheet, } from 'react-native'
import React, { useState } from 'react'
import { Colors } from 'src/utils/constants'
import SpeciesSearchHeader from 'src/components/species/SpeciesSearchHeader'
import EmptySpeciesSearchList from 'src/components/species/EmptySpeciesSearchList'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import SpeciesSearchCard from 'src/components/species/SpeciesSearchCard'
import { FlashList } from '@shopify/flash-list'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import { useToast } from 'react-native-toast-notifications'

const SpeciesSearchView = () => {
  const [specieList, setSpciesList] = useState<IScientificSpecies[]>([])
  const { updateUserFavSpecies } = useManageScientificSpecies()
  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()
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
          ? { ...species, isUserSpecies: status }
          : species,
      )
    })
    updateUserFavSpecies(item.guid, status)
    if (status) {
      toast.show(`"${item.scientificName}" added to favorites`)
    } else {
      toast.show(`"${item.scientificName}" removed from favorites`)
    }
  }

  const handleCardPress = async (
    item: IScientificSpecies,
    status: boolean,
  ) => {
    handleFavSpecies(item, status)
  }

  const handleSpeciesSyncPress = async () => {
    setShowSpeciesSyncAlert(false)
    setTimeout(() => {
      navigation.navigate('SyncSpecies', { inApp: true })
    }, 300);
  }



  return (
    <SafeAreaView style={styles.contnetWrapper}>
      <FlashList
        data={specieList}
        renderItem={({ item }) => (
          <SpeciesSearchCard item={item} toogleFavSpecies={handleFavSpecies} handleCard={handleCardPress} />
        )}
        keyExtractor={item => item.guid}
        keyboardShouldPersistTaps="always"
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SpeciesSearchHeader
            backPress={handleBackPress}
            toogleSyncModal={setShowSpeciesSyncAlert}
            setSpciesList={setSpciesList}
          />
        }
        keyboardDismissMode='interactive'
        ListEmptyComponent={<EmptySpeciesSearchList />}
      />
      <AlertModal
        visible={showSpeciesSyncAlert}
        heading={i18next.t('label.species_sync_update_alert_title')}
        message={i18next.t('label.species_sync_update_alert_message')}
        showSecondaryButton={true}
        primaryBtnText={i18next.t('label.yes')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={handleSpeciesSyncPress}
        onPressSecondaryBtn={() => setShowSpeciesSyncAlert(false)}
      />
    </SafeAreaView>
  )
}

export default SpeciesSearchView

const styles = StyleSheet.create({
  contnetWrapper: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
})
