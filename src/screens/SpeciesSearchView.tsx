import { StyleSheet, Text, } from 'react-native'
import React, { useState } from 'react'
import { Colors } from 'src/utils/constants'
import SpeciesSearchHeader from 'src/components/species/SpeciesSearchHeader'
import EmptySpeciesSearchList from 'src/components/species/EmptySpeciesSearchList'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import SpeciesSearchCard from 'src/components/species/SpeciesSearchCard'
import { FlashList } from '@shopify/flash-list'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import { useToast } from 'react-native-toast-notifications'
import { FONT_FAMILY_ITALIC, FONT_FAMILY_REGULAR } from 'src/utils/constants/typography'
import { useDispatch } from 'react-redux'
import { updateSelectedSpeciesId, updateSpeciesUpdatedAt } from 'src/store/slice/tempStateSlice'
import { updateSpeciesDownloaded } from 'src/store/slice/appStateSlice'

const SpeciesSearchView = () => {
  const [specieList, setSpecieList] = useState<IScientificSpecies[]>([])
  const { updateUserFavSpecies } = useManageScientificSpecies()
  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SpeciesSearch'>>()
  const isManageSpecies = route.params?.manageSpecies;
  const dispatch = useDispatch()
  const toast = useToast()
  const handleBackPress = () => {
    navigation.goBack()
  }


  const handleFavSpecies = async (
    item: IScientificSpecies,
    status: boolean,
  ) => {
    setSpecieList(prevSpecies => {
      return prevSpecies.map(species =>
        species.guid === item.guid
          ? { ...species, isUserSpecies: status }
          : species,
      )
    })
    updateUserFavSpecies(item.guid, status)
    toast.hideAll();
    if (status) {
      toast.show(<Text style={styles.toastLabel}><Text style={styles.speciesLabel}>"{item.scientificName}"</Text> {i18next.t("label.added_to_favorites")}</Text>, { style: { backgroundColor: Colors.GRAY_LIGHT }, textStyle: { textAlign: 'center' } })
    } else {
      toast.show(<Text style={styles.toastLabel}><Text style={styles.speciesLabel}>"{item.scientificName}"</Text> {i18next.t("label.removed_from_favorites")}</Text>, { style: { backgroundColor: Colors.GRAY_LIGHT }, textStyle: { textAlign: 'center' } })
    }
  }

  const handleCardPress = async (
    item: IScientificSpecies,
    status: boolean
  ) => {
    if (!isManageSpecies) {
      navigation.goBack()
      dispatch(updateSelectedSpeciesId(item.guid))
    } else {
      handleFavSpecies(item, status)
    }
  }

  const handleSpeciesSyncPress = async () => {
    setShowSpeciesSyncAlert(false)
    dispatch(updateSpeciesDownloaded(''))
    dispatch(updateSpeciesUpdatedAt())
  }



  return (
    <SafeAreaView style={styles.contentWrapper}>
      <FlashList
        data={specieList}
        renderItem={({ item }) => (
          <SpeciesSearchCard item={item} toggleFavSpecies={handleFavSpecies} handleCard={handleCardPress} />
        )}
        keyExtractor={item => item.guid}
        keyboardShouldPersistTaps="always"
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SpeciesSearchHeader
            backPress={handleBackPress}
            toggleSyncModal={setShowSpeciesSyncAlert}
            setSpicesList={setSpecieList}
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
  contentWrapper: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  toastLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT
  },
  speciesLabel: {
    fontFamily: FONT_FAMILY_ITALIC,
  }
})
