import {Dimensions, StyleSheet, Text, TextInput, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import i18next from 'src/locales/index'
import {scaleSize} from 'src/utils/constants/mixins'
import {Typography, Colors} from 'src/utils/constants'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'

interface Props {
  item: IScientificSpecies
}

const SpecieInfoDetailSection = (props: Props) => {
  const [localName, setLocalName] = useState('')
  const [details, setDetails] = useState('')

  const {description, aliases} = props.item
  const {updateSpeciesDetails} = useManageScientificSpecies()

  useEffect(() => {
    setLocalName(aliases)
    setDetails(description)
  }, [])

  const updateAlias = (text: string) => {
    setLocalName(text)
    updateSpeciesDetails({...props.item, aliases: text})
  }

  const updateDescription = (text: string) => {
    setDetails(text)
    updateSpeciesDetails({...props.item, description: text})
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.infoCardHeading]}>
        {i18next.t('label.species_name')}
      </Text>
      <TextInput
        value={localName}
        onChangeText={updateAlias}
        style={styles.input}
        returnKeyType='done'
      />
      <Text style={styles.infoCardHeading}>
        {i18next.t('label.species_description')}
      </Text>
      <TextInput
        multiline
        value={details}
        onChangeText={updateDescription}
        style={[styles.textArea]}
        returnKeyType='done'
      />
    </View>
  )
}

export default SpecieInfoDetailSection

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cont: {
    flex: 1,
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
  emptyImageContainer: {
    marginTop: 16,
    height: 180,
    backgroundColor: '#EBF3E6',
    borderRadius: 8,
    borderColor: '#86C059',
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImage: {
    marginTop: 12,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
  },
  infoCardHeading: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    paddingTop: 25,
    color: Colors.TEXT_LIGHT,
  },
  infoCardText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    paddingTop: 5,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 50,
    marginTop: 25,
    // height: Dimensions.get('window').height * 0.4,
  },
  imageView: {
    borderRadius: 8,
    resizeMode: 'cover',
    width: '100%',
    height: Dimensions.get('window').height * 0.4,
    backgroundColor: Colors.TEXT_COLOR,
  },
  imageControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  iconContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specieName: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_ITALIC_BOLD,
    color: Colors.BLACK,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.GRAY_DARK,
    height: scaleSize(50),
    padding: scaleSize(10),
    color: Colors.DARK_TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.GRAY_DARK,
    height: scaleSize(100),
    padding: scaleSize(10),
    color: Colors.DARK_TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginTop: 8,
  },
})
