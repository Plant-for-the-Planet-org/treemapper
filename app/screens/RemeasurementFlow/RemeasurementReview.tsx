import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import Header from '../../components/Common/Header';
import InputModal from '../../components/Common/InputModal';
import { InventoryContext } from '../../reducers/inventory';
import {
  getPlantLocationHistory,
  updatePlantLocationHistory,
} from '../../repositories/plantLocationHistory';
import { getUserInformation } from '../../repositories/user';
import { Colors } from '../../styles';
import { nonISUCountries } from '../../utils/constants';
import { getConvertedDiameter, getConvertedHeight } from '../../utils/measurements';
import { measurementValidation } from '../../utils/validations/measurements';

type Props = {};

export default function RemeasurementReview({}: Props) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [diameter, setDiameter] = useState('');
  const [editableDiameter, setEditableDiameter] = useState('');
  const [height, setHeight] = useState('');
  const [editableHeight, setEditableHeight] = useState('');
  const [editEnabledFor, setEditEnabledFor] = useState('');
  const [isNonISUCountry, setIsNonISUCountry] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [inputErrorMessage, setInputErrorMessage] = useState<string>(
    i18next.t('label.tree_inventory_input_error_message'),
  );
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<string>('');

  const {
    state: { selectedRemeasurementId },
  } = useContext(InventoryContext);

  useEffect(() => {
    getUserInformation().then(user => {
      setIsNonISUCountry(nonISUCountries.includes(user?.country || ''));
    });
    getPlantLocationHistory(selectedRemeasurementId).then((plantLocationHistory: any) => {
      if (plantLocationHistory) {
        setDiameter(plantLocationHistory.diameter);
        setHeight(plantLocationHistory.height);
        setImageUrl(
          plantLocationHistory.imageUrl
            ? plantLocationHistory.imageUrl
            : plantLocationHistory.cdnImageUrl || '',
        );
      }
    });
  }, []);

  const onSubmitInputField = ({
    action,
    forceContinue = false,
  }: {
    action: string;
    forceContinue?: boolean;
  }) => {
    let validationObject;
    switch (action) {
      case 'diameter':
        validationObject = measurementValidation(editableHeight, editableDiameter, isNonISUCountry);
        setInputErrorMessage(validationObject.diameterErrorMessage);
        setShowInputError(!!validationObject.diameterErrorMessage);
        const refactoredSpecieDiameter: number = getConvertedDiameter(editableDiameter);

        if (!validationObject.isRatioCorrect && !forceContinue) {
          setShowIncorrectRatioAlert(true);
          return;
        }
        setDiameter(editableDiameter);

        updatePlantLocationHistory({
          remeasurementId: selectedRemeasurementId,
          diameter: refactoredSpecieDiameter,
        });

        break;
      case 'height':
        validationObject = measurementValidation(editableHeight, editableDiameter, isNonISUCountry);

        setInputErrorMessage(validationObject.heightErrorMessage);
        setShowInputError(!!validationObject.heightErrorMessage);

        const refactoredSpecieHeight = getConvertedHeight(editableHeight);

        if (!validationObject.isRatioCorrect && !forceContinue) {
          setShowIncorrectRatioAlert(true);
          return;
        }
        setHeight(editableHeight);

        // updateDiameterLabel(refactoredSpecieHeight);
        updatePlantLocationHistory({
          remeasurementId: selectedRemeasurementId,
          height: refactoredSpecieHeight,
        });

        break;
      default:
        setInputErrorMessage(i18next.t('label.tree_inventory_input_error_message'));
        setShowInputError(true);
    }

    setIsOpenModal(false);
    setEditEnabledFor('');
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <InputModal
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
        value={
          editEnabledFor === 'diameter'
            ? editableDiameter
              ? editableDiameter.toString()
              : '0'
            : editableHeight
            ? editableHeight.toString()
            : '0'
        }
        inputType={'number'}
        setValue={editEnabledFor === 'diameter' ? setEditableDiameter : setEditableHeight}
        onSubmitInputField={() => onSubmitInputField({ action: editEnabledFor })}
      />
      <View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 0,
              marginBottom: 24,
            }}>
            <Header
              style={{ flex: 1 }}
              closeIcon
              onBackPress={() => onPressSave()}
              headingText={i18next.t('label.tree_review_header')}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});
function setShowIncorrectRatioAlert(arg0: boolean) {
  throw new Error('Function not implemented.');
}
