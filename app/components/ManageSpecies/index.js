import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography } from '_styles';
import { addMultipleTreesSpecie, setSpecieId } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';
import { AddUserSpecies, getAllSpecies, searchSpecies } from '../../repositories/species';
import { Header } from '../Common';
import PrimaryButton from '../Common/PrimaryButton';

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
    getAllSpecies().then((data) => setSpecieList(data));
  }, []);

  const onPressHome = () => {
    navigation.navigate('MainScreen');
  };

  const renderSpecieCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        key={index}
        style={{
          paddingVertical: 20,
          paddingRight: 10,
          borderBottomWidth: 1,
          borderColor: '#E1E0E061',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => {
          if (registrationType == 'single') {
            onPressSpeciesSingle(item);
          } else if (registrationType == 'multiple') {
            onPressSpeciesMultiple(item, index);
          }
        }}>
        <View>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {item.scientificName}
          </Text>
        </View>
        {registrationType == 'multiple' ? (
          <Text>{item.treeCount ? item.treeCount : 'NA'}</Text>
        ) : (
          <Ionicons name="chevron-forward-outline" size={20} />
        )}
      </TouchableOpacity>
    );
  };

  const addSpecies = (item) => {
    setSelectedSpecies([...selectedSpecies, item]);
  };

  const removeSpecies = (item) => {
    setSelectedSpecies(
      selectedSpecies.filter((specie) => specie.scientific_name !== item.scientific_name),
    );
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
    }
  };

  const checkIsSpeciePresent = (speciesList, specieToSearch) => {
    let isPresent = false;
    if (speciesList && speciesList.length > 0) {
      for (let specie of speciesList) {
        if (specie.scientific_name === specieToSearch.scientific_name) {
          isPresent = true;
          break;
        }
      }
    }
    return isPresent;
  };

  const renderSearchSpecieCard = ({ item, index }) => {
    let isDisabled = false;
    let isCheck = checkIsSpeciePresent(selectedSpecies, item);
    let isUserSpeciePresent = false;
    if (specieList && specieList.length > 0) {
      for (let specie of specieList) {
        if (specie.speciesId === item.guid) {
          isUserSpeciePresent = true;
          break;
        }
      }
    }
    if (isUserSpeciePresent) {
      isDisabled = true;
      isCheck = true;
    }

    const SpecieListItem = () => {
      return (
        <>
          <View>
            <Text
              style={{
                fontSize: Typography.FONT_SIZE_16,
                fontFamily: Typography.FONT_FAMILY_REGULAR,
              }}>
              {item.scientific_name}
            </Text>
          </View>
          <Icon
            name={isCheck ? 'check-circle' : 'plus-circle'}
            size={25}
            color={isCheck ? Colors.PRIMARY : Colors.TEXT_COLOR}
          />
        </>
      );
    };

    if (isDisabled) {
      return (
        <View style={[styles.specieListItem, { opacity: 0.5 }]}>
          <SpecieListItem />
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          key={index}
          style={styles.specieListItem}
          onPress={() => {
            if (isCheck) {
              removeSpecies(item);
            } else {
              addSpecies(item);
            }
          }}>
          <SpecieListItem />
        </TouchableOpacity>
      );
    }
  };

  const MySpecies = () => {
    return (
      <View style={{ flex: 1 }}>
        <View>
          <Text
            style={{
              paddingTop: 25,
              paddingBottom: 15,
              fontFamily: Typography.FONT_FAMILY_BOLD,
              fontSize: Typography.FONT_SIZE_16,
            }}>
            {i18next.t('label.select_species_my_species')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            style={{ flex: 1 }}
            data={registrationType === 'multiple' ? speciesState.multipleTreesSpecies : specieList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.speciesId}
            renderItem={renderSpecieCard}
          />
        </View>
        {registrationType === 'multiple' && (
          <PrimaryButton
            onPress={onSaveMultipleSpecies}
            btnText={i18next.t('label.select_species_btn_text')}
            testID={'btn_save_and_continue_species'}
            accessibilityLabel={'Save and Continue Species'}
          />
        )}
      </View>
    );
  };

  const SearchSpecies = () => {
    return (
      <View style={{ flex: 1, paddingTop: 15 }}>
        <FlatList
          style={{ flex: 1 }}
          data={searchList}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.guid}
          renderItem={renderSearchSpecieCard}
        />
      </View>
    );
  };

  const handleSpeciesSearch = (text) => {
    setSearchText(text);
    if (text) {
      setSearchBarFocused(true);
      searchSpecies(text).then((data) => {
        setSearchList(data);
      });
    } else {
      setSearchBarFocused(false);
      setSearchList([]);
    }
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
      {searchBarFocused ? <SearchSpecies /> : <MySpecies />}
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
