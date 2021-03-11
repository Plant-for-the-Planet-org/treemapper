import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '_styles';
import { setMultipleTreesSpeciesList } from '../../actions/species';
import { placeholder_image } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { SpeciesContext } from '../../reducers/species';
import {
  getInventory,
  updateInventory,
  updateSpecieAndMeasurements,
} from '../../repositories/inventory';
import { getUserInformation } from '../../repositories/user';
import { Header, PrimaryButton } from '../Common';
import ManageSpecies from '../ManageSpecies';
import { updateSingleTreeSpecie } from '../../repositories/inventory';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryStatuses';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';

const SelectSpecies = () => {
  const [isShowTreeCountModal, setIsShowTreeCountModal] = useState(false);
  const [treeCount, setTreeCount] = useState('');
  const [activeSpecie, setActiveSpecie] = useState(undefined);
  const [singleTreeSpecie, setSingleTreeSpecie] = useState(null);
  const [isShowTreeMeasurementModal, setIsShowTreeMeasurementModal] = useState(false);
  const [diameter, setDiameter] = useState(null);
  const [diameterError, setDiameterError] = useState('');
  const [height, setHeight] = useState(null);
  const [heightError, setHeightError] = useState('');
  const [tagId, setTagId] = useState('');
  const [inventory, setInventory] = useState(null);
  const [registrationType, setRegistrationType] = useState(null);
  const [countryCode, setCountryCode] = useState('');
  const [index, setIndex] = useState(undefined);
  const [isTagIdPresent, setIsTagIdPresent] = useState(false);
  const [tagIdError, setTagIdError] = useState('');
  const [isSampleTree, setIsSampleTree] = useState(false);

  const { state } = useContext(InventoryContext);
  const { state: speciesState, dispatch: speciesDispatch } = useContext(SpeciesContext);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    Inventory();
    Country();
  }, []);

  useEffect(() => {
    setIsSampleTree(inventory?.status === INCOMPLETE_SAMPLE_TREE);
  }, [inventory]);

  useEffect(() => {
    if (isShowTreeMeasurementModal) {
      setDiameterError('');
      setHeightError('');
    }
  }, [isShowTreeMeasurementModal]);

  // useEffect(() => {
  //   if (route && route.params && route.params.visible) {
  //     setShowSpecies(route.params.visible);
  //   } else {
  //     setShowSpecies(visible);
  //   }
  // }, [visible, route, navigation]);

  useEffect(() => {
    setDiameter('');
    setHeight('');
    setTagId('');
  }, []);

  const Inventory = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      setInventory(inventory);

      if (inventory.species.length > 0 && inventory.species_diameter == null) {
        setIsShowTreeMeasurementModal(true);
        setSingleTreeSpecie(inventory.species[0]);
      }
      setRegistrationType(inventory.tree_type);
    });
  };

  const Country = () => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  };

  const onPressSpecie = (item, specieIndex) => {
    if (item.treeCount) {
      let list = speciesState.multipleTreesSpecies;
      list[specieIndex].treeCount = undefined;

      setMultipleTreesSpeciesList(list)(speciesDispatch);
    } else {
      setActiveSpecie(item);
      setIndex(specieIndex);
      setIsShowTreeCountModal(true);
    }
  };

  const onPressSaveBtn = (item) => {
    setSingleTreeSpecie({
      id: item.guid,
      aliases: item.scientificName,
      treeCount: 1,
    });
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

  const onPressContinue = () => {
    let selectedSpeciesList = [];
    for (let i = 0; i < speciesState.multipleTreesSpecies.length; i++) {
      const oneSpecie = speciesState.multipleTreesSpecies[i];

      if (oneSpecie.treeCount) {
        oneSpecie.id = i.toString();
        selectedSpeciesList.push(oneSpecie);
      }
    }

    if (route?.params?.onPressSaveAndContinueMultiple) {
      route.params.onPressSaveAndContinueMultiple(selectedSpeciesList);
    }

    setActiveSpecie(undefined);
    setIsShowTreeCountModal(false);
    setTreeCount('');
    navigation.goBack();
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
                <Header
                  headingText={i18next.t('label.select_species_add_measurements')}
                  onBackPress={() => {
                    setIsShowTreeMeasurementModal(false);
                  }}
                />
              </View>
              <KeyboardAvoidingView
                behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                  <View>
                    <View style={styles.inputBox}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <TextInput
                          value={diameter}
                          style={styles.input}
                          autoFocus
                          placeholder={i18next.t('label.select_species_diameter')}
                          placeholderTextColor={Colors.TEXT_COLOR}
                          onChangeText={(text) =>
                            setDiameter(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
                          }
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
                    {diameterError ? <Text style={styles.errorText}>{diameterError}</Text> : []}

                    <View style={styles.inputBox}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <TextInput
                          value={height}
                          style={styles.input}
                          placeholder={i18next.t('label.select_species_height')}
                          placeholderTextColor={Colors.TEXT_COLOR}
                          onChangeText={(text) =>
                            setHeight(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
                          }
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
                    {heightError ? <Text style={styles.errorText}>{heightError}</Text> : []}

                    <View style={styles.switchContainer}>
                      <Text style={styles.switchText}>
                        {i18next.t('label.select_species_tagged_for_identification')}
                      </Text>
                      <Switch
                        trackColor={{ false: '#767577', true: '#d4e7b1' }}
                        thumbColor={isTagIdPresent ? Colors.PRIMARY : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => setIsTagIdPresent(!isTagIdPresent)}
                        value={isTagIdPresent}
                      />
                    </View>

                    {isTagIdPresent ? (
                      <>
                        <View style={styles.inputBox}>
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}>
                            <TextInput
                              value={tagId}
                              style={styles.input}
                              placeholder={i18next.t('label.select_species_tree_tag')}
                              placeholderTextColor={Colors.TEXT_COLOR}
                              onChangeText={(text) => setTagId(text)}
                            />
                          </View>
                        </View>
                        {tagIdError ? <Text style={styles.errorText}>{tagIdError}</Text> : []}
                      </>
                    ) : (
                      []
                    )}
                  </View>

                  <View>
                    <PrimaryButton
                      onPress={onPressMeasurementBtn}
                      btnText={i18next.t('label.select_species_continue')}
                      style={{ marginBottom: 50 }}
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

  const dimensionRegex = /^\d{0,4}(\.\d{1,3})?$/;

  const onPressMeasurementBtn = () => {
    let isDiameterValid = false;
    let isHeightValid = false;
    let isTagIdValid = false;
    // sets diameter error if diameter less than 0.1 or is invalid input
    if (!diameter || Number(diameter) < 0.1) {
      setDiameterError(i18next.t('label.select_species_diameter_more_than_error'));
    } else if (!dimensionRegex.test(diameter)) {
      setDiameterError(i18next.t('label.select_species_diameter_invalid'));
    } else {
      setDiameterError('');
      isDiameterValid = true;
    }

    // sets height error if height less than 0.1 or is invalid input
    if (!height || Number(height) < 0.1) {
      setHeightError(i18next.t('label.select_species_height_more_than_error'));
    } else if (!dimensionRegex.test(height)) {
      setHeightError(i18next.t('label.select_species_height_invalid'));
    } else {
      setHeightError('');
      isHeightValid = true;
    }

    if (isTagIdPresent && !tagId) {
      setTagIdError(i18next.t('label.select_species_tag_id_required'));
    } else {
      setTagIdError('');
      isTagIdValid = true;
    }

    // if all fields are valid then updates the specie data in DB
    if (isDiameterValid && isHeightValid && isTagIdValid) {
      setDiameterError('');
      setHeightError('');
      setTagIdError('');

      if (!isSampleTree) {
        updateSpecieAndMeasurements({
          inventoryId: inventory.inventory_id,
          species: [singleTreeSpecie],
          diameter: Math.round(diameter * 100) / 100,
          height: Math.round(height * 100) / 100,
          tagId,
        })
          .then(() => {
            postMeasurementUpdate();
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        let updatedSampleTrees = [...inventory.sampleTrees];
        updatedSampleTrees[inventory.completedSampleTreesCount].specieDiameter = Number(diameter);
        updatedSampleTrees[inventory.completedSampleTreesCount].specieHeight = Number(height);
        if (tagId) {
          updatedSampleTrees[inventory.completedSampleTreesCount].tagId = tagId;
        }
        console.log('updatedSampleTrees=>>', updatedSampleTrees);

        updateInventory({
          inventory_id: inventory.inventory_id,
          inventoryData: {
            sampleTrees: [...updatedSampleTrees],
            completedSampleTreesCount: inventory.completedSampleTreesCount + 1,
          },
        })
          .then(() => {
            dbLog.info({
              logType: LogTypes.INVENTORY,
              message: `Successfully added measurements for sample tree #${
                inventory.completedSampleTreesCount + 1
              } having inventory_id: ${inventory.inventory_id}`,
            });
            console.log(
              `Successfully added measurements for sample tree #${
                inventory.completedSampleTreesCount + 1
              } having inventory_id: ${inventory.inventory_id}`,
            );
            postMeasurementUpdate();
          })
          .catch((err) => {
            console.error('Error while updating measurement in sample tree', err);
          });
      }
    }
  };

  const postMeasurementUpdate = () => {
    setIsShowTreeMeasurementModal(false);
    setDiameter('');
    setHeight('');
    setTagId('');
    navigation.dispatch(
      CommonActions.reset({
        index: 2,
        routes: [{ name: 'MainScreen' }, { name: 'TreeInventory' }, { name: 'SingleTreeOverview' }],
      }),
    );
  };

  const addSpecieToInventory = (specie) => {
    if (!isSampleTree) {
      updateSingleTreeSpecie({
        inventory_id: inventory.inventory_id,
        species: [
          {
            id: specie.guid,
            aliases: specie.scientificName,
            treeCount: 1,
          },
        ],
      });
    } else {
      let updatedSampleTrees = [...inventory.sampleTrees];
      updatedSampleTrees[inventory.completedSampleTreesCount].specieId = specie.guid;
      updatedSampleTrees[inventory.completedSampleTreesCount].specieName = specie.scientificName;
      console.log('updatedSampleTrees=>>', updatedSampleTrees);

      updateInventory({
        inventory_id: inventory.inventory_id,
        inventoryData: {
          sampleTrees: [...updatedSampleTrees],
        },
      })
        .then(() => {
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
          });
          console.log(
            `Successfully added specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
          );
          setIsShowTreeMeasurementModal(true);
        })
        .catch((err) => {
          console.error('Error while upading pic url in sample tree', err);
        });
    }
  };

  return (
    <>
      <ManageSpecies
        onPressSpeciesSingle={onPressSaveBtn}
        onPressBack={() => navigation.goBack()}
        registrationType={registrationType}
        onPressSpeciesMultiple={onPressSpecie}
        onSaveMultipleSpecies={onPressContinue}
        addSpecieToInventory={addSpecieToInventory}
        isSampleTree={isSampleTree}
      />
      {renderTreeCountModal()}
      {renderMeasurementModal()}
    </>
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
  externalInputContainer: {
    flexDirection: 'row',
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
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
  labelModal: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
    marginRight: 10,
    paddingHorizontal: 10,
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
  errorText: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginRight: 10,
    flex: 1,
  },
});
