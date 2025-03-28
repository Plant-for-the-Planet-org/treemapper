import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import i18next from 'src/locales/index'
import { Typography, Colors } from 'src/utils/constants'
import SearchIcon from 'assets/images/svg/SearchIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'

import { SCALE_24, SCALE_30 } from 'src/utils/constants/spacing'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import SpeciesSyncError from './SpeciesSyncError'

interface Props {
  openSearchModal: () => void
}

const ManageSpeciesHeader = (props: Props) => {
  const { openSearchModal } = props
  const isSpeciesDownloaded = useSelector((state: RootState) => state.appState.speciesSync)

  return (
    <View style={styles.container}>
      {!isSpeciesDownloaded ? <SpeciesSyncError /> : <View style={styles.wrapper}>
        <Text style={styles.labelNote}>
          {i18next.t('label.explore_and_manage_species')}
        </Text>
        <Text style={styles.searchNote}>
          {i18next.t('label.search')}
          <Text style={styles.speciesNote}>
            {i18next.t('label.number_species')}
          </Text>
          {i18next.t('label.add_species_in_fav')}
        </Text>
        <TouchableOpacity style={styles.searchBar} onPress={openSearchModal}>
          <SearchIcon style={styles.searchIcon} width={20} height={20} />
          <Text style={[styles.searchText, { color: Colors.GRAY_LIGHTEST }]}>
            {i18next.t('label.select_species_search_species')}
          </Text>
        </TouchableOpacity>
      </View>}
      <View
        style={{
          paddingLeft: 16,
        }}>
        <Text
          style={[
            styles.listTitle,
          ]}>
          {i18next.t('label.select_species_my_species')}
        </Text>
      </View>
    </View>
  )
}

export default ManageSpeciesHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  wrapper: {
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    padding: SCALE_24,
    borderBottomLeftRadius: SCALE_30,
    borderBottomRightRadius: SCALE_30,
    flex: 1,
  },
  labelNote: {
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    letterSpacing: 0.5,
  },
  speciesNote: {
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    letterSpacing: 0.5,
  },
  searchNote: {
    marginTop: 4,
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSize(45),
    borderRadius: 100,
    marginTop: '10%',
    backgroundColor: Colors.WHITE,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.09,
    shadowRadius: 3.3,
    elevation: 1,
  },
  searchIcon: {
    paddingLeft: scaleSize(50),
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    fontSize: Typography.FONT_SIZE_14,
    paddingLeft: '1%',
    flex: 1,
    color: Colors.PLANET_BLACK,
  },
  listTitle: {
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(20),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PLANET_BLACK,
  },
})
