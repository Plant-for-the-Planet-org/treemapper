import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import Realm from 'realm';
import { bugsnag } from '../../utils';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View, Keyboard, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchSpecies from './SearchSpecies';
import MySpecies from './MySpecies';
import { Colors, Typography } from '_styles';
import { addMultipleTreesSpecie, setSpecieId } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';
import { searchSpeciesFromLocal } from '../../repositories/species';
import { Header } from '../Common';
import {
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  Species,
  User,
  ScientificSpecies,
  ActivityLogs,
} from '../../repositories/schema';
import { LogTypes } from '../../utils/constants';
import dbLog from '../../repositories/logs';
import { TouchableOpacity } from 'react-native-gesture-handler';

const ManageSpecies = ({
  onPressSpeciesSingle,
  onPressBack,
  onPressSpeciesMultiple,
  registrationType,
  onSaveMultipleSpecies,
}) => {
  const navigation = useNavigation();
  const [specieList, setSpecieList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [showSearchSpecies, setShowSearchSpecies] = useState(false);
  const { state: speciesState, dispatch: speciesDispatch } = useContext(SpeciesContext);

  useEffect(() => {
    // fetches all the species already added by user when component mount
    getUserSpecies();

    // hides the keyboard when component unmount
    return () => Keyboard.dismiss();
  }, []);

  useEffect(() => {
    if (searchText) {
      setShowSearchSpecies(true);
    } else {
      setShowSearchSpecies(false);
    }
  }, [searchText]);

  // used to navigate to main screen
  const onPressHome = () => {
    navigation.navigate('MainScreen');
  };

  const getUserSpecies = () => {
    return new Promise((resolve, reject) => {
      Realm.open({
        schema: [
          Inventory,
          Species,
          Polygons,
          Coordinates,
          OfflineMaps,
          User,
          AddSpecies,
          ScientificSpecies,
          ActivityLogs,
        ],
      })
        .then((realm) => {
          let species = realm.objects('ScientificSpecies');
          let userSpecies = species.filtered(`isUserSpecies = true`);
          userSpecies = userSpecies.sorted('scientific_name');
          setSpecieList(userSpecies);
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Searching with Local Scientific species',
          });
          resolve(userSpecies);
        })
        .catch((err) => {
          dbLog.error({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Error while searching with Local Scientific species',
            logStack: JSON.stringify(err),
          });
          reject(err);
          console.error(
            `Error at /repositories/species/searchSpeciesFromLocal, ${JSON.stringify(err)}`,
          );
          bugsnag.notify(err);
        });
    });
  };

  const toggleUserSpecies = (guid) => {
    return new Promise((resolve, reject) => {
      Realm.open({
        schema: [
          Inventory,
          Species,
          Polygons,
          Coordinates,
          OfflineMaps,
          User,
          AddSpecies,
          ScientificSpecies,
          ActivityLogs,
        ],
      }).then((realm) => {
        realm.write(() => {
          let specieToToggle = realm.objectForPrimaryKey('ScientificSpecies', guid);
          specieToToggle.isUserSpecies = !specieToToggle.isUserSpecies;

          // copies the current search list in variable currentSearchList
          const currentSearchList = [...searchList];

          // sets the changes done by realm into the state
          setSearchList(currentSearchList);
          console.log(
            `Specie with guid ${guid} is toggled ${specieToToggle.isUserSpecies ? 'on' : 'off'}`,
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Specie with guid ${guid} is toggled ${
              specieToToggle.isUserSpecies ? 'on' : 'off'
            }`,
          });
        });
        resolve();
      });
    });
  };

  const handleSpeciesSearch = (text) => {
    setSearchText(text);
    if (text) {
      setSearchBarFocused(true);
      setShowSearchSpecies(true);
      searchSpeciesFromLocal(text).then((data) => {
        setSearchList([...data]);
      });
    } else {
      setSearchBarFocused(false);
      setShowSearchSpecies(false);
      setSearchList([]);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        closeIcon
        onBackPress={onPressBack ? onPressBack : onPressHome}
        headingText={registrationType ? i18next.t('label.select_species_header') : 'Tree Species'}
        // rightText={i18next.t('label.select_species_done')}
        // onPressFunction={addSelectedSpecies}
      />
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchText}
          placeholder={i18next.t('label.select_species_search_species')}
          onChangeText={handleSpeciesSearch}
          value={searchText}
          onFocus={() => setSearchBarFocused(true)}
        />
        {showSearchSpecies ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="md-close" size={20} style={styles.closeIcon} />
          </TouchableOpacity>
        ) : (
          []
        )}
      </View>
      {showSearchSpecies ? (
        searchList && searchList.length > 0 ? (
          <SearchSpecies searchList={searchList} toggleUserSpecies={toggleUserSpecies} />
        ) : (
          <Text style={styles.notPresentText}>The '{searchText}' specie is not present</Text>
        )
      ) : (
        <MySpecies
          onSaveMultipleSpecies={onSaveMultipleSpecies}
          registrationType={registrationType}
          speciesState={speciesState}
          onPressSpeciesSingle={onPressSpeciesSingle}
          onPressSpeciesMultiple={onPressSpeciesMultiple}
          specieList={specieList}
        />
      )}
    </View>
  );
};

export default ManageSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
    backgroundColor: Colors.WHITE,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    borderRadius: 5,
    marginTop: 24,
    backgroundColor: Colors.WHITE,
    borderColor: '#00000024',
    shadowColor: '#00000024',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.3,
    elevation: 6,
  },
  searchIcon: {
    color: Colors.PRIMARY,
    paddingLeft: 19,
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    paddingLeft: 12,
    flex: 1,
  },
  specieListItem: {
    paddingVertical: 20,
    paddingRight: 10,
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
    paddingVertical: 20,
    alignSelf: 'center',
  },
  closeIcon: {
    justifyContent: 'flex-end',
    color: Colors.TEXT_COLOR,
    paddingRight: 20,
  },
});
