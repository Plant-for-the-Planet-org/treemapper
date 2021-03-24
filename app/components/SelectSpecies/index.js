import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Typography } from '_styles';
import { InventoryContext } from '../../reducers/inventory';
import {
  getInventory,
  updateInventory,
  updateSingleTreeSpecie,
  updateSpecieAndMeasurements,
} from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { getUserInformation } from '../../repositories/user';
import {
  diameterMaxCm,
  diameterMaxInch,
  diameterMinCm,
  diameterMinInch,
  footToMeter,
  heightMaxFoot,
  heightMaxM,
  heightMinFoot,
  heightMinM,
  inchToCm,
  LogTypes,
  nonISUCountries,
} from '../../utils/constants';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import { Header, PrimaryButton } from '../Common';
import ManageSpecies from '../ManageSpecies';

const SelectSpecies = () => {
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
  const [isTagIdPresent, setIsTagIdPresent] = useState(false);
  const [tagIdError, setTagIdError] = useState('');
  const [isSampleTree, setIsSampleTree] = useState(false);

  const { state } = useContext(InventoryContext);
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

  useEffect(() => {
    setDiameter('');
    setHeight('');
    setTagId('');
  }, []);

  const Inventory = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      setInventory(inventory);

      if (inventory.species.length > 0 && inventory.specieDiameter == null) {
        setIsShowTreeMeasurementModal(true);
        setSingleTreeSpecie(inventory.species[0]);
      }
      setRegistrationType(inventory.treeType);
    });
  };

  const Country = () => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  };

  const onPressSaveBtn = (item) => {
    setSingleTreeSpecie({
      id: item.guid,
      aliases: item.scientificName,
      treeCount: 1,
    });
    setIsShowTreeMeasurementModal(true);
  };

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
                          {nonISUCountries.includes(countryCode)
                            ? i18next.t('label.select_species_inches')
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
                          {nonISUCountries.includes(countryCode)
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

  const dimensionRegex = /^\d{0,5}(\.\d{1,3})?$/;

  const onPressMeasurementBtn = () => {
    let isDiameterValid = false;
    let isHeightValid = false;
    let isTagIdValid = false;

    const diameterMinValue = nonISUCountries.includes(countryCode)
      ? diameterMinInch
      : diameterMinCm;
    const diameterMaxValue = nonISUCountries.includes(countryCode)
      ? diameterMaxInch
      : diameterMaxCm;

    const heightMinValue = nonISUCountries.includes(countryCode) ? heightMinFoot : heightMinM;
    const heightMaxValue = nonISUCountries.includes(countryCode) ? heightMaxFoot : heightMaxM;

    // sets diameter error if diameter less than 0.1 or is invalid input
    if (!diameter || Number(diameter) < diameterMinValue || Number(diameter) > diameterMaxValue) {
      setDiameterError(
        i18next.t('label.select_species_diameter_more_than_error', {
          minValue: diameterMinValue,
          maxValue: diameterMaxValue,
        }),
      );
    } else if (!dimensionRegex.test(diameter)) {
      setDiameterError(i18next.t('label.select_species_diameter_invalid'));
    } else {
      setDiameterError('');
      isDiameterValid = true;
    }

    // sets height error if height less than 0.1 or is invalid input
    if (!height || Number(height) < heightMinValue || Number(height) > heightMaxValue) {
      setHeightError(
        i18next.t('label.select_species_height_more_than_error', {
          minValue: heightMinValue,
          maxValue: heightMaxValue,
        }),
      );
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

      const convertedDiameter = nonISUCountries.includes(countryCode)
        ? Number(diameter) * inchToCm
        : Number(diameter);

      const convertedHeight = nonISUCountries.includes(countryCode)
        ? Number(height) * footToMeter
        : Number(height);

      if (!isSampleTree) {
        updateSpecieAndMeasurements({
          inventoryId: inventory.inventory_id,
          species: [singleTreeSpecie],
          diameter: convertedDiameter,
          height: convertedHeight,
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
        updatedSampleTrees[inventory.completedSampleTreesCount].specieDiameter = convertedDiameter;
        updatedSampleTrees[inventory.completedSampleTreesCount].specieHeight = convertedHeight;
        if (tagId) {
          updatedSampleTrees[inventory.completedSampleTreesCount].tagId = tagId;
        }

        updateInventory({
          inventory_id: inventory.inventory_id,
          inventoryData: {
            sampleTrees: [...updatedSampleTrees],
          },
        })
          .then(() => {
            dbLog.info({
              logType: LogTypes.INVENTORY,
              message: `Successfully added measurements for sample tree #${
                inventory.completedSampleTreesCount + 1
              } having inventory_id: ${inventory.inventory_id}`,
            });
            postMeasurementUpdate();
          })
          .catch((err) => {
            dbLog.error({
              logType: LogTypes.INVENTORY,
              message: `Error while adding measurements for sample tree #${
                inventory.completedSampleTreesCount + 1
              } having inventory_id: ${inventory.inventory_id}`,
              logStack: JSON.stringify(err),
            });
            console.error(
              `Error while adding measurements for sample tree #${
                inventory.completedSampleTreesCount + 1
              } having inventory_id: ${inventory.inventory_id}`,
              err,
            );
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
          setIsShowTreeMeasurementModal(true);
        })
        .catch((err) => {
          dbLog.error({
            logType: LogTypes.INVENTORY,
            message: `Error while adding specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
            logStack: JSON.stringify(err),
          });
          console.error(
            `Error while adding specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
            err,
          );
        });
    }
  };

  return (
    <>
      <ManageSpecies
        onPressSpeciesSingle={onPressSaveBtn}
        onPressBack={() => navigation.goBack()}
        registrationType={registrationType}
        addSpecieToInventory={addSpecieToInventory}
        isSampleTree={isSampleTree}
      />
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
