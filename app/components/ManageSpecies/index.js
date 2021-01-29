import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View, Keyboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchSpecies from './SearchSpecies';
import MySpecies from './MySpecies';
import { Colors, Typography } from '_styles';
import { addMultipleTreesSpecie, setSpecieId } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';
import { AddUserSpecies, getAllSpecies, searchSpecies } from '../../repositories/species';
import { Header } from '../Common';

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
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const { state: speciesState, dispatch: speciesDispatch } = useContext(SpeciesContext);

  useEffect(() => {
    // fetches all the species already added by user when component mount
    getAllSpecies().then((data) => setSpecieList(data));

    // hides the keyboard when component unmount
    return () => Keyboard.dismiss();
  }, []);

  // used to navigate to main screen
  const onPressHome = () => {
    navigation.navigate('MainScreen');
  };

  const addSelectedSpecies = () => {
    if (selectedSpecies.length === 0) {
      onPressBack ? setSearchBarFocused(false) : onPressHome();
    } else {
      let species = [...selectedSpecies];
      for (let specie of species) {
        AddUserSpecies(specie.scientific_name, specie.guid)
          .then((data) => {
            setSpecieId(data)(speciesDispatch);
            setSelectedSpecies([]);
            if (registrationType === 'multiple') {
              addMultipleTreesSpecie({
                id: data,
                scientificName: specie.scientific_name,
                speciesId: specie.guid,
              })(speciesDispatch);
            }

            setSearchBarFocused(false);
          })
          .catch((err) => {
            console.error(err);
            Alert.alert(
              i18next.t('label.select_species_error'),
              i18next.t('label.select_species_enter_valid_input', {
                scientific_name: specie.scientific_name,
              }),
              [
                {
                  text: i18next.t('label.select_species_ok'),
                },
              ],
              { cancelable: false },
            );
          });
      }
      setSearchText('');
    }
  };

  /**
   * checks if the list of species passed as [speciesList] param includes the specie passed as [specieToSearch] param
   * and returns the result of the same
   * @param {speciesList} speciesList - list of species used to search from
   * @param {specieToSearch} specieToSearch - used to find this specie in the passed list of species
   */
  const checkIsSpeciePresent = (speciesList, specieToSearch) => {
    let isPresent = false;
    if (speciesList && speciesList.length > 0) {
      // iterates through the list of species passed and checks if the specie to search for is present in it.
      for (let specie of speciesList) {
        if (specie.scientific_name === specieToSearch.scientific_name) {
          isPresent = true;
          break;
        }
      }
    }
    return isPresent;
  };

  /**
   * checks if the user species list includes the specie passed as [specieToSearch] param
   * and returns the result of the same
   * @param {specieToSearch} specieToSearch - used to find this specie in the user species list
   */
  const shouldDisable = (specieToSearch) => {
    let isUserSpeciePresent = false;
    if (specieList && specieList.length > 0) {
      // iterates through the user species list and checks if the specie to search for is present in it.
      for (let specie of specieList) {
        if (specie.speciesId === specieToSearch.guid) {
          isUserSpeciePresent = true;
          break;
        }
      }
    }
    return isUserSpeciePresent;
  };

  const handleSpeciesSearch = (text) => {
    setSearchText(text);
    if (text) {
      setSearchBarFocused(true);
      searchSpecies(text).then((data) => {
        let newList = [];
        for (let specie of data) {
          const isDisabled = shouldDisable(specie);
          newList.push({
            guid: specie.guid,
            scientific_name: specie.scientific_name,
            isCheck: isDisabled ? isDisabled : checkIsSpeciePresent(selectedSpecies, specie),
            isDisabled,
          });
        }
        setSearchList(newList);
      });
    } else {
      setSearchBarFocused(false);
      setSearchList([]);
    }
  };

  const changeSearchSpecieCheck = (index, isCheck) => {
    setSearchList((list) => {
      list[index].isCheck = isCheck;
      return list;
    });
  };

  return (
    <View style={styles.container}>
      <Header
        closeIcon
        onBackPress={onPressBack ? onPressBack : onPressHome}
        headingText={registrationType ? i18next.t('label.select_species_header') : 'Tree Species'}
        rightText={i18next.t('label.select_species_done')}
        onPressFunction={addSelectedSpecies}
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
      </View>
      {searchBarFocused ? (
        <SearchSpecies
          setSelectedSpecies={setSelectedSpecies}
          selectedSpecies={selectedSpecies}
          specieList={specieList}
          searchList={searchList}
          changeSearchSpecieCheck={changeSearchSpecieCheck}
        />
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
    alignItems: 'flex-start',
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
    paddingVertical: 12,
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
});
