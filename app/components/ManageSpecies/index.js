import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { Colors, Typography } from '_styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../Common';
import i18next from 'i18next';
import Icon from 'react-native-vector-icons/Feather';
import { searchSpecies, AddUserSpecies, getAllSpecies } from '../../repositories/species';
import { setSpecieId } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';

const ManageSpecies = () => {
  const navigation = useNavigation();
  const [specieList, setSpecieList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const { dispatch: speciesDispatch } = useContext(SpeciesContext);

  useEffect(() => {
    getAllSpecies().then((data) => setSpecieList(data));
  }, []);

  const onPressBack = () => {
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
        <Ionicons name="chevron-forward-outline" size={20} />
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
      onPressBack();
    } else {
      let species = [...selectedSpecies];
      for (let specie of species) {
        AddUserSpecies(specie.scientific_name, specie.guid)
          .then((data) => {
            setSpecieId(data)(speciesDispatch);
            onPressBack();
          })
          .catch((err) => {
            console.log(err);
            Alert.alert(
              i18next.t('label.select_species_error'),
              i18next.t('label.select_species_enter_valid_input', {
                scientific_name: specie.scientific_name,
              }),
              [
                {
                  text: i18next.t('label.select_species_ok'),
                  onPress: () => console.log('OK Pressed'),
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
        } else {
          isPresent = false;
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
        } else {
          isUserSpeciePresent = false;
        }
      }
    }
    if (isUserSpeciePresent) {
      isDisabled = true;
      isCheck = true;
    }

    const SpecieListItem = ({ item }) => {
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
          <SpecieListItem item={item} />
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
          <SpecieListItem item={item} />
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
            My species
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            style={{ flex: 1 }}
            data={specieList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.speciesId}
            renderItem={renderSpecieCard}
          />
        </View>
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
      searchSpecies(text).then((data) => {
        setSearchList(data);
      });
    } else {
      setSearchList([]);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        closeIcon
        onBackPress={onPressBack}
        headingText="Tree Species"
        rightText="Done"
        onPressFunction={addSelectedSpecies}
      />
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchText}
          placeholder="Search species"
          onChangeText={handleSpeciesSearch}
          value={searchText}
          onFocus={() => {
            setSearchBarFocused(true);
          }}
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
    paddingBottom: 20,
    paddingRight: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
