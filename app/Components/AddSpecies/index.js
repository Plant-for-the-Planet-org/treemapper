import React, { useState, useEffect, useContext } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, TouchableOpacity, TextInput,  KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Colors, Typography } from '_styles';
import { Header } from '../Common';
//import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import Icon from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
//import Ionicons from 'react-native-vector-icons/Ionicons';
import { getInventory, isLogin,auth0Login,} from '../../Actions';
//import { add_image } from '../../assets';
import { SearchSpecies } from '../../Services/Species';
//import Camera from '../Common/Camera';
import { store } from '../../Actions/store';
import { createSpecies } from '../../Actions/UploadInventory';
import { SpecieIdFromServer } from '../../Actions/Action';
import {placeholder_image} from '../../assets';

export default function index({navigation}) {
  const [imagePath, setImagePath] = useState(null);
  const [search, setSearch] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  //const [speciesList, setSpeciesList] = useState(null);
  const [searchList, setSearchList] = useState(null);
  //const [isCamera, setIsCamera] = useState(false);
  //const [specieId, setSpecieId] = useState(null);
  //const camera = useRef();
  //const [openImageModal, setOpenImageModal] = useState(false);
  //const [isAddSpecies, setIsAddSpecies] = useState(null);
  const [inventory, setInventory] = useState(null);
  //const [isShowSpeciesListModal, setIsShowSpeciesListModal] = useState(false);
  const { state, dispatch } = useContext(store);

  useEffect(() => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      inventory.species = Object.values(inventory.species);
      setInventory(inventory);
      console.log(inventory, 'inventory');
      if (inventory.polygons[0]?.coordinates[0]?.imageUrl) {
        setImagePath(inventory.polygons[0].coordinates[0].imageUrl);
      }
    });
  }, []);

  useEffect(() => {
    searchSpecies();
  }, [search]);

  const searchSpecies = () => {
    SearchSpecies(search).then((data) => {
      setSearchList(data);
      console.log(data, 'search data');
    }).catch((err) => {
      console.log(err);
    });
  };

  const onPressSearchBtn = () => {
    searchSpecies();
  };

  const checkIsUserLogin = () => {
    return new Promise((resolve, reject) => {
      isLogin()
      .then(() => {
        resolve();
      })
      .catch(() => {
        auth0Login();
      })
    }
    );
  };

  const addSelectedSpecies = () => {
    checkIsUserLogin().then(() => {
      if (selectedSpecies.length === 0) {
        navigation.goBack();
      }
      let species = [...selectedSpecies];
      for(let specie of species ) {
        console.log(specie, 'specie');
        createSpecies(imagePath, specie.id, specie.scientificName).then((data) => {
          dispatch(SpecieIdFromServer.setSpecieId(data));
          navigation.goBack();
        });
      // AddUserSpecies({name: null, image: imagePath, scientificName: specie.scientificName, speciesId: specie.id}).then((data) => {
      //   console.log(data, 'add species');
      //   navigation.goBack();
      // // setOpenImageModal(!openImageModal);
      // // closeSearch(false);
      // }).catch((err) => {
      //   console.log(err, 'species');
      // });
      }
    });
  };
  const addSpecies = (item) => {
    setSelectedSpecies([...selectedSpecies, item]);
  };

  const renderSpeciesCard = ({item}) => {
    let isCheck;
    //let image;
    if (selectedSpecies !== null) {
      let selectItem =[...selectedSpecies];
      for(let specie of selectItem ) {
        if (specie === item) {
          isCheck = specie.name === item.name ? true : false;
        }
      }
    }
    // console.log(item.name, 'insp');
    return (
      <TouchableOpacity
        // key={item.id}
        // onPress={() => addSpecies(item)}
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 20,
        }}
        accessible={true}
        accessibilityLabel="Species Card"
        testID="species_card">
        {isCheck ? (
          <Icon 
            name='check-circle'
            size={25}
            color={Colors.PRIMARY}
          />
        ) :
          <Icon 
            name='plus-circle'
            size={25}
            color={Colors.TEXT_COLOR}
            onPress={() =>addSpecies(item)}
          />}
        <TouchableOpacity onPress={() => onPressImage()} style={{flex:1}}>
          <Image 
            source={
              placeholder_image
            } 
            resizeMode={'contain'} 
            style={{ flex: 1}}
          />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 20 }}>
          <Text numberOfLines={2} style={styles.speciesLocalName}>
            {i18next.t('label.select_species_local_name', { item })}
          </Text>
          <Text numberOfLines={2} style={styles.speciesName}>
            {i18next.t('label.select_species_name_of_tree', { item })}
          </Text>
          {item.treeCount && (
            <Text style={styles.treeCount}>
              {i18next.t('label.select_species_tree_count', { count: item.treeCount })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={styles.mainContainer}>
        {/* {renderSpeciesModal} */}
        <View style={styles.container}>
          <Header
            onBackPress={addSelectedSpecies}
            closeIcon
            headingText='Add Species'
            subHeadingText='Species list will update as you type Click + to add it to your profile'
          />
          <FlatList 
            style={{flex: 1}}
            data={searchList}
            renderItem={renderSpeciesCard}
            keyExtractor={item=> item.id}
            extraData={selectedSpecies}
          />
  
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
            style={styles.bgWhite}>
            <View style={styles.externalInputContainer}>
              {/* <Text style={styles.labelModal}>Diameter</Text> */}
              <TextInput
                value={search}
                style={styles.value}
                autoFocus
                placeholder='Select Species'
                placeholderTextColor={Colors.TEXT_COLOR}
                onChangeText={(text) => setSearch(text)}
              />
              <MCIcon
                onPress={onPressSearchBtn}
                name={'arrow-right'}
                size={30}
                color={Colors.PRIMARY}
              />
            </View>
            <SafeAreaView />
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
    // </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  speciesLocalName: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
  },
  speciesLocalNameSingle: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    paddingBottom: 15
  },
  speciesName: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    fontStyle: 'italic',
  },
  externalInputContainer: {
    flexDirection: 'row',
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    // paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderColor: Colors.TEXT_COLOR,
  },
  value: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    flex: 1,
    paddingVertical: 10,
  },
  containerCamera: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.7)'
  },
  modalView: {
    margin: 6,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
});
