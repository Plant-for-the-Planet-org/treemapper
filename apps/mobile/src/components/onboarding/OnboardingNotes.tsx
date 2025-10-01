import {Text, StyleSheet} from 'react-native'
import React from 'react'
import {Typography,Colors} from 'src/utils/constants'
import i18next from 'src/locales/index'
import {SPECIES_SYNC_STATE} from 'src/types/enum/app.enum'

interface Props {
  updatingSpeciesState: SPECIES_SYNC_STATE
}

const OnboardingNotes = (props: Props) => {
  const {updatingSpeciesState} = props
  switch (updatingSpeciesState) {
    case SPECIES_SYNC_STATE.INITIAL:
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.species_data_status')}
        </Text>
      )
    case SPECIES_SYNC_STATE.DOWNLOADING:
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.downloading_archive')}
        </Text>
      )
    case SPECIES_SYNC_STATE.UNZIPPING_FILE:
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.unzipping_archive')}
        </Text>
      )
    case SPECIES_SYNC_STATE.READING_FILE:
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.fetch_and_add_species_to_database')}
        </Text>
      )
    default:
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.species_data_loaded')}
        </Text>
      )
  }
}

export default OnboardingNotes

const styles = StyleSheet.create({
  descriptionText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginTop: 10,
  },
})
