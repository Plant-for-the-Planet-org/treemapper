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
import FallbackImage from '../common/FallbackImage'
import { legacyCdnUrl, v3CdnUrl } from 'src/utils/cdnUrl'
import { TourTarget } from '@wrack/react-native-tour-guide'
import { SPECIES_TOUR_TARGETS } from 'src/utils/tour/manageSpeciesTour'

interface SpecieCardProps {
  item: PlantedSpecies | IScientificSpecies
  onPressSpecies: (item: PlantedSpecies | IScientificSpecies) => void
  actionName: string
  handleRemoveFavorite?: any
  isSelectSpecies: boolean
  allowRemove?: boolean,
  onlyProjectSpecies: boolean
  /**
   * Marks this card as the one the Manage Species walkthrough points at. Only
   * the first card in the list sets it: tour target ids are unique, and a list
   * of them would have the last one registered win at random.
   */
  isTourTarget?: boolean
}

export const SpecieCard: React.FC<SpecieCardProps> = ({
  item,
  onPressSpecies,
  handleRemoveFavorite,
  actionName,
  isSelectSpecies,
  allowRemove,
  onlyProjectSpecies,
  isTourTarget
}) => {

  // a filename means the image lives on the CDN, a path means it is local
  const isCdnImage = !!item.image && !item.image.includes('/')
  const imageUri = isCdnImage ? (v3CdnUrl('species', item.image) ?? '') : item.image
  // species images uploaded before the v3 migration are only on the old CDN
  const imageFallbackUri = isCdnImage ? legacyCdnUrl('species', item.image) : null

  const handlePress = () => {
    onPressSpecies(item)
  }

  const favouriteButton = onlyProjectSpecies ? null : !isSelectSpecies && item.guid !== 'unknown' || allowRemove ? (
    <TouchableOpacity onPress={() => handleRemoveFavorite(item)}>
      {actionName !== 'remove' ? (
        <PinkHeart />
      ) : (
        <View style={styles.biContainer}>
          <RemoveSpeciesIcon width={18} height={18} fill="tomato" />
        </View>
      )}
    </TouchableOpacity>
  ) : null

  const body = (
    <TouchableOpacity
      style={styles.mySpecies}
      onPress={handlePress}>
      <View style={styles.imageCon}>
        {item.image ? (
          <FallbackImage
            uri={imageUri}
            fallbackUri={imageFallbackUri}
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
      {isTourTarget && favouriteButton ? (
        <TourTarget id={SPECIES_TOUR_TARGETS.CARD_FAVOURITE}>{favouriteButton}</TourTarget>
      ) : (
        favouriteButton
      )}
    </TouchableOpacity>
  )

  return (
    <View
      style={[
        styles.container,
        {
          padding: 18,
          paddingVertical: 6,
        },
      ]}>
      {isTourTarget ? (
        <TourTarget id={SPECIES_TOUR_TARGETS.CARD} style={styles.cardWrapper}>{body}</TourTarget>
      ) : (
        <View style={styles.cardWrapper}>{body}</View>
      )}
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
