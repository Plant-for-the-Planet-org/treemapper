import React from 'react'
import i18next from 'src/locales/index'
import {StyleSheet, Text, TouchableOpacity, View, Image} from 'react-native'
import {Typography, Colors} from 'src/utils/constants'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import RemoveSpeciesIcon from 'assets/images/svg/RemoveSpeciesIcon.svg'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import {SCALE_30} from 'src/utils/constants/spacing'
import {scaleSize} from 'src/utils/constants/mixins'

interface SpecieCardProps {
  item: IScientificSpecies
  index: number
  onPressSpecies: (item: IScientificSpecies) => void
  isSampleTreeSpecies?: boolean
  actionName: string
  handleRemoveFavourite?: any
}

export const SpecieCard: React.FC<SpecieCardProps> = ({
  item,
  index,
  onPressSpecies,
  handleRemoveFavourite,
  actionName
}) => {
  const handlePress = () => {
    onPressSpecies(item)
    console.log(
      'Will remove',
      onPressSpecies,
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
          borderRadius: 12,
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
          <TouchableOpacity onPress={() => handleRemoveFavourite(item)}>
            {actionName !== 'remove' ? (
              <PinkHeart />
            ) : (
              <RemoveSpeciesIcon />
            )}
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
