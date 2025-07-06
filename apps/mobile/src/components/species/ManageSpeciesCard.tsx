import React from 'react'
import i18next from 'src/locales/index'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Typography, Colors } from 'src/utils/constants'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import RemoveSpeciesIcon from 'assets/images/svg/BinIcon.svg'
import { SCALE_30 } from 'src/utils/constants/spacing'
import { scaleSize } from 'src/utils/constants/mixins'
import { PlantedSpecies } from 'src/types/interface/slice.interface'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import * as ExpoImage from 'expo-image';

interface SpecieCardProps {
  item: PlantedSpecies | IScientificSpecies
  onPressSpecies: (item: PlantedSpecies | IScientificSpecies) => void
  actionName: string
  handleRemoveFavorite?: any
  isSelectSpecies: boolean
  allowRemove?: boolean
}

export const SpecieCard: React.FC<SpecieCardProps> = ({
  item,
  onPressSpecies,
  handleRemoveFavorite,
  actionName,
  isSelectSpecies,
  allowRemove
}) => {
  const handlePress = () => {
    onPressSpecies(item)
  }
  return (
    <View
      style={[
        styles.container,
        {
          padding: 18,
          paddingVertical: 6,
        },
      ]}>
      <View
        style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.mySpecies}
          onPress={handlePress}>
          <View style={styles.imageCon}>
            {item.image ? (
              <ExpoImage.Image
                cachePolicy='memory-disk'
                source={{
                  uri: item.image.includes('/') ? `${item.image}` : `${process.env.EXPO_PUBLIC_API_PROTOCOL}://cdn.plant-for-the-planet.org/media/cache/species/default/${item.image}`,
                }}
                style={styles.imageView}
              />
            ) : (
              <View
                style={{
                  backgroundColor: '#82828210',
                  borderRadius: 8,
                  width: scaleSize(75),
                  height: scaleSize(75),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <SingleTreeIcon width={SCALE_30} height={SCALE_30} />
              </View>
            )}
          </View>
          <View style={styles.flex1}>
            <Text style={styles.unknownText} ellipsizeMode="tail">
              {item.aliases
                ? item.aliases
                : item.scientificName}
            </Text>
            <Text style={styles.unknownTextVal}>
              {item.scientificName
                ? item.scientificName
                : i18next.t('label.select_species_unknown')}
            </Text>
          </View>
          {!isSelectSpecies && item.guid !== 'unknown' || allowRemove ? <TouchableOpacity onPress={() => handleRemoveFavorite(item)}>
            {actionName !== 'remove' ? (
              <PinkHeart />
            ) : (
              <View style={styles.biContainer}>
                <RemoveSpeciesIcon width={18} height={18} fill="tomato" />
              </View>
            )}
          </TouchableOpacity> : null}
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
    width: scaleSize(75),
    height: scaleSize(75),
    backgroundColor: Colors.TEXT_COLOR,
  },
  mySpecies: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageCon: {
    paddingRight: 18,
    paddingLeft: 8,
  },
  cardWrapper: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderColor: '#f2ebdd',
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
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
  biContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_RED + '1A',
    borderRadius: 8
  }
})
