import React,{ useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import { Colors, Typography } from '_styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../Common';
// import { FlatList, ScrollView } from 'react-native-gesture-handler';
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
} from '../../Actions/Schemas';
import Realm from 'realm';


const ManageSpecies = () => {
  const navigation = useNavigation();
  const [specieList, setSpecieList] = useState([...speciesJSON]);
  const [searchText, setSearchText] = useState('Search species');
  const [searchList, setSearchList] = useState(null);

  const onPressBack = () => {
    console.log('clicked');
    navigation.navigate('MainScreen');
  };

  const renderSpecieCard = ({ item, index }) => {
    return(
      <TouchableOpacity
        key={index}
        style={{paddingBottom: 20, paddingRight: 10, paddingTop: 10,borderBottomWidth: 1, borderColor: '#E1E0E061', flexDirection: 'row', alignItems:'center', justifyContent:'space-between'}}
      >
        <View>
          <Text style={{fontSize: Typography.FONT_SIZE_16, fontFamily: Typography.FONT_FAMILY_REGULAR}}>
            {item.nameOfTree}
          </Text>
          <Text style={{fontSize:Typography.FONT_SIZE_12, fontFamily: Typography.FONT_FAMILY_REGULAR, color: '#949596'}}>
            {item.localName}
          </Text>
        </View>
        <Ionicons name='chevron-forward-outline' size={20}/>
      </TouchableOpacity>
    );
  }

  const searchSpecies = (searchText) => {
    return new Promise((resolve, reject) => {
      Realm.open({
        schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies, ScientificSpecies ]
      })
      .then((realm)=>{
        let species = realm.objects('ScientificSpecies');
        let searchedSpecies = species.filtered(`scientific_name BEGINSWITH "${searchText}"`);
        console.log(searchedSpecies);
        setSearchList(searchedSpecies);
      })

    });  
  };

  const renderSearchSpecieCard = ({item, index}) => {
    return(
      <TouchableOpacity
        key={index}
        style={{paddingBottom: 20, 
          paddingRight: 10, 
          paddingTop: 10, 
          borderBottomWidth: 1, 
          borderColor: '#E1E0E061', 
          flexDirection: 'row', 
          alignItems:'center', 
          justifyContent:'space-between'}}
      >
        <View>
          <Text style={{fontSize: Typography.FONT_SIZE_16, fontFamily: Typography.FONT_FAMILY_REGULAR}}>
            {item.scientific_name}
          </Text>
          <Text style={{fontSize:Typography.FONT_SIZE_12, fontFamily: Typography.FONT_FAMILY_REGULAR, color: '#949596'}}>
            {item.localName}
          </Text>
        </View>
        <Icon 
          name='check-circle'
          size={25}
          color={Colors.PRIMARY}
          // onPress={() => {
          //   // removeSpecies(item);
          // }}
        />
      </TouchableOpacity>
    );
  }

  const MySpecies = () => {
    return (
      <View>
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
        <ScrollView>
          <FlatList
            style={{ flex: 1 }}
            data={specieList}
            showsVerticalScrollIndicator={false}
            renderItem={renderSpecieCard}
          />
        </ScrollView>
      </View>
    );
  };

  const SearchSpecies = () => {
    return(
      <View>
        <ScrollView>
          <FlatList
            style={{ flex: 1 }}
            data={searchList}
            showsVerticalScrollIndicator={false}
            renderItem={renderSearchSpecieCard}
          />
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Header closeIcon onBackPress={onPressBack} headingText="Tree Species" />
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchText} 
          defaultValue="Search species" 
          onChangeText={text => 
            {
              setSearchText(text);
              !text ?
              searchSpecies(text):
              null;
            }}
          onFocus={()=> setSearchText('')}
          // autoFocus
          value={searchText} 
        />
      </View>
      <>
        {/* <MySpecies /> */}
        <SearchSpecies />
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
]