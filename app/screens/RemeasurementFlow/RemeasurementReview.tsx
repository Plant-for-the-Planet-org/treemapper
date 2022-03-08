import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { APIConfig } from '../../actions/Config';
import AlertModal from '../../components/Common/AlertModal';
import Header from '../../components/Common/Header';
import InputModal from '../../components/Common/InputModal';
import PrimaryButton from '../../components/Common/PrimaryButton';
import { InventoryContext } from '../../reducers/inventory';
import {
  getPlantLocationHistory,
  updatePlantLocationHistory,
  updatePlantLocationHistoryStatus,
} from '../../repositories/plantLocationHistory';
import { getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { DBHInMeter, nonISUCountries } from '../../utils/constants';
import {
  FIX_NEEDED,
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  PENDING_DATA_UPLOAD,
} from '../../utils/inventoryConstants';
import { getConvertedDiameter, getConvertedHeight } from '../../utils/measurements';
import { measurementValidation } from '../../utils/validations/measurements';
const { protocol, cdnUrl } = APIConfig;

type Props = {};

export default function RemeasurementReview({}: Props) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [diameter, setDiameter] = useState('');
  const [editableDiameter, setEditableDiameter] = useState('');
  const [height, setHeight] = useState('');
  const [editableHeight, setEditableHeight] = useState('');
  const [editEnabledFor, setEditEnabledFor] = useState('');
  const [isNonISUCountry, setIsNonISUCountry] = useState(false);
  const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [inputErrorMessage, setInputErrorMessage] = useState<string>(
    i18next.t('label.tree_inventory_input_error_message'),
  );
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<string>('');

  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );

  const navigation = useNavigation();

  const {
    state: { selectedRemeasurementId },
  } = useContext(InventoryContext);

  useEffect(() => {
    getUserInformation().then(user => {
      setIsNonISUCountry(nonISUCountries.includes(user?.country || ''));
    });
    getPlantLocationHistory(selectedRemeasurementId).then((plantLocationHistory: any) => {
      const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
      let imageSource = '';
      if (plantLocationHistory.imageUrl) {
        imageSource = `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${plantLocationHistory.imageUrl}`;
      } else if (plantLocationHistory.cdnImageUrl)
        imageSource = `${protocol}://${cdnUrl}/media/cache/coordinate/large/${plantLocationHistory.cdnImageUrl}`;

      if (plantLocationHistory) {
        setDiameter(plantLocationHistory.diameter);
        setHeight(plantLocationHistory.height);
        setImageUrl(imageSource);
        setDataStatus(plantLocationHistory.dataStatus);
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

        updateDiameterLabel(refactoredSpecieHeight);
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

  const onPressSave = async () => {
    const result = await updatePlantLocationHistoryStatus({
      remeasurementId: selectedRemeasurementId,
      status: PENDING_DATA_UPLOAD,
    });
    if (result) {
      navigation.navigate('TreeInventory');
    }
  };

  const updateDiameterLabel = (convertedHeight: number) => {
    if (convertedHeight < DBHInMeter) {
      setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
    } else {
      setDiameterLabel(i18next.t('label.measurement_DBH'));
    }
  };

  // used to get the text to show on UI for diameter and height
  const getConvertedMeasurementText = (measurement: any, unit: 'cm' | 'm' = 'cm'): string => {
    let text = i18next.t('label.tree_review_unable');

    if (measurement && isNonISUCountry) {
      text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${i18next.t(
        unit === 'cm' ? 'label.select_species_inches' : 'label.select_species_feet',
      )} `;
    } else if (measurement) {
      text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${unit} `;
    }
    return text;
  };

  const detailHeaderStyle = !imageUrl
    ? [styles.detailHeader, styles.defaultFontColor]
    : [styles.detailHeader];

  let shouldEdit;
  if (
    dataStatus === INCOMPLETE ||
    dataStatus === INCOMPLETE_SAMPLE_TREE ||
    dataStatus === FIX_NEEDED ||
    !dataStatus
  ) {
    shouldEdit = true;
  } else {
    shouldEdit = false;
  }

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
      <View style={styles.container}>
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
          <View style={styles.scrollViewContainer}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.imgSpecie} /> : []}

            <View style={{ marginVertical: 5, marginTop: 16 }}>
              <Text style={detailHeaderStyle}>{i18next.t('label.select_species_height')}</Text>
              <TouchableOpacity
                disabled={!shouldEdit}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  setEditEnabledFor('height');
                  setEditableHeight(height);
                }}
                accessibilityLabel="Height"
                testID="height_btn"
                accessible={true}>
                <FIcon name={'arrow-v'} style={styles.detailText} />
                <Text style={styles.detailText}>
                  {getConvertedMeasurementText(height, 'm')}
                  {shouldEdit && <MIcon name={'edit'} size={20} />}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginVertical: 5 }}>
              <Text style={detailHeaderStyle}>{diameterLabel}</Text>
              <TouchableOpacity
                disabled={!shouldEdit}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  setEditEnabledFor('diameter');
                  setEditableDiameter(diameter);
                }}
                accessibilityLabel={i18next.t('label.tree_review_diameter')}
                testID="diameter_btn"
                accessible={true}>
                <FIcon name={'arrow-h'} style={styles.detailText} />
                <Text style={styles.detailText}>
                  {getConvertedMeasurementText(diameter)}
                  {shouldEdit && <MIcon name={'edit'} size={20} />}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PrimaryButton
            onPress={() => onPressSave()}
            btnText={i18next.t('label.tree_review_Save')}
          />
        </View>
      </View>
      <AlertModal
        visible={showIncorrectRatioAlert}
        heading={i18next.t('label.not_optimal_ratio')}
        message={i18next.t('label.not_optimal_ratio_message')}
        primaryBtnText={i18next.t('label.check_again')}
        onPressPrimaryBtn={() => {
          setShowIncorrectRatioAlert(false);
          if (editEnabledFor === 'diameter') {
            setEditableDiameter(diameter);
          } else {
            setEditableHeight(height);
          }
        }}
        showSecondaryButton
        secondaryBtnText={i18next.t('label.continue')}
        onPressSecondaryBtn={() => {
          setShowIncorrectRatioAlert(false);
          onSubmitInputField({ action: editEnabledFor, forceContinue: true });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scrollViewContainer: {
    flex: 1,
    marginTop: 0,
  },
  imgSpecie: {
    width: '100%',
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 13,
  },
  detailHeader: {
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.GRAY_LIGHTEST,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginVertical: 5,
  },
  detailText: {
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
  defaultFontColor: {
    color: Colors.TEXT_COLOR,
  },
});
