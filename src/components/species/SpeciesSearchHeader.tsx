import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import {Ionicons} from '@expo/vector-icons'
import i18next from 'src/locales/index'
import {Typography, Colors} from 'src/utils/constants'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import SyncIcon from 'assets/images/svg/SyncIcon.svg'
import {useRealm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {IScientificSpecies} from 'src/types/interface/app.interface'

interface Props {
  backPress: () => void
  toogleSyncModal: () => void
  setSpciesList: (d: IScientificSpecies[]) => void
}

const SpeciesSearchHeader = (props: Props) => {
  const [searchText, setSearchText] = useState('')
  const realm = useRealm()
  const {backPress, toogleSyncModal, setSpciesList} = props

  const handleSearchChange = (text: string) => {
    setSearchText(text)
  }

  useEffect(() => {
    if (searchText.length > 2) {
      querySearchResult()
    }
  }, [searchText])

  const querySearchResult = () => {
    const specieArray: IScientificSpecies[] = Array.from(
      realm
        .objects<IScientificSpecies>(RealmSchema.ScientificSpecies)
        .filtered('scientific_name CONTAINS[c] $0', searchText),
    )
    setSpciesList(specieArray)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backArrowCon} onPress={backPress}>
        <BackIcon />
      </TouchableOpacity>
      <View style={styles.searchBarMain}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Ionicons
            name="search-outline"
            size={20}
            style={styles.searchIconMain}
          />
          <TextInput
            style={styles.searchText}
            placeholder={i18next.t('label.select_species_search_species')}
            onChangeText={handleSearchChange}
            value={searchText}
            returnKeyType={'search'}
            autoCorrect={false}
            placeholderTextColor={Colors.GRAY_LIGHTEST}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('')
              }}>
              <Ionicons name="close" size={20} style={styles.closeIcon} />
            </TouchableOpacity>
          ) : (
            []
          )}
        </View>
      </View>
      <TouchableOpacity onPress={toogleSyncModal}>
        <SyncIcon width={20} height={20} />
      </TouchableOpacity>
    </View>
  )
}

export default SpeciesSearchHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom:10
  },
  backArrowCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 100,
    marginTop: 24,
    backgroundColor: Colors.WHITE,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.09,
    shadowRadius: 3.3,
    elevation: 3,
  },
  searchBarMain: {
    width: '80%',
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  searchIcon: {
    color: 'rgb(104, 176, 48)',
    paddingLeft: 19,
  },
  searchIconMain: {
    color: Colors.TEXT_COLOR,
    paddingLeft: 19,
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    fontSize: Typography.FONT_SIZE_14,
    paddingLeft: 12,
    flex: 1,
    color: Colors.PLANET_BLACK,
  },
  specieListItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notPresentText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    paddingVertical: 10,
    alignSelf: 'center',
    color: Colors.PLANET_BLACK,
  },
  closeIcon: {
    justifyContent: 'flex-end',
    color: Colors.TEXT_COLOR,
    paddingRight: 20,
  },
})
