import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { Colors, Typography } from '_styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../Common';
import i18next from 'i18next';
import Icon from 'react-native-vector-icons/Feather';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
  ScientificSpecies,
} from '../../repositories/schema';
import Realm from 'realm';
import { isLogin } from '../../repositories/user';
import { searchSpecies, AddUserSpecies, getAllSpecies } from '../../repositories/species';
import { setSpecieId } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';

const ManageSpecies = () => {
  const navigation = useNavigation();
  const [specieList, setSpecieList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [alreadyPresentSpecies, setAlreadyPresentSpecies] = useState([]);
  const { dispatch: speciesDispatch } = useContext(SpeciesContext);

  useEffect(() => {
    getAllSpecies()
    .then((data) =>
      setSpecieList(data)
    )
    return () => {
      // cleanup
    }
  }, []);

  console.log(searchBarFocused);
  const onPressBack = () => {
    console.log('clicked');
    navigation.navigate('MainScreen');
  };

  const renderSpecieCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        key={index}
        style={{
          paddingBottom: 20,
          paddingRight: 10,
          paddingTop: 10,
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
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_12,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
              color: '#949596',
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
    console.log(selectedSpecies, 'selectedSPecies');
  }

  const removeSpecies = (item) => {
    setSelectedSpecies(selectedSpecies.filter((specie) => specie.scientific_name !== item.scientific_name));
  };

  const addSelectedSpecies = () => {
    isLogin()
      .then(() => {
        if (selectedSpecies.length === 0) {
          onPressBack();
        }
        let species = [...selectedSpecies];
        // let alreadyPresentSpecies = [];
        for (let specie of species) {
          let currentSpecie;
          for (let item of specieList) {
            if (specie.guid === item.speciesId){
              currentSpecie = item;
              console.log(currentSpecie, 'current species');
              setAlreadyPresentSpecies([...alreadyPresentSpecies, currentSpecie]);
              // .push(currentSpecie);
              // console.log(alreadyPresentSpecies,'already Present');
              break;
            } else {
              currentSpecie = null;
            }
          }
          if (!currentSpecie){
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
                  scientific_name: specie.scientific_name
                }),
                [{ text: i18next.t('label.select_species_ok'), onPress: () => console.log('OK Pressed') }],
                { cancelable: false },
              );
            });
          }
        }
        if (alreadyPresentSpecies.length > 0) {
          console.log(alreadyPresentSpecies,'already Present................');
          Alert.alert(
            "Error",
            `You have added ${alreadyPresentSpecies} already`,
            [
              { text: "OK", onPress: () => {console.log("OK Pressed"); setAlreadyPresentSpecies([]);} }
            ],
            { cancelable: false }
          );
        }
      })
      .catch((err) => console.log(err));
  };

  const renderSearchSpecieCard = ({ item, index }) => {
    let isCheck;
    if (selectedSpecies !== null) {
      for (let specie of selectedSpecies) {
        if (specie.scientific_name === item.scientific_name) {
          isCheck =  true;
          break;
        } else {isCheck = false}
      }
    }
    return (
      <TouchableOpacity
        key={index}
        style={{
          paddingBottom: 20,
          paddingRight: 10,
          paddingTop: 10,
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
            {item.scientific_name}
          </Text>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_12,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
              color: '#949596',
            }}>
            {item.scientific_name}
          </Text>
        </View>
        {isCheck ? (
          <Icon
            name="check-circle"
            size={25}
            color={Colors.PRIMARY}
            onPress={() => {
              removeSpecies(item);
            }}
          />
        ) : (
          <Icon
            name="plus-circle"
            size={25}
            color={Colors.TEXT_COLOR}
            onPress={() => {
              // Keyboard.dismiss();
              addSpecies(item);
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  const MySpecies = () => {
    return (
      <View style={{flex:1}}>
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
        <View style={{flex:1}}>
          <FlatList
            style={{ flex: 1 }}
            data={specieList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.nameOfTree}
            renderItem={renderSpecieCard}
          />
        </View>
      </View>
    );
  };

  const SearchSpecies = () => {
    return (
      <View style={{flex:1, paddingTop: 15}}>
        <FlatList
          style={{ flex: 1 }}
          data={searchList}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.guid}
          renderItem={renderSearchSpecieCard}
          extraData={selectedSpecies}
        />
      </View>
    );
  };

  function compare( a, b ) {
    if ( a.scientific_name < b.scientific_name ){
      return -1;
    }
    if ( a.scientific_name > b.scientific_name ){
      return 1;
    }
    return 0;
  }

  return (
    <View style={styles.container}>
      <Header 
        closeIcon
        onBackPress={onPressBack} 
        headingText="Tree Species" 
        rightText='Done' 
        onPressFunction= {addSelectedSpecies}
      />
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchText}
          // defaultValue="Search species"
          placeholder= "Search species"
          onChangeText={(text) => {
            setSearchText(text);
            if (text)
            {
              searchSpecies(text)
              .then((data) => { console.log(typeof data, 'Dataaaaaaaaaa'); setSearchList(data); })
            }
            else {
              setSearchList(null)
            }
          }}
          value={searchText}
          onFocus = {() => {setSearchBarFocused(true);}}
        />
      </View>
      <>
        { searchBarFocused ? <SearchSpecies /> : <MySpecies/>}
      </>
    </View>
  );
};

export default ManageSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // flexDirection: 'column',
    // justifyContent: 'flex-start',
    paddingHorizontal: 25,
    paddingTop: 30,
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
    flex:1
  },
});

const speciesJSON = [
  { localName: 'Balché', nameOfTree: 'Aardvark' },
  { localName: 'Balché', nameOfTree: 'Albatross' },
  { localName: 'Balché', nameOfTree: 'Alligator' },
  { localName: 'Balché', nameOfTree: 'Alpaca' },
  { localName: 'Balché', nameOfTree: 'Ant' },
  { localName: 'Balché', nameOfTree: 'Anteater' },
  { localName: 'Balché', nameOfTree: 'Antelope' },
  { localName: 'Balché', nameOfTree: 'Ape' },
  { localName: 'Balché', nameOfTree: 'Armadillo' },
  { localName: 'Balché', nameOfTree: 'Donkey' },
  { localName: 'Balché', nameOfTree: 'Baboon' },
  { localName: 'Balché', nameOfTree: 'Badger' },
  { localName: 'Balché', nameOfTree: 'Barracuda' },
  { localName: 'Balché', nameOfTree: 'Bat' },
  { localName: 'Balché', nameOfTree: 'Bear' },
  { localName: 'Balché', nameOfTree: 'Beaver' },
  { localName: 'Balché', nameOfTree: 'Bee' },
  { localName: 'Balché', nameOfTree: 'Bison' },
  { localName: 'Balché', nameOfTree: 'Boar' },
  { localName: 'Balché', nameOfTree: 'Buffalo' },
  { localName: 'Balché', nameOfTree: 'Butterfly' },
  { localName: 'Balché', nameOfTree: 'Camel' },
  { localName: 'Balché', nameOfTree: 'Capybara' },
  { localName: 'Balché', nameOfTree: 'Caribou' },
  { localName: 'Balché', nameOfTree: 'Cassowary' },
  { localName: 'Balché', nameOfTree: 'Cat' },
  { localName: 'Balché', nameOfTree: 'Caterpillar' },
  { localName: 'Balché', nameOfTree: 'Cattle' },
  { localName: 'Balché', nameOfTree: 'Chamois' },
];
