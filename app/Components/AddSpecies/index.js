import React, { useState, useEffect, useContext } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, TouchableOpacity, TextInput,  KeyboardAvoidingView, Platform, Image, Keyboard, Modal, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography } from '_styles';
import { Header } from '../Common';
//import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import Icon from 'react-native-vector-icons/Feather';
import Config from 'react-native-config';
//import Ionicons from 'react-native-vector-icons/Ionicons';
import { getInventory, isLogin, auth0Login } from '../../Actions';
//import { add_image } from '../../assets';
import { SearchSpecies } from '../../Services/Species';
//import Camera from '../Common/Camera';
import { store } from '../../Actions/store';
import { createSpecies } from '../../Actions/UploadInventory';
import { SpecieIdFromServer } from '../../Actions/Action';
import {placeholder_image, add_image, tree} from '../../assets';
import { APIConfig } from '../../Actions/Config';

const AddSpeciesModal = ({ visible, closeAddSpeciesModal }) => {
  const [imagePath, setImagePath] = useState(null);
  const [search, setSearch] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [searchList, setSearchList] = useState(null);
  const [showAddspeciesModal, setShowAddSpeciesModal] = useState(visible);
  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(null);
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const { state, dispatch } = useContext(store);

  // console.log('visibility:', visible);
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

  useEffect(() => {
    setShowAddSpeciesModal(visible);
    setSearch(null);
    setSelectedSpecies([]);
    setSearchList(null);
  }, [visible]);
  
  const searchSpecies = () => {
    setIsLoading(true);
    SearchSpecies(search).then((data) => {
      setSearchList(data);
      setIsLoading(false)
      console.log(data, 'search data');
    }).catch((err) => {
      console.log(err);
    });
  };


  const addSelectedSpecies = () => {
    isLogin().then(() => {
      if (selectedSpecies.length === 0) {
        // navigation.goBack();
        // setShowAddSpeciesModal(false);
        closeAddSpeciesModal();
      }
      setIsLoaderShow(true);
      let species = [...selectedSpecies];
      for (let specie of species) {
        console.log(specie, 'specie');
        createSpecies( specie.id, specie.scientificName)
        .then((data) => {
          dispatch(SpecieIdFromServer.setSpecieId(data));
          // navigation.goBack();
        // setShowAddSpeciesModal(false);
        setIsLoaderShow(false);
        closeAddSpeciesModal();
        })
        .catch((err) => {
          console.log(err);
          setIsLoaderShow(false);
          Alert.alert(
            "Error",
            `You have already added ${specie.scientificName}`,
            [
              { text: "OK", onPress: () => console.log("OK Pressed") }
            ],
            { cancelable: false }
          );
        });
      
      }
    })
    .catch((err)=> console.log(err));
  };
  const addSpecies = (item) => {
    setSelectedSpecies([...selectedSpecies, item]);
  };

  const removeSpecies = (item) => {
    setSelectedSpecies(selectedSpecies.filter(specie => specie.name !== item.name))
  }

  const renderSpeciesCard = ({item}) => {
    let isCheck;
    if (selectedSpecies !== null) {
      let selectItem = [...selectedSpecies];
      for (let specie of selectItem) {
        if (specie === item) {
          isCheck = specie.name === item.name ? true : false;
        }
      }
    }
    // console.log(item.name, 'insp');
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 10,
        }}
        accessible={true}
        accessibilityLabel="Species Card"
        testID="species_card">
        {isCheck ? (
          <Icon 
            name='check-circle'
            size={25}
            color={Colors.PRIMARY}
            onPress={() => {
              removeSpecies(item);
            }}
          />
        ) :
          <Icon 
            name='plus-circle'
            size={25}
            color={Colors.TEXT_COLOR}
            onPress={() =>{
              Keyboard.dismiss();
              addSpecies(item);}}
          />}
        {/* <TouchableOpacity onPress={() => onPressImage()} style={{flex:1}}>
          <Image 
            source={
              {uri: `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${item.image}`}
            } 
            resizeMode={'contain'} 
            style={{ flex: 1}}
          />
        </TouchableOpacity> */}
        {item.image ? (
          // <TouchableOpacity onPress={() =>onPressImage(index)}>
            <Image source={{uri : `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${item.image}`}} resizeMode={'cover'} style={{ flex: 1, width: 130,height: 90, borderRadius: 10}} />
          // </TouchableOpacity>
        ) : 
          // <TouchableOpacity onPress={() => onPressImage(index)}>
            <Image source={tree} resizeMode={'cover'} style={{ flex: 1, width: 130, height: 90, borderRadius: 10, marginHorizontal: 10}} />
          // </TouchableOpacity>
        }
        <View style={{ flex: 1, paddingLeft: 20 }}>
          <Text numberOfLines={2} style={styles.speciesLocalName}>
            {/* {i18next.t('label.select_species_local_name', { item })} */}
            {`${item.name}`}
          </Text>
          <Text numberOfLines={2} style={styles.speciesName}>
            {i18next.t('label.select_species_name_of_tree', { item })}
            {`${item.scientificName}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoaderModal = () => {
    return (
      <Modal transparent visible={isLoaderShow}>
        <View style={styles.dowloadModalContainer}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ padding: 30, backgroundColor: '#fff', borderRadius: 10 }}>
              Adding Species...
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  // console.log('showAddspeciesModal:::', showAddspeciesModal);
  // console.log('Selected Species', selectedSpecies);
  return (
    <Modal visible= {showAddspeciesModal} animatioType= {'slide'}>
      <View style={{flex: 1}}>
        <SafeAreaView style={styles.mainContainer}>
          {/* {renderSpeciesModal} */}
          <View style={styles.container}>
              <Header
                onBackPress={() => closeAddSpeciesModal()}
                closeIcon
                headingText='Add Species'
                subHeadingText='Species list will update as you type Click + to add it to your profile'
                rightText= {`${selectedSpecies.length} Species Selected`}
              />
            {isLoading ? (
              <View>
                {/* <Text>{`Searching for ${search}`}</Text> */}
                <ActivityIndicator size={25} color={Colors.PRIMARY} />
              </View>
            ): null}  
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
                  placeholder='Search Species'
                  placeholderTextColor={Colors.TEXT_COLOR}
                  onChangeText={(text) => setSearch(text)}
                />
                {/* <MCIcon
                  onPress={onPressSearchBtn}
                  name={'arrow-right'}
                  size={30}
                  color={Colors.PRIMARY}
                /> */}
                <TouchableOpacity
                  disabled = {selectedSpecies.length>0 ? false : true}
                  style = {selectedSpecies.length>0 ? styles.doneButton :styles.buttonDisabled}
                  onPress = {addSelectedSpecies}
                >
                  <Text style = {styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <SafeAreaView />
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
        {renderLoaderModal()}
      </View>
    </Modal>
  );
}

export default AddSpeciesModal;

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
    fontSize: Typography.FONT_SIZE_18,
  },
  speciesLocalNameSingle: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    paddingBottom: 15,
  },
  speciesName: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
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
    backgroundColor: 'rgba(0,0,0,.7)',
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doneButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 5
  },
  buttonText:{
    color: Colors.WHITE
  },
  buttonDisabled: {
    backgroundColor: Colors.DISABLE,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 5
  },
  speciesNumberText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    paddingTop: 15,
    paddingRight: 20
  },
  dowloadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  }
});
