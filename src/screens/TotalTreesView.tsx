import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { SpecieCard } from 'src/components/species/ManageSpeciesCard'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import CustomButton from 'src/components/common/CustomButton'
import { Colors, Typography } from 'src/utils/constants'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import {
  removeSpeciesFromFlow,
  updateCurrentSpecies,
} from 'src/store/slice/sampleTreeSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
const TotalTreesView = () => {
  const sampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TotalTrees'>>()
  const dispatch = useDispatch()
  const goBack = () => {
    navigation.goBack()
  }

  const navigationToNext = () => {
    navigation.replace('ReviewTreeDetails', { detailsCompleted: false })
  }

  const cardpress = (item: IScientificSpecies) => {
    if (route.params.isSelectSpecies) {
      dispatch(updateCurrentSpecies(item.guid))
      const newID = String(new Date().getTime())
      navigation.replace('TakePicture', { id: newID, screen: 'SAMPLE_TREE' })
      return
    }
  }

  const removeHandler = (item: IScientificSpecies) => {
    const filterdData = sampleTreeData.species.filter(
      el => el.info.guid !== item.guid,
    )
    dispatch(removeSpeciesFromFlow(filterdData))
  }

  const renderSpecieCard = (
    item: { info: IScientificSpecies; count: number } | any,
    index: number,
  ) => {
    return (
      <SpecieCard
        item={item.info}
        index={index}
        onPressSpecies={cardpress}
        actionName={'remove'}
        handleRemoveFavourite={removeHandler}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label="Total Trees" />
      <View style={styles.wrapper}>
        <FlatList
          data={sampleTreeData.species}
          renderItem={({ item, index }) => renderSpecieCard(item, index)}
          ListHeaderComponent={() => (
            <Text style={styles.textLable}>
              List all trees planted at the site
            </Text>
          )}
          ListFooterComponent={() => <View style={styles.footerWrapper} />}
        />
        {!route.params.isSelectSpecies && (
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
    backgroundColor: Colors.BACKDROP_COLOR
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
