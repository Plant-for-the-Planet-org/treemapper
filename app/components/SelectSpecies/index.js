import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '_styles';
import { APIConfig } from '../../actions/Config';
import { SpeciesListData, UpdateSpecies, UpdateSpeciesImage } from '../../actions/UploadInventory';
import { getUserInformation } from '../../repositories/user';
import { checkCircle, checkCircleFill, placeholder_image, tree } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { SpeciesContext } from '../../reducers/species';
import { getInventory, updateSpecieAndSpecieDiameter } from '../../repositories/inventory';
import AddSpeciesModal from '../AddSpecies';
import { Header, PrimaryButton } from '../Common';
import Camera from '../Common/Camera';
import { setMultipleTreesSpeciesList } from '../../actions/species';
import ManageSpecies from '../ManageSpecies';
import { getAllSpecies } from '../../repositories/species';

const SelectSpecies = ({
  visible,
  closeSelectSpeciesModal,
  speciess,
  route,
  invent,
  onPressSaveAndContinueMultiple,
}) => {
  const [isShowTreeCountModal, setIsShowTreeCountModal] = useState(false);
  const [treeCount, setTreeCount] = useState('');
  const [activeSpecie, setActiveSpecie] = useState(undefined);
  const [singleTree, setSingleTree] = useState(null);
  const [isShowTreeMeasurementModal, setIsShowTreeMeasurementModal] = useState(false);
  const [diameter, setDiameter] = useState(null);
  const [height, setHeight] = useState(null);
  const [speciesList, setSpeciesList] = useState(null);
  const navigation = useNavigation();
  const [showSpecies, setShowSpecies] = useState(visible);
  const [inventory, setInventory] = useState(null);
  const isFocused = useIsFocused();
  const [registrationType, setRegistrationType] = useState(null);
  const [countryCode, setCountryCode] = useState('');
  const [index, setIndex] = useState(undefined);
  const { state } = useContext(InventoryContext);
  const { state: speciesState, dispatch: speciesDispatch } = useContext(SpeciesContext);

  useEffect(() => {
    let species;
    let inventory;
    if (route !== undefined) {
      inventory = route.params.inventory;
      species = route.params.inventory.species;
    } else {
      inventory = invent;
      species = invent.species;
    }

    getAllSpecies().then((data) => {
      if (data && species) {
        for (const specie of species) {
          data[specie.id].treeCount = specie.treeCount;
        }
        setMultipleTreesSpeciesList(data)(speciesDispatch);
      }
    });

    setRegistrationType(inventory.tree_type);

    Inventory();
    Country();
  }, [navigation, isFocused]);

  useEffect(() => {
    if (route && route.params && route.params.visible) {
      setShowSpecies(route.params.visible);
    } else {
      setShowSpecies(visible);
    }
  }, [visible, route, navigation]);

  useEffect(() => {
    setDiameter('');
    setHeight('');
  }, []);

  const Inventory = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      inventory.species = Object.values(inventory.species);
      setInventory(inventory);
      // setTreeType(inventory.locate_tree);
      setRegistrationType(inventory.tree_type);
    });
  };

  const Country = () => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  };

  const onPressSpecie = (item, index) => {
    if (item.treeCount) {
      let list = speciesState.multipleTreesSpecies;
      list[index].treeCount = undefined;
      console.log('\n\nonPressSpecie list', list);
      setMultipleTreesSpeciesList(list)(speciesDispatch);
    } else {
      setActiveSpecie(item);
      setIndex(index);
      setIsShowTreeCountModal(true);
    }
  };

  const onPressSaveBtn = (item) => {
    setSingleTree(item);
    console.log('onPressSpecies Save', item);
    setIsShowTreeMeasurementModal(true);
  };

  const onPressTreeCountNextBtn = () => {
    let speciesListClone = [...speciesState.multipleTreesSpecies];
    let specie = speciesListClone[index];
    specie.treeCount = Number(treeCount) ? treeCount : undefined;
    speciesListClone.splice(index, 1, specie);

    setIsShowTreeCountModal(false);
    setTreeCount(0);
    setMultipleTreesSpeciesList([...speciesListClone])(speciesDispatch);
  };

  const renderTreeCountModal = () => {
    let specieName = isShowTreeCountModal ? activeSpecie.scientificName : '';
    return (
      <Modal visible={isShowTreeCountModal} transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.inputModal}>
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
              onChangeText={(text) => setTreeCount(text.replace(/[^0-9]/g, ''))}
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

  const Countries = ['US', 'LR', 'MM'];

  const renderMeasurementModal = () => {
    return (
      <Modal visible={isShowTreeMeasurementModal} animationType={'slide'}>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 10 }}>
                <Header headingText={i18next.t('label.select_species_add_measurements')} />
              </View>
              <KeyboardAvoidingView
                behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                  <View>
                    <View style={styles.inputBox}>
                      <View
                        style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextInput
                          value={diameter}
                          style={styles.input}
                          autoFocus
                          placeholder={i18next.t('label.select_species_diameter')}
                          placeholderTextColor={Colors.TEXT_COLOR}
                          onChangeText={(text) => setDiameter(text.replace(/[^0-9.]/g, ''))}
                          keyboardType={'decimal-pad'}
                        />
                        <Text
                          style={{
                            fontSize: Typography.FONT_SIZE_18,
                            padding: 10,
                            paddingRight: 20,
                          }}>
                          {Countries.includes(countryCode)
                            ? i18next.t('label.select_species_inch')
                            : 'cm'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.inputBox}>
                      <View
                        style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextInput
                          value={height}
                          style={styles.input}
                          placeholder={i18next.t('label.select_species_height')}
                          placeholderTextColor={Colors.TEXT_COLOR}
                          onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ''))}
                          keyboardType={'decimal-pad'}
                        />
                        <Text
                          style={{
                            fontSize: Typography.FONT_SIZE_18,
                            padding: 10,
                            paddingRight: 20,
                          }}>
                          {Countries.includes(countryCode)
                            ? i18next.t('label.select_species_feet')
                            : 'm'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View>
                    <PrimaryButton
                      onPress={onPressMeasurementBtn}
                      btnText={i18next.t('label.select_species_continue')}
                      style={{ marginBottom: 50 }}
                      // disabled={singleTree ? false : true}
                    />
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  const dimensionRegex = /^[0-9]{1,5}\.?[0-9]{0,2}$/;

  const onPressSaveAndContinue = (data) => {
    if (
      data.diameter !== '' &&
      data.height !== '' &&
      Number(data.diameter) !== 0 &&
      Number(data.height) !== 0 &&
      dimensionRegex.test(data.diameter) &&
      dimensionRegex.test(data.height)
    ) {
      updateSpecieAndSpecieDiameter({
        inventory_id: inventory.inventory_id,
        specie_name: data.aliases,
        diameter: Math.round(data.diameter * 100) / 100,
        height: Math.round(data.height * 100) / 100,
      })
        .then(() => {
          setShowSpecies(false);
          setIsShowTreeMeasurementModal(false);
          setDiameter('');
          setHeight('');
          navigation.navigate('SingleTreeOverview');
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      Alert.alert(
        i18next.t('label.select_species_error'),
        i18next.t('label.select_species_enter_valid_input'),
        [{ text: i18next.t('label.select_species_ok'), onPress: () => console.log('OK Pressed') }],
        { cancelable: false },
      );
    }
  };

  const onPressMeasurementBtn = () => {
    let selected = {
      aliases: singleTree.scientificName,
      diameter: diameter,
      height: height,
    };
    onPressSaveAndContinue(selected);
  };

  return (
    <Modal visible={showSpecies} animationType={'slide'}>
      <ManageSpecies
        onPressSpeciesSingle={onPressSaveBtn}
        onPressBack={() => navigation.goBack()}
        registrationType={registrationType}
        onPressSpeciesMultiple={onPressSpecie}
      />
      {renderTreeCountModal()}
      {renderMeasurementModal()}
    </Modal>
  );
};
export default SelectSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
    flexDirection: 'column',
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
    paddingTop: 20,
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
    paddingRight: 5,
  },
  bgWhiteAdd: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  searchDisplay: {
    display: 'none',
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
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: Typography.FONT_SIZE_18,
    paddingLeft: 15,
  },
});
