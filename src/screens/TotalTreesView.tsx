import { FlatList, StyleSheet, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { useDispatch } from 'react-redux'
import { SpecieCard } from 'src/components/species/ManageSpeciesCard'
import { IScientificSpecies } from 'src/types/interface/app.interface'
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
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { errotHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useToast } from 'react-native-toast-notifications'



const TotalTreesView = () => {

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TotalTrees'>>()
  const { updateInterventionLastScreen, removeInterventionPlantedSpecies } = useInterventionManagement()
  const dispatch = useDispatch()
  const realm = useRealm()
  const isSelectSpecies = route.params && route.params.isSelectSpecies ? true : false
  const interventionId = route.params && route.params.interventionId ? route.params.interventionId : ''
  const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionId);
  const toast = useToast()
  const goBack = () => {
    navigation.goBack()
  }



  const navigationToNext = async () => {
    const { has_sample_trees } = setUpIntervention(intervention.intervention_key)
    const result = await updateInterventionLastScreen(intervention.form_id, 'TOTAL_TREES')
    if (!result) {
      errotHaptic()
      toast.show("Error occured while updating data")
      return
    }
    navigation.navigate('ReviewTreeDetails', { detailsCompleted: !has_sample_trees, id: intervention.form_id })
  }



  const cardpress = (item: PlantedSpecies) => {
    if (isSelectSpecies) {
      dispatch(updateCurrentSpecies(JSON.parse(JSON.stringify(item))))
      const newID = String(new Date().getTime())
      navigation.navigate('TakePicture', { id: newID, screen: 'SAMPLE_TREE' })
      return
    }
  }

  const removeHandler = async (item: PlantedSpecies) => {
    const result = await removeInterventionPlantedSpecies(interventionId, item)
    if (!result) {
      toast.show("Error occured while removing speices")
      errotHaptic()
    } else {
      toast.show(`${item.scientificName} removed`)
    }
  }

  const renderSpecieCard = (
    item: IScientificSpecies | any,
  ) => {
    return (
      <SpecieCard
        item={item}
        onPressSpecies={cardpress}
        actionName={'remove'}
        handleRemoveFavourite={removeHandler}
        isSelectSpecies={isSelectSpecies}
      />
    )
  }




  return (
    <SafeAreaView style={styles.container}>
      <Header label="Total Trees" note='List all species planted at the location' />
      <View style={styles.wrapper}>
        <FlatList
          data={intervention.planted_species}
          renderItem={({ item }) => renderSpecieCard(item)}
          keyExtractor={({ guid }) => guid}
          ListFooterComponent={() => <View style={styles.footerWrapper} />}
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
              label="Continue"
              containerStyle={styles.btnWrapper}
              pressHandler={navigationToNext}
              disable={intervention.planted_species.length === 0}
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
  textLable: {
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
    bottom: 0,
  },
  btnWrapper: {
    flex: 1,
    width: '90%',
  },
  imageContainer: {
    widht: '100%',
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
  normalLable: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
  footerWrapper: {
    height: scaleFont(70),
    width: '100%',
  },
})
