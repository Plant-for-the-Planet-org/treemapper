import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import Header from '../common/Header'
import i18next from 'src/locales/index'
import {Typography, Colors} from 'src/utils/constants'
import SearchIcon from 'assets/images/svg/SearchIcon.svg'
import {scaleSize} from 'src/utils/constants/mixins'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

const ManageSpeciesHeader = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const openSearchModal = () => {
    navigation.navigate('SpeciesSearch')
  }
  return (
    <View style={styles.container}>
      <Header label="Manage Species" />
      <View style={styles.wrapper}>
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
          <Text style={[styles.searchText, {color: Colors.GRAY_LIGHTEST}]}>
            {i18next.t('label.select_species_search_species')}
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          paddingLeft: 16,
          backgroundColor: '#E0E0E026',
        }}>
        <Text
          style={[
            styles.listTitle,
            {
              fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
            },
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
    backgroundColor: 'rgba(104, 176, 48, 0.10)',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flex: 1,
    paddingHorizontal: 25,
  },
  labelNote: {
    marginTop: 4,
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  speciesNote: {
    marginTop: 4,
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  searchNote: {
    marginTop: 4,
    textAlign: 'center',
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
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
    elevation: 1,
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
    paddingLeft: scaleSize(50),
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
  listTitle: {
    paddingTop: 25,
    paddingBottom: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PLANET_BLACK,
  },
})
