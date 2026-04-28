import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import GreyHeart from 'assets/images/svg/GreyHeart.svg'
import { Typography, Colors } from 'src/utils/constants'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { scaleSize } from 'src/utils/constants/mixins'
import { useToast } from 'react-native-toast-notifications'
import { FONT_FAMILY_REGULAR, FONT_FAMILY_ITALIC } from 'src/utils/constants/typography'

interface Props {
  item: IScientificSpecies
}

const SpeciesInfoHeader = (props: Props) => {
  const { scientificName, isUserSpecies, guid } = props.item
  const { updateUserFavSpecies } = useManageScientificSpecies()
  const toast = useToast()
  const handleUpdate = () => {
    toast.hideAll()
    if (!isUserSpecies) {
      toast.show(<Text style={styles.toastLabel}><Text style={styles.speciesLabel}>"{scientificName}"</Text> added to favorites</Text>, { style: { backgroundColor: Colors.GRAY_LIGHT }, textStyle: { textAlign: 'center' } })
    } else {
      toast.show(<Text style={styles.toastLabel}><Text style={styles.speciesLabel}>"{scientificName}"</Text> removed from favorites</Text>, { style: { backgroundColor: Colors.GRAY_LIGHT }, textStyle: { textAlign: 'center' } })
    }
    updateUserFavSpecies(guid, !isUserSpecies)
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
        <Text style={styles.specieName}>{scientificName}</Text>
        <TouchableOpacity onPress={handleUpdate}>
          {isUserSpecies ? <PinkHeart /> : <GreyHeart />}
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
  toastLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT
  },
  speciesLabel: {
    fontFamily: FONT_FAMILY_ITALIC,
  }
})
