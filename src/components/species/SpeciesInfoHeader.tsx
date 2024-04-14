import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import GreyHeart from 'assets/images/svg/GreyHeart.svg'
import {Typography, Colors} from 'src/utils/constants'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { scaleSize } from 'src/utils/constants/mixins'

interface Props {
  item: IScientificSpecies
}

const SpeciesInfoHeader = (props: Props) => {
  const {scientific_name, is_user_species, guid} = props.item
  const {updateUserFavSpecies} = useManageScientificSpecies()
  const handleUpdate = () => {
    updateUserFavSpecies(guid, !is_user_species)
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
        }}>
        <Text style={styles.specieName}>{scientific_name}</Text>
        <TouchableOpacity onPress={handleUpdate}>
          {is_user_species ? <PinkHeart /> : <GreyHeart />}
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SpeciesInfoHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(60),
  },
  specieName: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_ITALIC_BOLD,
    color: Colors.BLACK,
  },
})
