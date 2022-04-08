import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import { nanoid } from 'nanoid';
import React, { createRef, useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  getBrand,
  getManufacturer,
  getModel,
  getSystemName,
  getSystemVersion,
} from 'react-native-device-info';
import { setRemeasurementId } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory } from '../../repositories/inventory';
import { addPlantLocationHistory } from '../../repositories/plantLocationHistory';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { nonISUCountries } from '../../utils/constants';
import { measurementValidation } from '../../utils/validations/measurements';
import { AlertModal, Header, PrimaryButton } from '../../components/Common';
import CustomDropDownPicker from '../../components/Common/Dropdown/CustomDropDownPicker';
import MeasurementInputs from '../../components/Common/MeasurementInputs';
import { INCOMPLETE } from '../../utils/inventoryConstants';

type Props = {};

export default function RemeasurementForm({}: Props) {
  const [diameter, setDiameter] = useState('');
  const [diameterError, setDiameterError] = useState('');
  const [height, setHeight] = useState('');
  const [heightError, setHeightError] = useState('');
  const [inventory, setInventory] = useState<any>();
  const [isNonISUCountry, setIsNonISUCountry] = useState(false);

  const [isTreeAlive, setIsTreeAlive] = useState<boolean>(true);
  const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState<boolean>(false);
  const [deadReason, setDeadReason] = useState<string>('');
  const [showReasonOptions, setShowReasonOptions] = useState<boolean>(false);

  const diameterRef = createRef();

  const navigation = useNavigation();

  const { state, dispatch } = useContext(InventoryContext);

  // reasons to show if the tree is dead
  const deadReasonOptions = [
    {
      label: i18next.t('label.flood'),
      value: 'flood',
    },
    {
      label: i18next.t('label.fire'),
      value: 'fire',
    },
    {
      label: i18next.t('label.drought'),
      value: 'drought',
    },
    {
      label: i18next.t('label.other'),
      value: 'other',
    },
  ];

  useEffect(() => {
    fetchInventory();
    setCountry();
  }, []);

  const fetchInventory = () => {
    if (state.inventoryID) {
      getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
        setInventory(inventoryData);
      });
    }
  };

  const setCountry = () => {
    getUserInformation().then(data => {
      setIsNonISUCountry(nonISUCountries.includes(data.country));
    });
  };

  const handleHeightChange = (text: string) => {
    setHeightError('');
    setHeight(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  };

  const handleDiameterChange = (text: string) => {
    setDiameterError('');
    setDiameter(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  };

  // handles the button press and checks if the values are valid and if so, saves the data
  const onPressMeasurementBtn = () => {
    Keyboard.dismiss();
    const validationObject = measurementValidation(height, diameter, isNonISUCountry);
    const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;

    setDiameterError(diameterErrorMessage);
    setHeightError(heightErrorMessage);

    if (isRatioCorrect) {
      addMeasurements();
    } else {
      setShowIncorrectRatioAlert(true);
    }
  };

  // adds height, diameter or deadReason in DB by checking the tree type
  // and then navigates to the next screen i.e. [TakePicture]
  const addMeasurements = async () => {
    // app data to be attached with the measurement
    const appAdditionalDetails = {
      deviceBrand: getBrand(),
      deviceModel: getModel(),
      deviceSystemName: getSystemName(),
      deviceSystemVersion: getSystemVersion(),
      deviceManufacturer: await getManufacturer(),
    };

    const remeasurementId = nanoid();

    // preparation of data which is to be stores in palnt locaiton history
    let historyData: any = {
      id: remeasurementId,
      eventDate: new Date(),
      appMetadata: JSON.stringify(appAdditionalDetails),
    };

    // adds height and diameter to the history data if tree is alive
    // else adds dead reason to the history data
    if (isTreeAlive) {
      historyData = {
        ...historyData,
        height: Number(height),
        diameter: Number(diameter),
      };
    } else {
      historyData = {
        ...historyData,
        deadReason: deadReason,
      };
    }

    await addPlantLocationHistory({
      inventoryId: state.inventoryID || '',
      samplePlantLocationIndex: state.samplePlantLocationIndex,
      historyData: {
        ...historyData,
        dataStatus: INCOMPLETE,
        eventName: 'measurement',
        // adds locationId to the history data depending on the tree type
        parentId:
          state.samplePlantLocationIndex || state.samplePlantLocationIndex === 0
            ? inventory.sampleTrees[state.samplePlantLocationIndex].locationId
            : inventory.locationId,
      },
    });
    setRemeasurementId(remeasurementId)(dispatch);
    navigation.navigate('TakePicture');
  };

  const handleIsTreeAliveChange = () => {
    setIsTreeAlive(!isTreeAlive);
    setHeight('');
    setDiameter('');
    setDeadReason('');
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <View style={{ flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 24 }}>
            {/* header shows the HID and Species */}
            <Header
              headingText={i18next.t('label.remeasurement')}
              onBackPress={() => {
                navigation.goBack();
              }}
              subHeadingText={`HID: ${inventory?.hid}`}
            />
            {inventory?.species.length > 0 ? (
              <Text style={styles.subHeadingText}>
                {i18next.t('label.tree_review_specie')}: {inventory.species[0].aliases}
              </Text>
            ) : (
              []
            )}
          </View>

          {/* shows the form layout */}
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
              <View>
                {/* Toggle - used to decide whether the tree is alive or not */}
                {/* and toggles the form field based on same */}
                <View style={[styles.switchContainer, { marginBottom: 24 }]}>
                  <Text style={styles.switchText}>{i18next.t('label.tree_is_still_alive')}</Text>
                  <Switch
                    trackColor={{ false: '#767577', true: '#d4e7b1' }}
                    thumbColor={isTreeAlive ? Colors.PRIMARY : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => handleIsTreeAliveChange()}
                    value={isTreeAlive}
                  />
                </View>

                {/* If the tree is alive then shows height and diameter input fields */}
                {/* Else shows the dead reason dropdown */}
                {isTreeAlive ? (
                  <MeasurementInputs
                    height={height}
                    heightError={heightError}
                    handleHeightChange={handleHeightChange}
                    diameter={diameter}
                    diameterError={diameterError}
                    handleDiameterChange={handleDiameterChange}
                    diameterRef={diameterRef}
                    isNonISUCountry={isNonISUCountry}
                  />
                ) : (
                  <View style={styles.inputBox}>
                    <Text style={styles.reasonText}>{i18next.t('label.dead_reason')}</Text>
                    <CustomDropDownPicker
                      items={deadReasonOptions}
                      open={showReasonOptions}
                      setOpen={setShowReasonOptions}
                      value={deadReason}
                      setValue={setDeadReason}
                      zIndex={3000}
                      zIndexInverse={1000}
                    />
                  </View>
                )}
              </View>

              {/* shows the button to save the data */}
              <View>
                <PrimaryButton
                  onPress={onPressMeasurementBtn}
                  btnText={i18next.t('label.select_species_continue')}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* shows the modal if the ratio between height and diameter is not optimal */}
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
}

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
    fontSize: Typography.FONT_SIZE_14,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
  reasonText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: 8,
  },
});
