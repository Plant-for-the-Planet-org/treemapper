import {CommonActions, useNavigation} from '@react-navigation/native';
import i18next from 'i18next';
import React, {useContext, useEffect, useState} from 'react';
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
import {APIConfig} from '../../actions/Config';
import {setInventoryId, setRemeasurementId} from '../../actions/inventory';
import {Loader} from '../../components/Common';
import AlertModal from '../../components/Common/AlertModal';
import Header from '../../components/Common/Header';
import InputModal from '../../components/Common/InputModal';
import PrimaryButton from '../../components/Common/PrimaryButton';
import {InventoryContext} from '../../reducers/inventory';
import {getInventoryByLocationId} from '../../repositories/inventory';
import {
  deletePlantLocationHistory,
  getPlantLocationHistoryById,
  updatePlantLocationHistory,
  updatePlantLocationHistoryEventDate,
  updatePlantLocationHistoryStatus,
} from '../../repositories/plantLocationHistory';
import {getUserInformation} from '../../repositories/user';
import {Colors, Typography} from '../../styles';
import {DBHInMeter, nonISUCountries} from '../../utils/constants';
import {
  EDITING,
  FIX_NEEDED,
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  PENDING_DATA_UPLOAD,
  SYNCED,
} from '../../utils/inventoryConstants';
import {getConvertedDiameter, getConvertedHeight} from '../../utils/measurements';
import {measurementValidation} from '../../utils/validations/measurements';
const {protocol, cdnUrl} = APIConfig;

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
  const [plantLocationHistory, setPlantLocationHistory] = useState({});
  const [HID, setHID] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [inputErrorMessage, setInputErrorMessage] = useState<string>(
    i18next.t('label.tree_inventory_input_error_message'),
  );
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<string>('');
  const [oldDataStatus, setOldDataStatus] = useState('');

  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );

  const [isEditable, setIsEditable] = useState<boolean>(false);

  // statues under which editing of data is possible
  const editableStatusCondition = [
    INCOMPLETE,
    INCOMPLETE_SAMPLE_TREE,
    FIX_NEEDED,
    EDITING,
    PENDING_DATA_UPLOAD,
  ];

  const navigation = useNavigation();

  const {
    state: {selectedRemeasurementId},
    dispatch,
  } = useContext(InventoryContext);

  useEffect(() => {
    // used to check if the user is in non-ISU country
    getUserInformation().then(user => {
      setIsNonISUCountry(nonISUCountries.includes(user?.country || ''));
    });

    console.log(selectedRemeasurementId, 'selectedRemeasurementId');

    // used to get the data for the selected remeasurement
    getPlantLocationHistoryById(selectedRemeasurementId).then((plantLocationHistory: any) => {
      getInventoryByLocationId({locationId: plantLocationHistory?.parentId})
        .then(inventory => {
          console.log(plantLocationHistory, ' plantLocationHistory.samplePlantLocationIndex');

          if (
            plantLocationHistory.samplePlantLocationIndex ||
            plantLocationHistory.samplePlantLocationIndex == 0
          ) {
            setHID(inventory[0]?.sampleTrees[plantLocationHistory.samplePlantLocationIndex]?.hid);
          }
          setInventoryId(inventory[0].inventory_id || '')(dispatch);
        })
        .catch(err => {
          console.log(err);
        });

      const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';

      // used to get the image url either from local storage or from the server
      if (plantLocationHistory) {
        console.log(JSON.stringify(plantLocationHistory), 'plantLocationHistory');

        let imageSource = '';
        if (plantLocationHistory.imageUrl)
          imageSource = `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${plantLocationHistory.imageUrl}`;
        else if (plantLocationHistory.cdnImageUrl)
          imageSource = `${protocol}://${cdnUrl}/media/cache/coordinate/large/${plantLocationHistory.cdnImageUrl}`;

        setPlantLocationHistory(plantLocationHistory);
        setDiameter(plantLocationHistory.diameter);
        setHeight(plantLocationHistory.height);
        setDataStatus(plantLocationHistory.dataStatus);
        setOldDataStatus(plantLocationHistory.dataStatus);
        setImageUrl(imageSource);

        // checks if editing is allowed for the selected remeasurement or not
        const canEdit = editableStatusCondition.includes(plantLocationHistory.dataStatus);
        if (canEdit) changeStatusToEditing();

        setIsEditable(canEdit);
      }
    });
    return () => {
      changeToOldStatus();
      setRemeasurementId('')(dispatch);
    };
  }, []);

  // checks if [diameter] or [height] is being edited and if so,
  // updates the value in the state by validating the same
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
        validationObject = measurementValidation(height, editableDiameter, isNonISUCountry);
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

        // changeToOldStatus();

        break;
      case 'height':
        validationObject = measurementValidation(editableHeight, diameter, isNonISUCountry);

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

        // changeToOldStatus();

        break;
      default:
        setInputErrorMessage(i18next.t('label.tree_inventory_input_error_message'));
        setShowInputError(true);
    }

    setIsOpenModal(false);
    setEditEnabledFor('');
  };

  // saves the plant location history data
  // adds current date to the [eventDate]
  // changes the status to [PENDING_DATA_UPLOAD]
  // navigates to [TreeInventory]
  const onPressSave = async () => {
    let eventDateResult;
    let statusResult;
    try {
      eventDateResult = await updatePlantLocationHistoryEventDate({
        remeasurementId: selectedRemeasurementId,
        eventDate: new Date(),
      });
    } catch (err) {
      console.log(err, 'EventDate');
    }
    try {
      statusResult = await updatePlantLocationHistoryStatus({
        remeasurementId: selectedRemeasurementId,
        status: PENDING_DATA_UPLOAD,
      });
    } catch (err) {
      console.log(err, 'StatusResult');
    }
    setOldDataStatus(PENDING_DATA_UPLOAD);
    if (eventDateResult && statusResult) {
      navigation.navigate('TreeInventory');
    }
  };

  const onPressBack = () => {
    navigation.navigate('TreeInventory');
    changeToOldStatus();
  };

  // shows diameter label based on height
  // i.e. either Basal diameter orDiameter at Breadth Height
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

  // changes the plant location history status to editing,
  // which helps to not upload this data
  const changeStatusToEditing = () => {
    updatePlantLocationHistoryStatus({
      remeasurementId: selectedRemeasurementId,
      status: EDITING,
    });
    setDataStatus(EDITING);
  };

  // used to change the status to old status if the remeasurement is saved earlier
  // i.e. if user cancels the editing, the status will be changed to old status
  //      -> PENDING_DATA_UPLOAD, etc
  const changeToOldStatus = () => {
    if (dataStatus && oldDataStatus && dataStatus !== INCOMPLETE) {
      updatePlantLocationHistoryStatus({
        remeasurementId: selectedRemeasurementId,
        status: oldDataStatus,
      });
    }
  };

  const redirectToParentInventory = () => {
    navigation.navigate('InventoryOverview', {navigateToScreen: 'RemeasurementReview'});
  };

  const handleDeleteInventory = () => {
    deletePlantLocationHistory({remeasurementId: selectedRemeasurementId})
      .then(() => {
        setShowDeleteAlert(!showDeleteAlert);
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{name: 'MainScreen'}, {name: 'TreeInventory'}],
          }),
        );
      })
      .catch(err => console.error(err));
  };

  // changes styles depending on the imagePath
  const detailHeaderStyle = !imageUrl
    ? [styles.detailHeader, styles.defaultFontColor]
    : [styles.detailHeader];

  return !HID ? (
    <Loader isLoaderShow={true} />
  ) : (
    <SafeAreaView style={styles.mainContainer}>
      <InputModal
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
        value={
          editEnabledFor === 'diameter'
            ? editableDiameter
              ? editableDiameter.toString()
              : ''
            : editableHeight
            ? editableHeight.toString()
            : ''
        }
        inputType={'number'}
        setValue={editEnabledFor === 'diameter' ? setEditableDiameter : setEditableHeight}
        onSubmitInputField={() => onSubmitInputField({action: editEnabledFor})}
      />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              flexDirection: 'row',
              // justifyContent: 'space-between',
              paddingVertical: 0,
              marginBottom: 0,
            }}>
            <Header
              style={{flex: 1}}
              closeIcon
              onBackPress={() => onPressBack()}
              headingText={i18next.t('label.tree_review_header')}
              subHeadingText={`HID:${HID}`}
              rightText={
                dataStatus === INCOMPLETE || dataStatus === PENDING_DATA_UPLOAD
                  ? i18next.t('label.tree_review_delete')
                  : ''
              }
              onPressFunction={() => setShowDeleteAlert(true)}
            />
          </View>

          <TouchableOpacity onPress={() => redirectToParentInventory()}>
            <Text style={styles.viewButton}>{i18next.t('label.view_plant_location')}</Text>
          </TouchableOpacity>

          <View style={styles.scrollViewContainer}>
            {/* shows the image */}
            {imageUrl ? <Image source={{uri: imageUrl}} style={styles.imgSpecie} /> : []}

            {/* shows the height and also shows the edit button if editable */}
            {plantLocationHistory?.status !== 'dead' ? (
              <View style={{marginVertical: 5, marginTop: 16}}>
                <Text style={detailHeaderStyle}>{i18next.t('label.select_species_height')}</Text>
                <TouchableOpacity
                  disabled={!isEditable}
                  style={{flexDirection: 'row', alignItems: 'center'}}
                  onPress={() => {
                    setEditEnabledFor('height');
                    setEditableHeight(height);
                    setIsOpenModal(true);
                  }}
                  accessibilityLabel="Height"
                  testID="height_btn"
                  accessible={true}>
                  <FIcon name={'arrow-v'} style={styles.detailText} />
                  <Text style={styles.detailText}>
                    {getConvertedMeasurementText(height, 'm')}
                    {isEditable && <MIcon name={'edit'} size={20} />}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              []
            )}

            {/* shows the diameter and also shows the edit button if editable */}

            {plantLocationHistory?.status !== 'dead' ? (
              <View style={{marginVertical: 5}}>
                <Text style={detailHeaderStyle}>{diameterLabel}</Text>
                <TouchableOpacity
                  disabled={!isEditable}
                  style={{flexDirection: 'row', alignItems: 'center'}}
                  onPress={() => {
                    setEditEnabledFor('diameter');
                    setEditableDiameter(diameter);
                    setIsOpenModal(true);
                  }}
                  accessibilityLabel={i18next.t('label.tree_review_diameter')}
                  testID="diameter_btn"
                  accessible={true}>
                  <FIcon name={'arrow-h'} style={styles.detailText} />
                  <Text style={styles.detailText}>
                    {getConvertedMeasurementText(diameter)}
                    {isEditable && <MIcon name={'edit'} size={20} />}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              []
            )}

            {plantLocationHistory?.status === 'dead' ? (
              <>
                <View style={{marginVertical: 5}}>
                  <Text style={detailHeaderStyle}>{i18next.t('label.status')}</Text>
                  <Text style={styles.detailText}>
                    {i18next.t(`label.${plantLocationHistory?.status}`)}
                  </Text>
                </View>
                <View style={{marginVertical: 5}}>
                  <Text style={detailHeaderStyle}>{i18next.t('label.cause_of_mortality')}</Text>
                  <Text style={styles.detailText}>
                    {i18next.t(`label.${plantLocationHistory?.statusReason}`)}
                  </Text>
                </View>
              </>
            ) : (
              []
            )}
          </View>
        </ScrollView>

        {/* shows button only if properties are editable and can be saved */}
        {isEditable ? (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <PrimaryButton
              onPress={() => onPressSave()}
              btnText={i18next.t('label.tree_review_Save')}
            />
          </View>
        ) : (
          []
        )}
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
          onSubmitInputField({action: editEnabledFor, forceContinue: true});
        }}
      />
      <AlertModal
        visible={showInputError}
        heading={i18next.t('label.tree_inventory_input_error')}
        message={inputErrorMessage}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
          setShowInputError(false);
        }}
      />
      <AlertModal
        visible={showDeleteAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={
          dataStatus === SYNCED
            ? i18next.t('label.tree_review_delete_uploaded_registration')
            : i18next.t('label.tree_review_delete_not_yet_uploaded_registration')
        }
        primaryBtnText={i18next.t('label.tree_review_delete')}
        secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
        onPressPrimaryBtn={handleDeleteInventory}
        onPressSecondaryBtn={() => setShowDeleteAlert(!showDeleteAlert)}
        showSecondaryButton={true}
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
  viewButton: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    paddingBottom: 30,
    color: Colors.PRIMARY,
  },
});
