import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import { placeholder_image, checkCircleFill, checkCircle, add_image, off_site_enable_banner} from '../../assets';
import { SvgXml } from 'react-native-svg';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import i18next from 'i18next';
import {getInventory, getUserInformation, UpdateSpecieAndSpecieDiameter} from '../../Actions';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { store } from '../../Actions/store';
import Camera from '../Common/Camera';
import { UpdateSpecies, SpeciesListData, UpdateSpeciesImage } from '../../Actions/UploadInventory';
import Config from 'react-native-config';
import { APIConfig } from '../../Actions/Config';
import { SpeciesListAction } from '../../Actions/Action';
import { useIsFocused } from '@react-navigation/native';
import AddSpeciesModal from '../AddSpecies';

const SelectSpecies = ({ visible, closeSelectSpeciesModal, speciess, route, invent, onPressSaveAndContinueMultiple }) => {
  const [isShowTreeCountModal, setIsShowTreeCountModal] = useState(false);
  const [treeCount, setTreeCount] = useState('');
  const [activeSpeice, setActiveSpecie] = useState(undefined);
  // const [speciesList, setSpeciesList] = useState([...speciesJSON]);
  const [singleTree, setSingleTree] = useState(null);
  const [isShowTreeMeasurementModal, setIsShowTreeMeasurementModal] = useState(false);
  const [diameter, setDiameter] = useState(null);
  const [height, setHeight] = useState(null)
  const [speciesList, setSpeciesList] = useState(null);
  const [specieIndex, setSpecieIndex] = useState(null);
  const [name, setName] = useState('');
  const navigation = useNavigation();
  const [showSpecies, setShowSpecies] = useState(visible);
  const [addSpecies, setAddSpecies] = useState(false);
  const [inventory, setInventory] = useState(null);
  const { state, dispatch } = useContext(store);
  const [isCamera, setIsCamera] = useState(false);
  const [isShowAddNameModal, setIsShowAddNameModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(null);
  const isFocused = useIsFocused();
  const [numberTrees, setNumberTrees] = useState(null);
  const [countryCode, setCountryCode] = useState('');
  useEffect(() => {
    setSpeciesList(state.species);
    getAllUserSpecies();
    if (route !== undefined){
      var {species, inventory} = route.params ;
    }
    else{
      var species = speciess;
      var inventory = invent;
    }
    // setTreeType(inventory.locate_tree);
    setNumberTrees(inventory.tree_type);
    if (speciesList) {
      for (let i = 0; i < species.length; i++) {
        const oneSpecie = species[i];
        speciesList[oneSpecie.id].treeCount = oneSpecie.treeCount;
      }
      if (species.length == 0) {
        for (let i = 0; i < speciesJSON.length; i++) {
          delete speciesJSON[i].treeCount;
        }
        setSpeciesList([...speciesJSON]);
      }
      setSpeciesList(speciesList);
      Inventory();
      Country();
    }
  }, [navigation, isFocused, addSpecies]);

  useEffect(()=>{setShowSpecies(visible)},[visible]);

  useFocusEffect(
    React.useCallback(() => {
      setSpeciesList(state.species);
      Inventory();
    }, [state])
  );

  const getAllUserSpecies = () => {
    SpeciesListData().then((data) => {
      console.log(data);
      dispatch(SpeciesListAction.setSpeciesList(data));
    }).catch((err) => {
      console.log(err, 'hererer');
    });
  };

  const Inventory = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      inventory.species = Object.values(inventory.species);
      setInventory(inventory);
      console.log(inventory);
      // setTreeType(inventory.locate_tree);
      setNumberTrees(inventory.tree_type);
    });
  };

  const Country = () => {
    getUserInformation().then((data) =>{
      console.log(data,'CountryData');
      setCountryCode(data.country);
    })
  }

  const onPressSpecie = (index) => {
    if (speciesList[index].treeCount) {
      speciesList[index].treeCount = undefined;
      setTimeout(() => setSpeciesList([...speciesList]), 0);
    } else {
      setActiveSpecie(index);
      setIsShowTreeCountModal(true);
      setTimeout(() => {
        speciesList[index].treeCount ? setTreeCount(speciesList[index].treeCount) : null;
      }, 0);
    }
  };

  const onPressSpecieSingleTree = (index) => {
    setSingleTree(index);
  };
  
  const onPressSaveBtn = (index) => {
    setSingleTree(index);
    setIsShowTreeMeasurementModal(true);
  };

  // const handleInput = (index, text) => {
  //   let specieslist = [...speciesList];
  //   specieslist[index] = {...specieslist[index], name: text};
  //   setSpeciesList(specieslist);
  // };
  const handleCamera = (data) => {
    setIsCamera(!isCamera);
    let specieslist = [...speciesList];
    specieslist[imageIndex] = {...specieslist[imageIndex], image: data};
    UpdateSpeciesImage(specieslist[imageIndex].image, specieslist[imageIndex].id).then(() => {
      getAllUserSpecies();
    }).catch(() => {

    });
    // setSpeciesList(species);
  };
  const onPressImage = (index) => {
    setIsCamera(!isCamera);
    setImageIndex(index);
  };

  const addName = (index) => {
    setIsShowAddNameModal(true);
    setSpecieIndex(index);
  };

  // const isNormalInteger= (str) =>  {
  //   var n = Math.floor(Number(str));
  //   return (n !== Infinity && String(n) === str && n >= 0);
  // }
  const renderSpeciesCardMultiple = ({ item, index }) => {
    let isCheck = item.treeCount ? true : false;
    let onSiteCheck;
    if (singleTree !== null) {
      onSiteCheck = item.id === singleTree.id ? true : false;
    }
    return (
      <TouchableOpacity
        key={index}
        onPress={ () => onPressSpecie(index) }
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 20,
        }}
        accessible={true}
        accessibilityLabel="Species Card"
        testID="species_card">
        {numberTrees === 'single' ? (
          <View>
            <SvgXml xml={onSiteCheck ? checkCircleFill : checkCircle} />
          </View>
        ) : 
          <View>
            <SvgXml xml={isCheck ? checkCircleFill : checkCircle} />
          </View>
        }
        {item.image ? (
          <TouchableOpacity onPress={() =>onPressImage(index)}>
            <Image source={{uri : `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${item.image}`}} resizeMode={'contain'} style={{ flex: 1, width: 130, height: 90, borderRadius: 13, marginHorizontal: 10}} />
          </TouchableOpacity>
        ) : 
          <TouchableOpacity onPress={() => onPressImage(index)}>
            <Image source={add_image} resizeMode={'contain'} style={{ flex: 1, width: 130,height: 90, borderRadius:13, marginHorizontal: 10}} />
          </TouchableOpacity>}
        <View style={{ flex: 1 }}>
          {item.aliases ? (
            <Text numberOfLines={2} style={styles.speciesLocalName} onPress={() => addName(index)}>
              {item.aliases}
            </Text>
          ): (
            <Text numberOfLines={2} style={styles.speciesLocalName} onPress={() => addName(index)}>
              Add Name
            </Text>
          ) }
          <Text numberOfLines={2} style={styles.speciesName}>
            {i18next.t('label.select_species_name_of_tree', { item })}
          </Text>
          {item.treeCount ? (
            <Text style={styles.treeCount}>
              {i18next.t('label.select_species_tree_count', { count: item.treeCount })}
            </Text>
            ) : [] 
          }
        </View>
      </TouchableOpacity>
    );
  };

  const renderSpeciesCardSingle = ({ item, index }) => {
    // let isCheck = item.treeCount ? true : false;
    let onSiteCheck;
    if (singleTree !== null) {
      onSiteCheck = item.id === singleTree.id ? true : false;
    }
    return (
      <TouchableOpacity
        key={index}
        // onPress={ () => onPressSpecieSingleTree(item) }
        onPress={() => onPressSaveBtn(item)}
        style={{
          flex:1,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginVertical: 10,
        }}
        accessible={true}
        accessibilityLabel="Species Card"
        testID="species_card">
        {/* <View>
          <SvgXml xml={onSiteCheck ? checkCircleFill : checkCircle} />
        </View> */}
        <View>
          {item.image ? (
            // <TouchableOpacity onPress={() =>onPressImage(index)}>
              <Image source={{uri : `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${item.image}`}} resizeMode={'cover'} style={{  minWidth: 130, height: 90, borderRadius: 13, marginRight: 20}} />
            // </TouchableOpacity>
            ) : 
            // <TouchableOpacity onPress={() => onPressImage(index)}>
              <Image source={add_image} resizeMode={'cover'} style={{  width: 130,height: 90, borderRadius:13, marginRight: 20}} />
            // </TouchableOpacity>
          }
        </View>
        
        <View style={{ flex: 1,flexDirection: 'column', justifyContent: 'flex-start', alignSelf: 'flex-start'}}>
          {item.aliases ? (
            <Text  style={styles.speciesLocalName} onPress={() => addName(index)}>
              {item.aliases}
            </Text>
          ): (
            <Text style={styles.speciesLocalName} onPress={() => addName(index)}>
              Add Name
            </Text>
          ) }
          <Text style={styles.speciesName}>
            {i18next.t('label.select_species_name_of_tree', { item })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  const onPressTreeCountNextBtn = () => {
    // if (isNormalInteger(treeCount)){
    let speciesListClone = speciesList;
    let specie = speciesListClone[activeSpeice];
    specie.treeCount = Number(treeCount) ? treeCount : undefined;
    speciesListClone.splice(activeSpeice, 1, specie);
    setIsShowTreeCountModal(false);
    setTreeCount(0);
    setSpeciesList([...speciesList]);
    // } else {
    //   Alert.alert(
    //     "Error",
    //     "Enter valid input",
    //     [{ text: "OK", onPress: () => console.log("OK Pressed") }],
    //     {cancelable: false}
    //   );
    // }
  };

  const renderTreeCountModal = () => {
    let specieName = isShowTreeCountModal ? speciesList[activeSpeice].name : '';
    return (
      <Modal visible={isShowTreeCountModal} transparent={true}>
        <View
          style={styles.modalBackground}>
          <View
            style={styles.inputModal}>
            <Image source={placeholder_image} style={{ alignSelf: 'center', marginVertical: 20 }} />
            <Header
              hideBackIcon
              subHeadingText={i18next.t('label.select_species_tree_count_modal_header')}
              textAlignStyle={{ textAlign: 'center' }}
            />
            <Header
              hideBackIcon
              subHeadingText={i18next.t('label.select_species_tree_count_modal_sub_header', {
                specieName,
              })}
              textAlignStyle={{ textAlign: 'center', fontStyle: 'italic' }}
            />
            <Header
              hideBackIcon
              subHeadingText={i18next.t('label.select_species_tree_count_modal_sub_header_2')}
              textAlignStyle={{ textAlign: 'center' }}
            />
          </View>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          style={styles.bgWhite}>
          <View style={styles.externalInputContainer}>
            <Text style={styles.labelModal}>{i18next.t('label.select_species_modal_label')}</Text>
            <TextInput
              value={treeCount.toString()}
              style={styles.value}
              autoFocus
              placeholderTextColor={Colors.TEXT_COLOR}
              onChangeText={(text) => setTreeCount(text)}
              keyboardType={'number-pad'}
            />
            <MCIcon
              onPress={onPressTreeCountNextBtn}
              name={'arrow-right'}
              size={30}
              color={Colors.PRIMARY}
            />
          </View>
          <SafeAreaView />
        </KeyboardAvoidingView>
      </Modal>
    );
  };


  const onPressSearch = () => {
    // navigation.navigate('AddSpecies');
    // closeSelectSpeciesModal();
    // setShowSpecies(false);
    setAddSpecies(true);
    // renderAddSpeciesModal();
  };

  const renderAddSpeciesModal = () => {
    const closeAddSpeciesModal = () => setAddSpecies(false);
    return(
      <AddSpeciesModal
        visible = {addSpecies}
        closeAddSpeciesModal = {closeAddSpeciesModal}
      />
    );
  }
  const Countries = ['US', 'LR', 'MM']
  const renderMeasurementModal = () => {
    // let specieName = isShowTreeCountModal ? speciesList[activeSpeice].nameOfTree : '';
    return (
      <Modal visible= {isShowTreeMeasurementModal} animationType={'slide'}>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
              <View style={{flexDirection: 'row', justifyContent: 'flex-start', marginTop: 10}}>
                <Header
                  headingText={'Add Measuremets'}
                /> 
              </View>
              <View style={{flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
                <View >
                  <View style={styles.inputBox}>
                    <View style={{flex:1, flexDirection: 'row', justifyContent: 'space-between'}}>
                      <TextInput
                      value={diameter}
                      style={styles.input}
                      autoFocus
                      placeholder={'Diameter'}
                      placeholderTextColor={Colors.TEXT_COLOR}
                      onChangeText={(text) => setDiameter(text)}
                      keyboardType={'number-pad'}
                      />
                      <Text style={{fontSize: Typography.FONT_SIZE_18, padding: 10, paddingRight: 20}}>
                        {Countries.includes(countryCode)? 'inches' : 'cm'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.inputBox}>
                    <View style={{flex:1, flexDirection: 'row', justifyContent: 'space-between'}}>
                      <TextInput
                      value={height}
                      style={styles.input}
                      placeholder={'Height'}
                      placeholderTextColor={Colors.TEXT_COLOR}
                      onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ''))}
                      keyboardType={'number-pad'}
                      />
                      <Text style={{fontSize: Typography.FONT_SIZE_18, padding: 10, paddingRight: 20 }}>
                      {Countries.includes(countryCode)? 'Feet' : 'm'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <KeyboardAvoidingView
                  behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
                  style={styles.bgWhite}>
                    <PrimaryButton
                      onPress={onPressMeasurementBtn}
                      btnText={'Continue'}
                      // disabled={singleTree ? false : true}
                    />
                  </KeyboardAvoidingView>
                </View>
              </View>     
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };
  const renderAddNameModal = () => {
    // let specieName = isShowTreeCountModal ? speciesList[activeSpeice].nameOfTree : '';
    return (
      <Modal visible={isShowAddNameModal} transparent={true}>
        <View
          style={styles.modalBackground}>
          <View
            style={styles.inputModal}>
            {singleTree ? (
              <Image source={{uri: `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${singleTree.image}`}} style={{ alignSelf: 'center', marginVertical: 20, width: 200, height: 100 }} />
            ): 
              <Image source={placeholder_image} style={{ alignSelf: 'center', marginVertical: 20 }} />
            }
            <Header
              hideBackIcon
              subHeadingText={'Please enter the name of the plant'}
              textAlignStyle={{ textAlign: 'center' }}
            />
          </View>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          style={styles.bgWhite}>
          <View style={styles.externalInputContainer}>
            <Text style={styles.labelModal}>Name</Text>
            <TextInput
              value={name}
              style={styles.value}
              autoFocus
              placeholderTextColor={Colors.TEXT_COLOR}
              onChangeText={(text) => setName(text)}
            />
            <MCIcon
              onPress={onPressAddNameBtn}
              name={'arrow-right'}
              size={30}
              color={Colors.PRIMARY}
            />
          </View>
          <SafeAreaView />
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const onPressSaveAndContinue = (data) => {
    UpdateSpecieAndSpecieDiameter ({inventory_id: inventory.inventory_id, specie_name: data.aliases, diameter: data.diameter, height: Math.round(data.height*10)/10})
    .then(() => {
      setShowSpecies(false);
      navigation.navigate('SingleTreeOverview');
    })
    .catch(err => {
      console.log(err);
    });
  };

  const onPressContinue = () => {
    let selectedspeciesList = [];
    for (let i = 0; i < speciesList.length; i++) {
      const oneSpecie = speciesList[i];
      if (oneSpecie.treeCount) {
        oneSpecie.id = i.toString();
        selectedspeciesList.push(oneSpecie);
      }
    }
    onPressSaveAndContinueMultiple(selectedspeciesList);
    // setTimeout(() => {
    setActiveSpecie(undefined);
    setIsShowTreeCountModal(false);
    setTreeCount('');
    closeSelectSpeciesModal();
    setSpeciesList([...speciesList]);
    // }, 0)
  };

  const onPressMeasurementBtn = () => {
    // if (isNormalInteger(height) && isNormalInteger(diameter)){
      let speciesMeasurementList = [...speciesList];
      for(let specie in speciesMeasurementList){
        if (speciesMeasurementList[specie].id=== singleTree.id) {
          let selected = {aliases: speciesMeasurementList[specie].aliases, diameter: diameter, height: height};
          onPressSaveAndContinue(selected);
          setIsShowTreeMeasurementModal(false);
        }
      }
      setShowSpecies(false);
    // } else {
    //   Alert.alert(
    //     "Error",
    //     "Enter valid input",
    //     [{ text: "OK", onPress: () => console.log("OK Pressed") }],
    //     {cancelable: false}
    //   );
    // }
  };

  const onPressAddNameBtn = () => {
    let speciesNameList = [...speciesList];
    speciesNameList[specieIndex] = {...speciesNameList[specieIndex], aliases: name};
    UpdateSpecies(speciesNameList[specieIndex].aliases, speciesNameList[specieIndex].id).then(() => {
      setIsShowAddNameModal(false);
      // setSpeciesList(species);
      getAllUserSpecies();
    });
  };

  if (isCamera) {
    return <Camera handleCamera={handleCamera}/>;
  } else {
    return (
      <Modal visible= {showSpecies} animationType={'slide'}>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                
                { numberTrees === 'single' ? (
                  <Header
                  // closeIcon
                  headingText={i18next.t('label.select_species_header')}
                />
                ) : (
                  <Header
                  closeIcon
                  headingText={i18next.t('label.select_species_header')}
                  subHeadingText={i18next.t('label.select_species_sub_header')}
                />
                )
                }
                <TouchableOpacity
                  onPress={onPressSearch}
                >
                  <Text style={styles.searchText}>Search</Text>
                </TouchableOpacity>
              </View>
              {/* <FlatList
                style={{ flex: 1 }}
                data={speciesList}
                showsVerticalScrollIndicator={false}
                renderItem={renderSpeciesCard}
              /> */}
              {numberTrees === 'single' ? (
                <FlatList
                style={{ flex: 1, marginTop: 15 }}
                data={speciesList}
                showsVerticalScrollIndicator={false}
                renderItem={renderSpeciesCardSingle}
                />
              ): (
                <FlatList
                style={{ flex: 1 }}
                data={speciesList}
                showsVerticalScrollIndicator={false}
                renderItem={renderSpeciesCardMultiple}
                />
              )}
              {numberTrees === 'single'  ? (
                <PrimaryButton
                  onPress={onPressSaveBtn}
                  btnText={i18next.t('label.select_species_btn_text')}
                  disabled={singleTree ? false : true}
                />
              ) : 
                <PrimaryButton
                  onPress={onPressContinue}
                  btnText={i18next.t('label.select_species_btn_text')}
                />  
              }
            </View>
          </SafeAreaView>
          {renderAddSpeciesModal()}
          {renderTreeCountModal()}
          {renderMeasurementModal()}
          {renderAddNameModal()}
        </View>
      </Modal>
    );
  }
};
export default SelectSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
    flexDirection: 'column'
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  speciesLocalName: {
    
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_18,
  },
  speciesName: {
    
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    fontStyle: 'italic',
  },
  treeCount: {
    flex: 1,
    color: Colors.PRIMARY,
    fontSize: Typography.FONT_SIZE_16,
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
  valueAddspcies: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    flex: 1,
    paddingVertical: 10,
    paddingTop: 20
  },
  labelModal: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    // lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.PRIMARY,
    paddingTop: 15,
    paddingRight: 5
  },
  bgWhiteAdd: {
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0
  },
  searchDisplay: {
    display: 'none'
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  inputModal: {
    backgroundColor: Colors.WHITE,
    marginVertical: 30,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    padding: 0,
    marginVertical: 12,
    width: '100%',
    borderRadius: 5,
    height: 50
  },
  input: {
    flex:1,
    fontSize: Typography.FONT_SIZE_18,
    paddingLeft: 15,
    
  }
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
  { localName: 'Balché', nameOfTree: 'Cheetah' },
  { localName: 'Balché', nameOfTree: 'Chicken' },
  { localName: 'Balché', nameOfTree: 'Chimpanzee' },
  { localName: 'Balché', nameOfTree: 'Chinchilla' },
  { localName: 'Balché', nameOfTree: 'Chough' },
  { localName: 'Balché', nameOfTree: 'Clam' },
  { localName: 'Balché', nameOfTree: 'Cobra' },
  { localName: 'Balché', nameOfTree: 'Cockroach' },
  { localName: 'Balché', nameOfTree: 'Cod' },
  { localName: 'Balché', nameOfTree: 'Cormorant' },
  { localName: 'Balché', nameOfTree: 'Coyote' },
  { localName: 'Balché', nameOfTree: 'Crab' },
  { localName: 'Balché', nameOfTree: 'Crane' },
  { localName: 'Balché', nameOfTree: 'Crocodile' },
  { localName: 'Balché', nameOfTree: 'Crow' },
  { localName: 'Balché', nameOfTree: 'Curlew' },
  { localName: 'Balché', nameOfTree: 'Deer' },
  { localName: 'Balché', nameOfTree: 'Dinosaur' },
  { localName: 'Balché', nameOfTree: 'Dog' },
  { localName: 'Balché', nameOfTree: 'Dogfish' },
  { localName: 'Balché', nameOfTree: 'Dolphin' },
  { localName: 'Balché', nameOfTree: 'Dotterel' },
  { localName: 'Balché', nameOfTree: 'Dove' },
  { localName: 'Balché', nameOfTree: 'Dragonfly' },
  { localName: 'Balché', nameOfTree: 'Duck' },
  { localName: 'Balché', nameOfTree: 'Dugong' },
  { localName: 'Balché', nameOfTree: 'Dunlin' },
  { localName: 'Balché', nameOfTree: 'Eagle' },
  { localName: 'Balché', nameOfTree: 'Echidna' },
  { localName: 'Balché', nameOfTree: 'Eel' },
  { localName: 'Balché', nameOfTree: 'Eland' },
  { localName: 'Balché', nameOfTree: 'Elephant' },
  { localName: 'Balché', nameOfTree: 'Elk' },
  { localName: 'Balché', nameOfTree: 'Emu' },
  { localName: 'Balché', nameOfTree: 'Falcon' },
  { localName: 'Balché', nameOfTree: 'Ferret' },
  { localName: 'Balché', nameOfTree: 'Finch' },
  { localName: 'Balché', nameOfTree: 'Fish' },
  { localName: 'Balché', nameOfTree: 'Flamingo' },
  { localName: 'Balché', nameOfTree: 'Fly' },
  { localName: 'Balché', nameOfTree: 'Fox' },
  { localName: 'Balché', nameOfTree: 'Frog' },
  { localName: 'Balché', nameOfTree: 'Gaur' },
  { localName: 'Balché', nameOfTree: 'Gazelle' },
  { localName: 'Balché', nameOfTree: 'Gerbil' },
  { localName: 'Balché', nameOfTree: 'Giraffe' },
  { localName: 'Balché', nameOfTree: 'Gnat' },
  { localName: 'Balché', nameOfTree: 'Gnu' },
  { localName: 'Balché', nameOfTree: 'Goat' },
  { localName: 'Balché', nameOfTree: 'Goldfinch' },
  { localName: 'Balché', nameOfTree: 'Goldfish' },
  { localName: 'Balché', nameOfTree: 'Goose' },
  { localName: 'Balché', nameOfTree: 'Gorilla' },
  { localName: 'Balché', nameOfTree: 'Goshawk' },
  { localName: 'Balché', nameOfTree: 'Grasshopper' },
  { localName: 'Balché', nameOfTree: 'Grouse' },
  { localName: 'Balché', nameOfTree: 'Guanaco' },
  { localName: 'Balché', nameOfTree: 'Gull' },
  { localName: 'Balché', nameOfTree: 'Hamster' },
  { localName: 'Balché', nameOfTree: 'Hare' },
  { localName: 'Balché', nameOfTree: 'Hawk' },
  { localName: 'Balché', nameOfTree: 'Hedgehog' },
  { localName: 'Balché', nameOfTree: 'Heron' },
  { localName: 'Balché', nameOfTree: 'Herring' },
  { localName: 'Balché', nameOfTree: 'Hippopotamus' },
  { localName: 'Balché', nameOfTree: 'Hornet' },
  { localName: 'Balché', nameOfTree: 'Horse' },
  { localName: 'Balché', nameOfTree: 'Human' },
  { localName: 'Balché', nameOfTree: 'Hummingbird' },
  { localName: 'Balché', nameOfTree: 'Hyena' },
  { localName: 'Balché', nameOfTree: 'Ibex' },
  { localName: 'Balché', nameOfTree: 'Ibis' },
  { localName: 'Balché', nameOfTree: 'Jackal' },
  { localName: 'Balché', nameOfTree: 'Jaguar' },
  { localName: 'Balché', nameOfTree: 'Jay' },
  { localName: 'Balché', nameOfTree: 'Jellyfish' },
  { localName: 'Balché', nameOfTree: 'Kangaroo' },
  { localName: 'Balché', nameOfTree: 'Kingfisher' },
  { localName: 'Balché', nameOfTree: 'Koala' },
  { localName: 'Balché', nameOfTree: 'Kookabura' },
  { localName: 'Balché', nameOfTree: 'Kouprey' },
  { localName: 'Balché', nameOfTree: 'Kudu' },
  { localName: 'Balché', nameOfTree: 'Lapwing' },
  { localName: 'Balché', nameOfTree: 'Lark' },
  { localName: 'Balché', nameOfTree: 'Lemur' },
  { localName: 'Balché', nameOfTree: 'Leopard' },
  { localName: 'Balché', nameOfTree: 'Lion' },
  { localName: 'Balché', nameOfTree: 'Llama' },
  { localName: 'Balché', nameOfTree: 'Lobster' },
  { localName: 'Balché', nameOfTree: 'Locust' },
  { localName: 'Balché', nameOfTree: 'Loris' },
  { localName: 'Balché', nameOfTree: 'Louse' },
  { localName: 'Balché', nameOfTree: 'Lyrebird' },
  { localName: 'Balché', nameOfTree: 'Magpie' },
  { localName: 'Balché', nameOfTree: 'Mallard' },
  { localName: 'Balché', nameOfTree: 'Manatee' },
  { localName: 'Balché', nameOfTree: 'Mandrill' },
  { localName: 'Balché', nameOfTree: 'Mantis' },
  { localName: 'Balché', nameOfTree: 'Marten' },
  { localName: 'Balché', nameOfTree: 'Meerkat' },
  { localName: 'Balché', nameOfTree: 'Mink' },
  { localName: 'Balché', nameOfTree: 'Mole' },
  { localName: 'Balché', nameOfTree: 'Mongoose' },
  { localName: 'Balché', nameOfTree: 'Monkey' },
  { localName: 'Balché', nameOfTree: 'Moose' },
  { localName: 'Balché', nameOfTree: 'Mosquito' },
  { localName: 'Balché', nameOfTree: 'Mouse' },
  { localName: 'Balché', nameOfTree: 'Mule' },
  { localName: 'Balché', nameOfTree: 'Narwhal' },
  { localName: 'Balché', nameOfTree: 'Newt' },
  { localName: 'Balché', nameOfTree: 'Nightingale' },
  { localName: 'Balché', nameOfTree: 'Octopus' },
  { localName: 'Balché', nameOfTree: 'Okapi' },
  { localName: 'Balché', nameOfTree: 'Opossum' },
  { localName: 'Balché', nameOfTree: 'Oryx' },
  { localName: 'Balché', nameOfTree: 'Ostrich' },
  { localName: 'Balché', nameOfTree: 'Otter' },
  { localName: 'Balché', nameOfTree: 'Owl' },
  { localName: 'Balché', nameOfTree: 'Oyster' },
  { localName: 'Balché', nameOfTree: 'Panther' },
  { localName: 'Balché', nameOfTree: 'Parrot' },
  { localName: 'Balché', nameOfTree: 'Partridge' },
  { localName: 'Balché', nameOfTree: 'Peafowl' },
  { localName: 'Balché', nameOfTree: 'Pelican' },
  { localName: 'Balché', nameOfTree: 'Penguin' },
  { localName: 'Balché', nameOfTree: 'Pheasant' },
  { localName: 'Balché', nameOfTree: 'Pig' },
  { localName: 'Balché', nameOfTree: 'Pigeon' },
  { localName: 'Balché', nameOfTree: 'Pony' },
  { localName: 'Balché', nameOfTree: 'Porcupine' },
  { localName: 'Balché', nameOfTree: 'Porpoise' },
  { localName: 'Balché', nameOfTree: 'Quail' },
  { localName: 'Balché', nameOfTree: 'Quelea' },
  { localName: 'Balché', nameOfTree: 'Quetzal' },
  { localName: 'Balché', nameOfTree: 'Rabbit' },
  { localName: 'Balché', nameOfTree: 'Raccoon' },
  { localName: 'Balché', nameOfTree: 'Rail' },
  { localName: 'Balché', nameOfTree: 'Ram' },
  { localName: 'Balché', nameOfTree: 'Rat' },
  { localName: 'Balché', nameOfTree: 'Raven' },
  { localName: 'Balché', nameOfTree: 'Red deer' },
  { localName: 'Balché', nameOfTree: 'Red panda' },
  { localName: 'Balché', nameOfTree: 'Reindeer' },
  { localName: 'Balché', nameOfTree: 'Rhinoceros' },
  { localName: 'Balché', nameOfTree: 'Rook' },
  { localName: 'Balché', nameOfTree: 'Salamander' },
  { localName: 'Balché', nameOfTree: 'Salmon' },
  { localName: 'Balché', nameOfTree: 'Sand Dollar' },
  { localName: 'Balché', nameOfTree: 'Sandpiper' },
  { localName: 'Balché', nameOfTree: 'Sardine' },
  { localName: 'Balché', nameOfTree: 'Scorpion' },
  { localName: 'Balché', nameOfTree: 'Seahorse' },
  { localName: 'Balché', nameOfTree: 'Seal' },
  { localName: 'Balché', nameOfTree: 'Shark' },
  { localName: 'Balché', nameOfTree: 'Sheep' },
  { localName: 'Balché', nameOfTree: 'Shrew' },
  { localName: 'Balché', nameOfTree: 'Skunk' },
  { localName: 'Balché', nameOfTree: 'Snail' },
  { localName: 'Balché', nameOfTree: 'Snake' },
  { localName: 'Balché', nameOfTree: 'Sparrow' },
  { localName: 'Balché', nameOfTree: 'Spider' },
  { localName: 'Balché', nameOfTree: 'Spoonbill' },
  { localName: 'Balché', nameOfTree: 'Squid' },
  { localName: 'Balché', nameOfTree: 'Squirrel' },
  { localName: 'Balché', nameOfTree: 'Starling' },
  { localName: 'Balché', nameOfTree: 'Stingray' },
  { localName: 'Balché', nameOfTree: 'Stinkbug' },
  { localName: 'Balché', nameOfTree: 'Stork' },
  { localName: 'Balché', nameOfTree: 'Swallow' },
  { localName: 'Balché', nameOfTree: 'Swan' },
  { localName: 'Balché', nameOfTree: 'Tapir' },
  { localName: 'Balché', nameOfTree: 'Tarsier' },
  { localName: 'Balché', nameOfTree: 'Termite' },
  { localName: 'Balché', nameOfTree: 'Tiger' },
  { localName: 'Balché', nameOfTree: 'Toad' },
  { localName: 'Balché', nameOfTree: 'Trout' },
  { localName: 'Balché', nameOfTree: 'Turkey' },
  { localName: 'Balché', nameOfTree: 'Turtle' },
  { localName: 'Balché', nameOfTree: 'Viper' },
  { localName: 'Balché', nameOfTree: 'Vulture' },
  { localName: 'Balché', nameOfTree: 'Wallaby' },
  { localName: 'Balché', nameOfTree: 'Walrus' },
  { localName: 'Balché', nameOfTree: 'Wasp' },
  { localName: 'Balché', nameOfTree: 'Weasel' },
  { localName: 'Balché', nameOfTree: 'Whale' },
  { localName: 'Balché', nameOfTree: 'Wildcat' },
  { localName: 'Balché', nameOfTree: 'Wolf' },
  { localName: 'Balché', nameOfTree: 'Wolverine' },
  { localName: 'Balché', nameOfTree: 'Wombat' },
  { localName: 'Balché', nameOfTree: 'Woodcock' },
  { localName: 'Balché', nameOfTree: 'Woodpecker' },
  { localName: 'Balché', nameOfTree: 'Worm' },
  { localName: 'Balché', nameOfTree: 'Wren' },
  { localName: 'Balché', nameOfTree: 'Yak' },
  { localName: 'Balché', nameOfTree: 'Zebra' },
];
