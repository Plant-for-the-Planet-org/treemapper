import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import EmptyManageSpecies from 'assets/images/svg/EmptyManageSpecies.svg'
import i18next from 'src/locales/index'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import { Typography } from 'src/utils/constants'

const EmptyManageSpeciesList = () => {
  return (
    <View style={styles.listEmptyComponent}>
      <EmptyManageSpecies />
      <Text style={styles.headerText}>
        {i18next.t('label.select_species_looks_empty_here')}
      </Text>
      <Text style={styles.subHeadingText}>
        {i18next.t('label.select_species_add_species_desscription')}
      </Text>
    </View>
  )
}

export default EmptyManageSpeciesList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    paddingTop: 10,
    paddingBottom: 15,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    paddingLeft: 25,
    paddingRight: 25,
    textAlign: 'center',
  },
  listEmptyComponent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
})
