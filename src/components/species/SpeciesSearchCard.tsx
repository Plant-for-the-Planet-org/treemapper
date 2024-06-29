import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import GreyHeart from 'assets/images/svg/GreyHeart.svg'
import { Typography, Colors } from 'src/utils/constants'
import { IScientificSpecies } from 'src/types/interface/app.interface'

interface Props {
  item: IScientificSpecies | any
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
  handleCard: (item: IScientificSpecies, status: boolean) => void
  hideFav?: boolean
}

const SpeciesSearchCard = (props: Props) => {
  const { item, toogleFavSpecies, handleCard, hideFav } = props
  const handleIconPress = () => {
    toogleFavSpecies(item, !item.isUserSpecies)
  }
  const handleCardPress = () => {
    handleCard(item, !item.isUserSpecies)
  }
  return (
    <TouchableOpacity style={styles.container} onPress={handleCardPress}>
      <View style={styles.wrapper}>
        <Text style={styles.scientificName}>{item.scientificName}</Text>
        <View style={styles.divider} />
        {!hideFav && <TouchableOpacity style={styles.iconWrapper} onPress={handleIconPress}>
          {item.isUserSpecies ? <PinkHeart /> : <GreyHeart />}
        </TouchableOpacity>}
      </View>
    </TouchableOpacity>
  )
}

export default SpeciesSearchCard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.GRAY_LIGHT
  },
  scientificName: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    color: Colors.PLANET_BLACK,
  },
  divider: {
    flex: 1,
  },
  iconWrapper: {
  },
})
