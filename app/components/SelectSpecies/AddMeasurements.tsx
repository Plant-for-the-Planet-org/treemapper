import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  SafeAreaView,
  Switch,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
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
import i18next from 'i18next';
import { Colors, Typography } from '../../styles';
import { Header, PrimaryButton } from '../Common';
import OutlinedInput from '../Common/OutlinedInput';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { InventoryContext } from '../../reducers/inventory';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import {
  getInventory,
  updateInventory,
  updateSpecieAndMeasurements,
} from '../../repositories/inventory';
import { getUserInformation } from '../../repositories/user';
import dbLog from '../../repositories/logs';

export const AddMeasurements = ({ setIsShowTreeMeasurement }) => {
  const [singleTreeSpecie, setSingleTreeSpecie] = useState('');
  const [diameter, setDiameter] = useState('');
  const [diameterError, setDiameterError] = useState('');
  const [height, setHeight] = useState('');
  const [heightError, setHeightError] = useState('');
  const [tagId, setTagId] = useState('');
  const [inventory, setInventory] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isTagIdPresent, setIsTagIdPresent] = useState(true);
  const [tagIdError, setTagIdError] = useState('');
  const [isSampleTree, setIsSampleTree] = useState(false);

  const { state } = useContext(InventoryContext);
  const navigation = useNavigation();
  const heightRef = React.createRef();

  useEffect(() => {
    Inventory();
    Country();
  }, []);

  useEffect(() => {
    setIsSampleTree(inventory?.status === INCOMPLETE_SAMPLE_TREE);
  }, [inventory]);

  useEffect(() => {
    setDiameter('');
    setHeight('');
    setTagId('');
  }, []);

  const Inventory = () => {
    if (state.inventoryID) {
      getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
        setInventory(inventory);

        if (inventory.species.length > 0 && inventory.specieDiameter == null) {
          setSingleTreeSpecie(inventory.species[0]);
        }
      });
    }
  };

  const Country = () => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  };
  const dimensionRegex = /^\d{0,5}(\.\d{1,3})?$/;

  const onPressMeasurementBtn = () => {
    Keyboard.dismiss();
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
    setIsShowTreeMeasurement(false);
    setDiameter('');
    setHeight('');
    setTagId('');
    navigation.dispatch(
      CommonActions.reset({
        index: 2,
        routes: [
          { name: 'MainScreen' },
          { name: 'TreeInventory' },
          { name: 'SingleTreeOverview', params: { totalSampleTrees: inventory.sampleTreesCount } },
        ],
      }),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
            <Header
              headingText={i18next.t('label.select_species_add_measurements')}
              onBackPress={() => {
                navigation.goBack();
              }}
            />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
              <View>
                <View style={styles.inputBox}>
                  <View>
                    <OutlinedInput
                      value={diameter}
                      onChangeText={(text: any) => {
                        setDiameterError('');
                        setDiameter(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
                      }}
                      label={i18next.t('label.select_species_diameter')}
                      keyboardType={'decimal-pad'}
                      rightText={
                        nonISUCountries.includes(countryCode)
                          ? i18next.t('label.select_species_inches')
                          : 'cm'
                      }
                      error={diameterError}
                      returnKeyType={'next'}
                      onSubmitEditing={() => heightRef.current.focus()}
                    />
                  </View>
                </View>

                <View style={styles.inputBox}>
                  <View>
                    <OutlinedInput
                      value={height}
                      onChangeText={(text: any) => {
                        setHeightError('');
                        setHeight(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
                      }}
                      label={i18next.t('label.select_species_height')}
                      keyboardType={'decimal-pad'}
                      rightText={
                        nonISUCountries.includes(countryCode)
                          ? i18next.t('label.select_species_feet')
                          : 'm'
                      }
                      error={heightError}
                      ref={heightRef}
                    />
                  </View>
                </View>

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
                      <View>
                        <OutlinedInput
                          value={tagId}
                          label={i18next.t('label.select_species_tree_tag')}
                          onChangeText={(text) => {
                            setTagIdError('');
                            setTagId(text);
                          }}
                          error={tagIdError}
                        />
                      </View>
                    </View>
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
  );
};

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
    marginTop: 24,
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginRight: 10,
    flex: 1,
  },
});
