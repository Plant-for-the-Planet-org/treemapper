import { CommonActions, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import {
  getInventory,
  updateInventory,
  updateSpecieAndMeasurements,
} from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { LogTypes, nonISUCountries } from '../../utils/constants';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import { getConvertedDiameter, getConvertedHeight } from '../../utils/measurements';
import { measurementValidation } from '../../utils/validations/measurements';
import { AlertModal, Header, PrimaryButton } from '../Common';
import MeasurementInputs from '../Common/MeasurementInputs';

export const AddMeasurements = () => {
  const [singleTreeSpecie, setSingleTreeSpecie] = useState('');
  const [diameter, setDiameter] = useState('');
  const [diameterError, setDiameterError] = useState('');
  const [height, setHeight] = useState('');
  const [heightError, setHeightError] = useState('');
  const [tagId, setTagId] = useState('');
  const [inventory, setInventory] = useState<any>();
  const [isNonISUCountry, setIsNonISUCountry] = useState(false);
  const [isTagIdPresent, setIsTagIdPresent] = useState(true);
  const [tagIdError, setTagIdError] = useState('');
  const [isSampleTree, setIsSampleTree] = useState(false);

  const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState<boolean>(false);

  const { state } = useContext(InventoryContext);
  const navigation = useNavigation();
  const diameterRef = React.createRef();
  const tagIdRef = React.createRef();

  useEffect(() => {
    setIsSampleTree(inventory?.status === INCOMPLETE_SAMPLE_TREE);
  }, [inventory]);

  useEffect(() => {
    fetchInventory();
    setCountry();
  }, []);

  const fetchInventory = () => {
    if (state.inventoryID) {
      getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
        setInventory(inventoryData);

        if (inventoryData.species.length > 0 && inventoryData.specieDiameter == null) {
          setSingleTreeSpecie(inventoryData.species[0]);
        }
      });
    }
  };

  const setCountry = () => {
    getUserInformation().then(data => {
      setIsNonISUCountry(nonISUCountries.includes(data.country));
    });
  };

  const onPressMeasurementBtn = () => {
    Keyboard.dismiss();
    const validationObject = measurementValidation(height, diameter, isNonISUCountry);
    const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;

    setDiameterError(diameterErrorMessage);
    setHeightError(heightErrorMessage);
    let isTagIdValid = false;

    // checks if tag id is present and sets error accordingly
    if (isTagIdPresent && !tagId) {
      setTagIdError(i18next.t('label.select_species_tag_id_required'));
    } else {
      setTagIdError('');
      isTagIdValid = true;
    }

    // if all fields are valid then updates the specie data in DB
    if (!diameterErrorMessage && !heightErrorMessage && isTagIdValid) {
      if (isRatioCorrect) {
        addMeasurements();
      } else {
        setShowIncorrectRatioAlert(true);
      }
    }
  };

  // adds height, diameter and tag in DB by checking the tree type
  const addMeasurements = () => {
    if (!isSampleTree) {
      updateSpecieAndMeasurements({
        inventoryId: inventory.inventory_id,
        species: [singleTreeSpecie],
        diameter: getConvertedDiameter(diameter, isNonISUCountry),
        height: getConvertedHeight(height, isNonISUCountry),
        tagId,
      })
        .then(() => {
          postMeasurementUpdate();
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      let updatedSampleTrees = [...inventory.sampleTrees];
      updatedSampleTrees[inventory.completedSampleTreesCount].specieDiameter = getConvertedDiameter(
        diameter,
        isNonISUCountry,
      );
      updatedSampleTrees[inventory.completedSampleTreesCount].specieHeight = getConvertedHeight(
        height,
        isNonISUCountry,
      );
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
        .catch(err => {
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
  };

  // resets the state and navigate user to next screen
  const postMeasurementUpdate = () => {
    setShowIncorrectRatioAlert(false);
    setDiameter('');
    setHeight('');
    setTagId('');
    navigation.dispatch(
      CommonActions.reset({
        index: 2,
        routes: [
          { name: 'MainScreen' },
          { name: 'TreeInventory' },
          {
            name: 'AdditionalDataForm',
            params: isSampleTree ? { totalSampleTrees: inventory.sampleTreesCount } : {},
          },
        ],
      }),
    );
  };

  const handleHeightChange = (text: string) => {
    setHeightError('');
    setHeight(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  };

  const handleDiameterChange = (text: string) => {
    setDiameterError('');
    setDiameter(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  };
  const handleTagIdChange = (text: string) => {
    setTagIdError('');
    setTagId(text);
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
            behavior={Platform.OS == 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
              <MeasurementInputs
                height={height}
                heightError={heightError}
                handleHeightChange={handleHeightChange}
                diameter={diameter}
                diameterError={diameterError}
                handleDiameterChange={handleDiameterChange}
                diameterRef={diameterRef}
                isNonISUCountry={isNonISUCountry}
                showTagIdInput
                tagId={tagId}
                tagIdError={tagIdError}
                handleTagIdChange={handleTagIdChange}
                tagIdRef={tagIdRef}
                isTagIdPresent={isTagIdPresent}
                setIsTagIdPresent={setIsTagIdPresent}
              />

              <View>
                <PrimaryButton
                  onPress={onPressMeasurementBtn}
                  btnText={i18next.t('label.select_species_continue')}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        <AlertModal
          visible={showIncorrectRatioAlert}
          heading={i18next.t('label.not_optimal_ratio')}
          message={i18next.t('label.not_optimal_ratio_message')}
          primaryBtnText={i18next.t('label.check_again')}
          onPressPrimaryBtn={() => setShowIncorrectRatioAlert(false)}
          showSecondaryButton
          secondaryBtnText={i18next.t('label.continue')}
          onPressSecondaryBtn={() => {
            setShowIncorrectRatioAlert(false);
            addMeasurements();
          }}
        />
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
