import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { useDispatch } from 'react-redux'
import { SpecieCard } from 'src/components/species/ManageSpeciesCard'
import CustomButton from 'src/components/common/CustomButton'
import { Colors, Typography } from 'src/utils/constants'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import {
  updateCurrentSpecies,
} from 'src/store/slice/sampleTreeSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InterventionData, PlantedSpecies } from 'src/types/interface/slice.interface'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useToast } from 'react-native-toast-notifications'
import { FONT_FAMILY_ITALIC, FONT_FAMILY_REGULAR } from 'src/utils/constants/typography'
import AskSampleTreeModal from 'src/components/common/AskSampleTreeModal'
import AlertModal from 'src/components/common/AlertModal'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import i18next from 'i18next'



const TotalTreesView = () => {

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TotalTrees'>>()
  const { updateInterventionLastScreen, removeInterventionPlantedSpecies, updateSampleTreeSpecies } = useInterventionManagement()
  const dispatch = useDispatch()
  const isSelectSpecies = route.params?.isSelectSpecies
  const interventionId = route.params?.interventionId ?? "";
  const isEditTrees = route.params?.isEditTrees;
  const singleTreeEdit = route.params?.treeId;

  const [showExistingTree, setShowExistingTree] = useState('')
  const toast = useToast()
  const [showSampleTreeModal, setShowSampleTreeModal] = useState(false)

  const goBack = () => {
    if (isEditTrees) {
      navigation.navigate('ManageSpecies', { manageSpecies: false, id: intervention.intervention_id, multiTreeEdit: true })
      return
    }
    navigation.goBack()
  }



  const intervention = useObject<InterventionData>(
    RealmSchema.Intervention, interventionId
  )
  const navigationToNext = async () => {
    const { has_sample_trees } = setUpIntervention(intervention.intervention_key)
    if (!isEditTrees) {
      const result = await updateInterventionLastScreen(intervention.form_id, 'TOTAL_TREES')
      if (!result) {
        errorHaptic()
        toast.show("Error occurred while updating data")
        return
      }
    }

    if (isEditTrees) {
      navigation.goBack()
      return
    }

    if (has_sample_trees && intervention.location.type !== 'Point') {
      setShowSampleTreeModal(true)
      return;
    }

    if (!has_sample_trees) {
      navigation.replace('LocalForm', { id: interventionId })
    } else if (has_sample_trees && intervention.location.type === 'Point') {
      navigation.replace('LocalForm', { id: interventionId })
    } else {
      navigation.navigate('ReviewTreeDetails', { detailsCompleted: false, id: intervention.form_id })
    }
  }






  const cardPress = async (item: PlantedSpecies) => {
    if (singleTreeEdit) {
      const specieData: IScientificSpecies = {
        guid: item.guid,
        scientificName: item.scientificName,
        isUserSpecies: false,
        aliases: item.aliases,
        specieId: ''
      }
      await updateSampleTreeSpecies(interventionId, singleTreeEdit, specieData)
      navigation.goBack()
      return
    }

    if (isSelectSpecies) {
      dispatch(updateCurrentSpecies(JSON.parse(JSON.stringify(item))))
      const newID = String(new Date().getTime())
      navigation.navigate('TakePicture', { id: newID, screen: 'SAMPLE_TREE' })
    }
  }

  const removeHandler = async (item: PlantedSpecies) => {
    if (isEditTrees && checkForExistingTrees(item.guid)) {
      return;
    }
    const result = await removeInterventionPlantedSpecies(interventionId, item, isEditTrees)
    if (!result) {
      toast.show("Error occurred while removing species")
      errorHaptic()
    } else {
      toast.show(<Text style={styles.toastLabel}><Text style={styles.speciesLabel}>"{item.scientificName}"</Text> {i18next.t("label.remove_from_list")}</Text>, { style: { backgroundColor: Colors.GRAY_LIGHT }, textStyle: { textAlign: 'center' } })
    }
  }



  const checkForExistingTrees = (id: string) => {
    if (intervention.planted_species.length === 0) {
      toast.show("At least 1 planted species is required")
      return true
    }
    const sampleTree = intervention.sample_trees.find(obj => obj.species_guid === id);
    if (sampleTree) {
      setShowExistingTree(sampleTree.tree_id)
      return true;
    }
    return false
  }

  const renderSpecieCard = (
    item: PlantedSpecies
  ) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={cardPress}
        actionName={'remove'}
        handleRemoveFavorite={removeHandler}
        isSelectSpecies={isSelectSpecies}
        allowRemove
      />
    )
  }

  const closeModal = () => {
    setShowSampleTreeModal(false)
  }

  const secondaryBtnHandler = () => {
    setShowSampleTreeModal(false)
    setTimeout(() => {
      navigation.navigate('LocalForm', { id: interventionId })
    }, 200);
  }


  const onPrimaryPress = () => {
    setShowSampleTreeModal(false)
    setTimeout(() => {
      navigation.navigate('ReviewTreeDetails', { detailsCompleted: false, id: intervention.form_id })
    }, 200);
  }

  const renderFooter = () => <View style={styles.footerWrapper} />

  const navToSampleTree = () => {
    const existingTreeID = showExistingTree
    setShowExistingTree('')
    navigation.navigate("ReviewTreeDetails", { detailsCompleted: false, interventionID: existingTreeID, synced: false, id: intervention.intervention_id, deleteTree: true })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t('label.total_trees')} note={`${i18next.t('label.list_all_species')}`} />
      <AskSampleTreeModal isVisible={showSampleTreeModal} toggleModal={closeModal} removeFavSpecie={onPrimaryPress} headerLabel={'Sample Tree Registration'} noteLabel={' Do you want to add sample trees ?'} primeLabel={'Add Sample Tree'} secondaryLabel={'Finish'} extra={undefined} secondaryHandler={secondaryBtnHandler} />
      <AlertModal
        visible={showExistingTree !== ''}
        heading={"Warning"}
        message={"Sample Trees exist with this species, please remove the planted species first."}
        showSecondaryButton={true}
        primaryBtnText={"Show Tree"}
        secondaryBtnText={"cancel"}
        onPressPrimaryBtn={navToSampleTree}
        onPressSecondaryBtn={() => {
          setShowExistingTree('')
        }}
      />
      <View style={styles.wrapper}>
        <FlatList
          data={intervention.planted_species}
          renderItem={({ item }) => renderSpecieCard(item)}
          keyExtractor={({ guid }) => guid}
          ListFooterComponent={renderFooter}
        />
        {!isSelectSpecies && (
          <View style={styles.btnContainer}>
            <CustomButton
              label="Add Species"
              containerStyle={styles.btnWrapper}
              pressHandler={goBack}
              wrapperStyle={styles.borderWrapper}
              labelStyle={styles.highlightLabel}
            />
            <CustomButton
              label={isEditTrees ? "Save" : "Continue"}
              containerStyle={styles.btnWrapper}
              pressHandler={navigationToNext}
              disable={intervention.planted_species.length === 0}
              grayOut={intervention.planted_species.length === 0}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default TotalTreesView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
    paddingTop: 20
  },
  noteWrapper: {
    width: '100%',
    height: scaleSize(80),
    backgroundColor: 'red',
  },
  textLabel: {
    fontSize: 16,
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_LIGHT,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
  },
  btnWrapper: {
    flex: 1,
    width: '90%',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  borderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY_DARK,
  },
  opaqueWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 10,
  },
  highlightLabel: {
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLabel: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
  footerWrapper: {
    height: scaleFont(70),
    width: '100%',
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
