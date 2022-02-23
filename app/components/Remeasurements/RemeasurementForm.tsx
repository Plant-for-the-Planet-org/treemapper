import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
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
import { v4 as uuidv4 } from 'uuid';
import { InventoryContext } from '../../reducers/inventory';
import { addPlantLocationHistory, getInventory } from '../../repositories/inventory';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { nonISUCountries } from '../../utils/constants';
import { measurementValidation } from '../../utils/validations/measurements';
import { AlertModal, Header, PrimaryButton } from '../Common';
import MeasurementInputs from '../Common/MeasurementInputs';
import OutlinedInput from '../Common/OutlinedInput';

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

  const diameterRef = createRef();

  const navigation = useNavigation();

  const { state } = useContext(InventoryContext);

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

  // adds height, diameter and tag in DB by checking the tree type
  const addMeasurements = async () => {
    const appAdditionalDetails = {
      deviceBrand: getBrand(),
      deviceModel: getModel(),
      deviceSystemName: getSystemName(),
      deviceSystemVersion: getSystemVersion(),
      deviceManufacturer: await getManufacturer(),
    };
    let historyData: any = {
      id: uuidv4(),
      eventDate: new Date(),
      appMetadata: JSON.stringify(appAdditionalDetails),
    };
    if (isTreeAlive) {
      historyData = {
        ...historyData,
        speciesHeight: height,
        speciesDiameter: diameter,
      };
    } else {
      historyData = {
        ...historyData,
        deadReason: deadReason,
      };
    }

    await addPlantLocationHistory({
      inventoryId: state.inventoryID,
      samplePlantLocationIndex: state.samplePlantLocationIndex,
      historyData,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <View style={{ flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 24 }}>
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
                <View style={[styles.switchContainer, { marginBottom: 24 }]}>
                  <Text style={styles.switchText}>{i18next.t('label.tree_is_still_alive')}</Text>
                  <Switch
                    trackColor={{ false: '#767577', true: '#d4e7b1' }}
                    thumbColor={isTreeAlive ? Colors.PRIMARY : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => setIsTreeAlive(!isTreeAlive)}
                    value={isTreeAlive}
                  />
                </View>

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
                    <View>
                      <OutlinedInput
                        value={height}
                        onChangeText={(text: string) => setDeadReason(text)}
                        label={i18next.t('label.dead_reason')}
                        autoFocus
                      />
                    </View>
                  </View>
                )}
              </View>

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
});
