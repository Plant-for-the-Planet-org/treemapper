import React from 'react'
import i18next from 'src/locales/index'
import {StyleSheet, Text, TouchableOpacity, View, Image} from 'react-native'
import {Ionicons} from '@expo/vector-icons'
import {Typography, Colors} from 'src/utils/constants'
import {ScientificSpeciesType} from 'src/utils/constants/scientificSpeciesTypes'
import SingleTreeIcon from 'assets/images/svg/SingleTreeIcon.svg'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import {IScientificSpecies} from 'src/types/interface/app.interface'

interface SpecieCardProps {
  item: IScientificSpecies
  index: number
  registrationType?: any
  onPressSpecies: (item: IScientificSpecies) => void
  addSpecieToInventory?: (specie: ScientificSpeciesType) => void
  editOnlySpecieName?: any
  onPressBack?: any
  isSampleTree: any
  navigateToSpecieInfo?: (specie: ScientificSpeciesType) => void
  screen?: string
  isSampleTreeSpecies?: boolean
  handleRemoveFavourite?: any
}

export const SpecieCard: React.FC<SpecieCardProps> = ({
  item,
  index,
  registrationType,
  onPressSpecies,
  addSpecieToInventory,
  editOnlySpecieName,
  onPressBack,
  isSampleTree,
  navigateToSpecieInfo,
  screen,
  isSampleTreeSpecies,
  handleRemoveFavourite,
}) => {
  const handlePress = () => {
    onPressSpecies(item)
    console.log(
      'Will remove',
      registrationType,
      onPressSpecies,
      addSpecieToInventory,
      editOnlySpecieName,
      onPressBack,
      isSampleTree,
      isSampleTreeSpecies,
    )
  }
  return (
    <View
      style={[
        styles.container,
        {
          padding: 18,
          backgroundColor: 'rgba(224, 224, 224, 0.15)',
          paddingVertical: 6,
        },
      ]}>
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          elevation: 5,
        }}>
        <TouchableOpacity
          key={index}
          style={styles.mySpecies}
          onPress={handlePress}>
          <View style={styles.imageCon}>
            {item.image ? (
              <Image
                source={{
                  uri: `${item.image}`,
                }}
                style={styles.imageView}
              />
            ) : (
              <View
                style={{
                  backgroundColor: '#82828210',
                  borderRadius: 8,
                  width: 74,
                  height: 74,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <SingleTreeIcon width={30} height={30} />
              </View>
            )}
          </View>
          <View style={styles.flex1}>
            <Text style={styles.unknownText} ellipsizeMode="tail">
              {item.guid
                ? item.scientific_name
                : i18next.t('label.select_species_unknown')}
            </Text>
            <Text style={styles.unknownTextVal}>
              {item.guid
                ? item.scientific_name
                : i18next.t('label.select_species_unknown')}
            </Text>
          </View>
          {item.guid !== 'unknown' &&
          screen === 'SelectSpecies' &&
          navigateToSpecieInfo ? (
            <TouchableOpacity style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} />
            </TouchableOpacity>
          ) : (
            []
          )}
          <TouchableOpacity onPress={() => handleRemoveFavourite(item)}>
            <PinkHeart />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  flex1: {
    flex: 1,
  },
  imageView: {
    borderRadius: 8,
    resizeMode: 'cover',
    width: 80,
    height: 80,
    backgroundColor: Colors.TEXT_COLOR,
  },
  mySpecies: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    justifyContent: 'space-between',
  },
  imageCon: {
    paddingRight: 18,
    paddingLeft: 8,
  },
  image: {
    height: 74,
    width: 74,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  unknownText: {
    paddingBottom: 6,
    color: Colors.PLANET_BLACK,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    paddingRight: 10,
  },
  unknownTextVal: {
    color: Colors.PLANET_BLACK,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_ITALIC_SEMI_BOLD,
  },
  infoIcon: {
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
