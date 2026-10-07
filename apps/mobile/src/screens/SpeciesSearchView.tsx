import { StyleSheet, Text, } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
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
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import useManageSpeciesTour, { useSpeciesTourScreen } from 'src/hooks/useManageSpeciesTour'
import { useTourAction } from 'src/hooks/useTourController'
import { SPECIES_TOUR_STEPS } from 'src/utils/tour/manageSpeciesTour'

const SpeciesSearchView = () => {
  const [specieList, setSpecieList] = useState<IScientificSpecies[]>([])
  const { updateUserFavSpecies } = useManageScientificSpecies()
  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SpeciesSearch'>>()
  const isManageSpecies = route.params?.manageSpecies;
  const dispatch = useDispatch()
  const toast = useToast()
  const posthog = usePostHog()
  const { advanceIfOn } = useManageSpeciesTour()
  // Only reached from Manage Species in the drawer's manage mode; the capture
  // flow uses this screen to pick a species for an intervention instead.
  useSpeciesTourScreen('speciesSearch', Boolean(isManageSpecies))

  const handleBackPress = () => {
    navigation.goBack()
  }

  // A near-miss on the backdrop of the "go back" step should still go back:
  // the step asks for one decision and the arrow is a small target.
  useTourAction(SPECIES_TOUR_STEPS.BACK, handleBackPress)

  // The "type a name" step is satisfied by results appearing, not by a button.
  // Asking the user to reach past the keyboard for Next would be worse.
  useEffect(() => {
    if (specieList.length > 0) {
      advanceIfOn(SPECIES_TOUR_STEPS.TYPE)
    }
  }, [specieList.length, advanceIfOn])


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
    // Track favourite changes so we can see which species are most saved
    // and whether field workers build personal lists or rely on the default set.
    captureAnalyticsEvent(
      posthog,
      status ? AnalyticsEvents.SPECIES_FAVORITED : AnalyticsEvents.SPECIES_UNFAVORITED,
      { species_guid: item.guid, scientific_name: item.scientificName },
    )
    toast.hideAll();
    if (status) {
      // Favouriting is the act the walkthrough's heart step is waiting for.
      // Unfavouriting is not: that would move the tour on for undoing the
      // thing it just taught.
      advanceIfOn(SPECIES_TOUR_STEPS.FAVOURITE)
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
      // Selecting a species for an intervention — track guid and name so we
      // can see which species are most recorded without logging any field data.
      captureAnalyticsEvent(posthog, AnalyticsEvents.SPECIES_SELECTED, {
        species_guid: item.guid,
        scientific_name: item.scientificName,
      })
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
        renderItem={({ item, index }) => (
          <SpeciesSearchCard item={item} toggleFavSpecies={handleFavSpecies} handleCard={handleCardPress} isTourTarget={index === 0} />
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
        ListEmptyComponent={<EmptySpeciesSearchList onPressSync={() => setShowSpeciesSyncAlert(true)} />}
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
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT
  },
  speciesLabel: {
    fontFamily: FONT_FAMILY_ITALIC,
  }
})
