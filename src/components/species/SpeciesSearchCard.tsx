import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import GreyHeart from 'assets/images/svg/GreyHeart.svg'
import {Typography, Colors} from 'src/utils/constants'
import {IScientificSpecies} from 'src/types/interface/app.interface'

interface Props {
  item: IScientificSpecies
  toogleFavSpecies: (item: IScientificSpecies, status: boolean) => void
}

const SpeciesSearchCard = (props: Props) => {
  const {item, toogleFavSpecies} = props
  const handleIconPress = () => {
    toogleFavSpecies(item, !item.is_user_species)
  }
  return (
    <View style={styles.container}>
      <Text style={styles.scientificName}>{item.scientific_name}</Text>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.iconWrapper} onPress={handleIconPress}>
        {item.is_user_species ? <PinkHeart /> : <GreyHeart />}
      </TouchableOpacity>
    </View>
  )
}

export default SpeciesSearchCard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scientificName: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    color: Colors.PLANET_BLACK,
    marginLeft: 20,
  },
  divider: {
    flex: 1,
  },
  iconWrapper: {
    marginRight: 20,
  },
})
