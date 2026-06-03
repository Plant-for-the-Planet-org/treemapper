import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Icon from '@expo/vector-icons/FontAwesome5'
import i18next from 'src/locales/index'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { RootState } from 'src/store'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  onPressSync?: () => void
}

const EmptySpeciesSearchList = ({ onPressSync }: Props) => {
  const [title, setTitle] = useState(i18next.t('label.select_species_search_atleast_3_characters'))
  const [needsSync, setNeedsSync] = useState(false)
  const realm = useRealm()

  const speciesDownloading = useSelector((state: RootState) => state.tempState.speciesDownloading)
  const speciesWriting = useSelector((state: RootState) => state.tempState.speciesWriting)
  const isSyncing = speciesDownloading || speciesWriting


  useEffect(() => {
    checkForOfflineSpeies()
  }, [])

  const checkForOfflineSpeies = () => {
    const hasMoreThan150Species =
      realm.objects<IScientificSpecies>(RealmSchema.ScientificSpecies).length > 150;
    if (!hasMoreThan150Species) {
      setTitle("Species need sync. Please refresh the species to download offline species.")
      setNeedsSync(true)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.labelStyle}>
        {title}
      </Text>
      {needsSync && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={onPressSync}
          disabled={isSyncing || !onPressSync}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon name="sync-alt" size={16} color="#FFF" />
          )}
          <Text style={styles.syncButtonLabel}>
            {speciesWriting ? 'Syncing' : speciesDownloading ? 'Downloading' : 'Sync species'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default EmptySpeciesSearchList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  labelStyle: {
    paddingHorizontal: 20,
    textAlign: 'center'
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 40,
    marginTop: 16,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonLabel: {
    color: '#FFF',
    marginLeft: 8,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_14,
  },
})
