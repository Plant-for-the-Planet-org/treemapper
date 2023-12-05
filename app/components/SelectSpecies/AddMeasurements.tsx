import {
  View,
  Keyboard,
  Platform,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';

import {
  getInventory,
  updateInventory,
  updateSpecieAndMeasurements,
} from '../../repositories/inventory';
import { Colors } from '../../styles';
import dbLog from '../../repositories/logs';
import MeasurementInputs from '../Common/MeasurementInputs';
import { InventoryContext } from '../../reducers/inventory';
import { getUserInformation } from '../../repositories/user';
import { AlertModal, Header, PrimaryButton } from '../Common';
import { LogTypes, nonISUCountries } from '../../utils/constants';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import { measurementValidation } from '../../utils/validations/measurements';
import { getConvertedDiameter, getConvertedHeight } from '../../utils/measurements';

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
          { name: 'NavDrawer' },
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
  const handlePressSecBtn = () => {
    setShowIncorrectRatioAlert(false);
    addMeasurements();
  };
  const handlePressPrimary = () => setShowIncorrectRatioAlert(false);

  const handleBack = () => navigation.goBack();

  return (
    <View style={styles.flex1}>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Header
              onBackPress={handleBack}
              headingText={i18next.t('label.select_species_add_measurements')}
            />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'padding' : undefined}
            style={styles.flex1}>
            <View style={styles.measureContainer}>
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
          showSecondaryButton
          visible={showIncorrectRatioAlert}
          onPressPrimaryBtn={handlePressPrimary}
          onPressSecondaryBtn={handlePressSecBtn}
          heading={i18next.t('label.not_optimal_ratio')}
          secondaryBtnText={i18next.t('label.continue')}
          primaryBtnText={i18next.t('label.check_again')}
          message={i18next.t('label.not_optimal_ratio_message')}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  measureContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
});
