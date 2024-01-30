import {
  Text,
  View,
  Image,
  Platform,
  StyleSheet,
  Dimensions,
  ScrollView,
  BackHandler,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import RNFS from 'react-native-fs';
import Config from 'react-native-config';
import MapLibreGL from '@maplibre/maplibre-react-native';
import FIcon from 'react-native-vector-icons/Fontisto';
import Geolocation from 'react-native-geolocation-service';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import React, { useContext, useEffect, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
  cmToInch,
  inchToCm,
  DBHInMeter,
  footToMeter,
  meterToFoot,
  nonISUCountries,
} from '../../utils/constants';
import {
  deleteInventoryId,
  setRemeasurementId,
  setIsExtraSampleTree,
  setSkipToInventoryOverview,
  setSamplePlantLocationIndex,
} from '../../actions/inventory';
import {
  MULTI,
  SINGLE,
  SYNCED,
  ON_SITE,
  FIX_NEEDED,
  INCOMPLETE,
  PENDING_DATA_UPLOAD,
  INCOMPLETE_SAMPLE_TREE,
} from '../../utils/inventoryConstants';
import {
  getInventory,
  updateTreeTag,
  addAppMetadata,
  deleteInventory,
  updateLastScreen,
  updateSpecieHeight,
  updatePlantingDate,
  updateSpecieDiameter,
  changeInventoryStatus,
  updateSingleTreeSpecie,
} from '../../repositories/inventory';
import { bugsnag } from '../../utils';
import ManageSpecies from '../ManageSpecies';
import AlertModal from '../Common/AlertModal';
import { APIConfig } from '../../actions/Config';
import { Colors, Typography } from '../../styles';
import SpecieSampleTree from '../SpecieSampleTree';
import ExportGeoJSON from '../Common/ExportGeoJSON';
import { InventoryContext } from '../../reducers/inventory';
import { locationPermission } from '../../utils/permissions';
import { getProjectById } from '../../repositories/projects';
import { updateSampleTree } from '../../utils/updateSampleTree';
import distanceCalculator from '../../utils/distanceCalculator';
import { Header, InputModal, Label, PrimaryButton } from '../Common';
import AdditionalDataOverview from '../Common/AdditionalDataOverview';
import { getIsDateInRemeasurementRange } from '../../utils/remeasurement';
import { getUserInformation } from '../../repositories/user';
import { measurementValidation } from '../../utils/validations/measurements';
import { UserContext } from '../../reducers/user';
import { useSelector } from 'react-redux';
import { ENVS } from '../../../environment';

const { protocol } = APIConfig;

type RootStackParamList = {
  SingleTreeOverview: {
    isSampleTree: boolean;
    sampleTreeIndex: number;
    totalSampleTrees: number;
    item: any;
    navigateBackToHomeScreen: boolean;
  };
};

type SingleTreeOverviewScreenRouteProp = RouteProp<RootStackParamList, 'SingleTreeOverview'>;

const SingleTreeOverview = () => {
  const { state: inventoryState, dispatch } = useContext(InventoryContext);
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const showProject = userState?.type == 'tpo' ? true : false;
  const [inventory, setInventory] = useState<any>();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [isShowDate, setIsShowDate] = useState<boolean>(false);
  const [plantationDate, setPlantationDate] = useState<Date>(new Date());
  const [specieText, setSpecieText] = useState<string>('');
  const [specieDiameter, setSpecieDiameter] = useState<string>('');
  const [specieEditDiameter, setSpecieEditDiameter] = useState<string>('');
  const [specieHeight, setSpecieHeight] = useState<string>('');
  const [specieEditHeight, setSpecieEditHeight] = useState<string>('');
  const [editedTagId, setEditedTagId] = useState<string>('');
  const [tagId, setTagId] = useState<string>('');
  const [locateTree, setLocateTree] = useState(null);
  const [editEnable, setEditEnable] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [isShowManageSpecies, setIsShowManageSpecies] = useState<boolean>(false);
  const [registrationType, setRegistrationType] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showInputError, setShowInputError] = useState<boolean>(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSampleTree, setIsSampleTree] = useState(false);
  const [sampleTreeIndex, setSampleTreeIndex] = useState<number>();
  const [totalSampleTrees, setTotalSampleTrees] = useState<number>();
  const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState<boolean>(false);
  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );
  const [isIncompleteSampleTree, setIsIncompleteSampleTree] = useState<boolean>(false);

  const [inputErrorMessage, setInputErrorMessage] = useState<string>(
    i18next.t('label.tree_inventory_input_error_message'),
  );
  const [plantLocationHistory, setPlantLocationHistory] = useState([]);

  const [isError, setIsError] = useState<boolean>(false);
  const [showNoProjectWarning, setShowNoProjectWarning] = useState<boolean>(false);
  const [navigationType, setNavigationType] = useState<string>('save');
  const [location, setLocation] = useState<MapLibreGL.Location | Geolocation.GeoPosition>();
  const [isRemeasurementDisabled, setIsRemeasurementDisabled] = useState<boolean>(false);
  const [showRemeasurementButton, setShowRemeasurementButton] = useState<boolean>(false);
  const [plantLocationCoordinates, setPlantLocationCoordinates] = useState<[number, number]>([
    0, 0,
  ]);
  const { currentEnv } = useSelector(state => state.envSlice);
  const cdnUrl = ENVS[currentEnv].CDN_URL;

  const navigation = useNavigation();
  const route: SingleTreeOverviewScreenRouteProp = useRoute();

  useEffect(() => {
    if (route?.params?.isSampleTree || route?.params?.totalSampleTrees) {
      setSampleTreeIndex(route.params.sampleTreeIndex);
      setTotalSampleTrees(route.params.totalSampleTrees);
      setIsIncompleteSampleTree(
        inventory?.sampleTrees[route.params.sampleTreeIndex].status === INCOMPLETE,
      );
    }
  }, [route.params]);

  useEffect(() => {
    if (!route?.params?.isSampleTree) {
      let data = { inventory_id: inventoryState.inventoryID, lastScreen: 'SingleTreeOverview' };
      updateLastScreen(data);
    }
    const unsubscribe = navigation.addListener('focus', () => {
      if (inventoryState.inventoryID) {
        fetchAndUpdateInventoryDetails();
      }
    });

    return unsubscribe;
  }, [isShowManageSpecies, navigation]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onPressSave);

    let isCancelled = false;

    if (!isCancelled) {
      checkPermission();
    }

    return () => {
      isCancelled = true;

      BackHandler.removeEventListener('hardwareBackPress', onPressSave);
    };
  }, []);

  useEffect(() => {
    const distanceInMeters = distanceCalculator(
      [location?.coords.latitude as number, location?.coords.longitude as number],
      plantLocationCoordinates,
      'meters',
    );
    if (distanceInMeters > 100 && Config.IS_TEST_VERSION != 'true') {
      setIsRemeasurementDisabled(true);
    } else {
      setIsRemeasurementDisabled(false);
    }
  }, [location, plantLocationCoordinates]);

  useEffect(() => {
    if (plantationDate && status === SYNCED && plantLocationHistory) {
      // const isDateInRange = getIsDateInRemeasurementRange(plantationDate);

      // setShowRemeasurementButton(
      //   // isDateInRange &&
      //   plantLocationHistory?.length > 0 &&
      //     [PENDING_DATA_UPLOAD, SYNCED].includes(
      //       plantLocationHistory[plantLocationHistory?.length - 1]?.dataStatus,
      //     ),
      // );
      setShowRemeasurementButton(true);
    } else {
      setShowRemeasurementButton(false);
    }
  }, [plantationDate, status]);

  const checkPermission = async (showAlert = true) => {
    try {
      await locationPermission();
      // @ts-ignore
      // MapLibreGL.setTelemetryEnabled(false);
      updateCurrentPosition(showAlert);
      return true;
    } catch (err: any) {
      if (err?.message == 'blocked') {
        // TODO: add permission blocked modal
      } else if (err?.message == 'denied') {
        // TODO: add permission denied modal
      } else {
        bugsnag.notify(err);
      }
      return false;
    }
  };

  //getting current position of the user with high accuracy
  const updateCurrentPosition = async () => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          setLocation(position);
          resolve(position);
        },
        err => {},
        {
          enableHighAccuracy: true,
          timeout: 20000,
          accuracy: {
            android: 'high',
            ios: 'bestForNavigation',
          },
        },
      );
    });
  };

  const fetchAndUpdateInventoryDetails = () => {
    getInventory({ inventoryID: inventoryState.inventoryID }).then(inventoryData => {
      setInventory(inventoryData);
      setStatus(inventoryData.status);
      setLocateTree(inventoryData.locateTree);
      setRegistrationType(inventoryData.treeType);

      getUserInformation().then(async data => {
        setCountryCode(data.country);
        if (
          inventoryData.status === INCOMPLETE_SAMPLE_TREE ||
          // inventoryData.status === FIX_NEEDED ||
          (route?.params?.isSampleTree &&
            (route?.params?.sampleTreeIndex === 0 || route?.params?.sampleTreeIndex))
        ) {
          const sampleTreeCount =
            inventoryData.completedSampleTreesCount === inventoryData.sampleTreesCount
              ? inventoryData.completedSampleTreesCount - 1
              : inventoryData.completedSampleTreesCount;

          const index = route?.params?.isSampleTree
            ? route?.params?.sampleTreeIndex
            : sampleTreeCount;

          const currentSampleTree = inventoryData.sampleTrees[index];
          const diameter = nonISUCountries.includes(data.country)
            ? Math.round(currentSampleTree.specieDiameter * cmToInch * 1000) / 1000
            : currentSampleTree.specieDiameter;
          const height = nonISUCountries.includes(data.country)
            ? Math.round(currentSampleTree.specieHeight * meterToFoot * 1000) / 1000
            : currentSampleTree.specieHeight;

          updateDiameterLabel(currentSampleTree.specieHeight);

          setSampleTreeIndex(index);
          setIsIncompleteSampleTree(currentSampleTree.status === INCOMPLETE);
          setIsSampleTree(true);
          setSpecieText(currentSampleTree.specieName);
          setSpecieDiameter(diameter);
          setSpecieEditDiameter(diameter);
          setSpecieHeight(height);
          setSpecieEditHeight(height);
          setPlantationDate(currentSampleTree.plantationDate);
          setTagId(currentSampleTree.tagId);
          setEditedTagId(currentSampleTree.tagId);
          setTotalSampleTrees(inventoryData.sampleTreesCount);
          setPlantLocationCoordinates([currentSampleTree.latitude, currentSampleTree.longitude]);
          setPlantLocationHistory(currentSampleTree.plantLocationHistory);
        } else {
          const diameter = nonISUCountries.includes(data.country)
            ? Math.round(inventoryData.specieDiameter * cmToInch * 1000) / 1000
            : inventoryData.specieDiameter;
          const height = nonISUCountries.includes(data.country)
            ? Math.round(inventoryData.specieHeight * meterToFoot * 1000) / 1000
            : inventoryData.specieHeight;

          if (inventoryData.projectId) {
            const project: any = await getProjectById(inventoryData.projectId);
            if (project) {
              setSelectedProjectName(project.name);
              setSelectedProjectId(project.id);
            }
          } else {
            setSelectedProjectName('');
            setSelectedProjectId('');
          }

          updateDiameterLabel(inventoryData.specieHeight);

          setSpecieText(inventoryData.species[0].aliases);
          setSpecieDiameter(diameter);
          setSpecieEditDiameter(diameter);
          setSpecieHeight(height);
          setSpecieEditHeight(height);
          setPlantationDate(inventoryData.plantation_date);
          setTagId(inventoryData.tagId);
          setEditedTagId(inventoryData.tagId);
          setPlantLocationCoordinates([
            inventoryData.polygons[0]?.coordinates[0].latitude,
            inventoryData.polygons[0]?.coordinates[0].longitude,
          ]);
        }
      });
    });
  };

  const updateDiameterLabel = (convertedHeight: number) => {
    if (convertedHeight < DBHInMeter) {
      setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
    } else {
      setDiameterLabel(i18next.t('label.measurement_DBH'));
    }
  };

  const getConvertedDiameter = (treeDiameter = specieEditDiameter) => {
    return nonISUCountries.includes(countryCode)
      ? Number(treeDiameter) * inchToCm
      : Number(treeDiameter);
  };

  const getConvertedHeight = (treeHeight = specieEditHeight) => {
    return nonISUCountries.includes(countryCode)
      ? Number(treeHeight) * footToMeter
      : Number(treeHeight);
  };

  const onSubmitInputField = ({
    action,
    forceContinue = false,
  }: {
    action: string;
    forceContinue?: boolean;
  }) => {
    const isNonISUCountry = nonISUCountries.includes(countryCode);
    let validationObject;
    switch (action) {
      case 'diameter':
        validationObject = measurementValidation(
          specieEditHeight,
          specieEditDiameter,
          isNonISUCountry,
        );
        setInputErrorMessage(validationObject.diameterErrorMessage);
        setShowInputError(!!validationObject.diameterErrorMessage);
        const refactoredSpecieDiameter: number = getConvertedDiameter();

        if (!validationObject.isRatioCorrect && !forceContinue) {
          setShowIncorrectRatioAlert(true);
          return;
        }
        setSpecieDiameter(specieEditDiameter);

        if (!isSampleTree && !route?.params?.isSampleTree) {
          updateSpecieDiameter({
            inventory_id: inventory.inventory_id,
            speciesDiameter: refactoredSpecieDiameter,
          });
        } else {
          updateSampleTree({
            toUpdate: action,
            value: refactoredSpecieDiameter,
            inventory,
            sampleTreeIndex,
            setInventory,
          });
        }
        break;
      case 'height':
        validationObject = measurementValidation(
          specieEditHeight,
          specieEditDiameter,
          isNonISUCountry,
        );

        setInputErrorMessage(validationObject.heightErrorMessage);
        setShowInputError(!!validationObject.heightErrorMessage);

        const refactoredSpecieHeight = getConvertedHeight();

        if (!validationObject.isRatioCorrect && !forceContinue) {
          setShowIncorrectRatioAlert(true);
          return;
        }
        setSpecieHeight(specieEditHeight);

        updateDiameterLabel(refactoredSpecieHeight);

        if (!isSampleTree && !route?.params?.isSampleTree) {
          updateSpecieHeight({
            inventory_id: inventory.inventory_id,
            speciesHeight: refactoredSpecieHeight,
          });
        } else {
          updateSampleTree({
            toUpdate: action,
            value: refactoredSpecieHeight,
            inventory,
            sampleTreeIndex,
            setInventory,
          });
        }
        break;
      case 'tagId':
        setTagId(editedTagId);
        if (!isSampleTree && !route?.params?.isSampleTree) {
          updateTreeTag({
            inventoryId: inventory.inventory_id,
            tagId: editedTagId,
          });
        } else {
          updateSampleTree({
            toUpdate: action,
            value: editedTagId,
            inventory,
            sampleTreeIndex,
            setInventory,
          });
        }
        break;
      default:
        setInputErrorMessage(i18next.t('label.tree_inventory_input_error_message'));
        setShowInputError(true);
    }

    setIsOpenModal(false);
    setEditEnable('');
  };

  const onPressEditSpecies = (action: string) => {
    if (action === 'species') {
      setIsShowManageSpecies(true);
    } else if (action === 'project') {
      navigation.navigate('SelectProject', { selectedProjectId });
    } else {
      setEditEnable(action);
      if (action === 'diameter') {
        setSpecieEditDiameter(specieDiameter);
      } else if (action === 'height') {
        setSpecieEditHeight(specieHeight);
      } else if (action === 'tagId') {
        setEditedTagId(tagId);
      }
      setIsOpenModal(true);
    }
  };

  const addSpecieNameToInventory = (stringifiedSpecie: any) => {
    let specie = JSON.parse(stringifiedSpecie);
    if (!isSampleTree && !route?.params?.isSampleTree) {
      updateSingleTreeSpecie({
        inventory_id: inventory.inventory_id,
        species: [
          {
            id: specie.guid,
            treeCount: 1,
            aliases: specie.aliases ? specie.aliases : specie.scientificName,
          },
        ],
      });
    } else {
      updateSampleTree({
        toUpdate: 'specie',
        value: specie,
        inventory,
        sampleTreeIndex,
        setInventory,
      });
    }
    setSpecieText(specie.aliases);
  };

  const onChangeDate = (selectedDate: any) => {
    if (!isSampleTree && !route?.params?.isSampleTree) {
      updatePlantingDate({
        inventory_id: inventoryState.inventoryID,
        plantation_date: selectedDate,
      });
    } else {
      updateSampleTree({
        toUpdate: 'plantationDate',
        value: selectedDate,
        inventory,
        sampleTreeIndex,
        setInventory,
      });
    }

    setIsShowDate(false);
    setPlantationDate(selectedDate);
  };

  const renderDateModal = () => {
    const handleConfirm = (data: any) => onChangeDate(data);
    const hideDatePicker = () => setIsShowDate(false);

    return (
      isShowDate && (
        <DateTimePickerModal
          headerTextIOS={i18next.t('label.inventory_overview_pick_a_date')}
          cancelTextIOS={i18next.t('label.inventory_overview_cancel')}
          confirmTextIOS={i18next.t('label.inventory_overview_confirm')}
          isVisible={true}
          maximumDate={new Date()}
          minimumDate={new Date(2006, 0, 1)}
          testID="dateTimePicker1"
          timeZoneOffsetInMinutes={0}
          date={new Date(plantationDate)}
          mode={'date'}
          is24Hour={true}
          display="default"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )
    );
  };

  let filePath, imageSource: any;

  if (inventory) {
    const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
    if (inventory.treeType === SINGLE) {
      if (inventory.polygons[0]?.coordinates[0]?.imageUrl) {
        filePath = inventory.polygons[0]?.coordinates[0]?.imageUrl;
      } else if (inventory.polygons[0]?.coordinates[0]?.cdnImageUrl) {
        filePath = inventory.polygons[0]?.coordinates[0]?.cdnImageUrl;
      }
    } else if (
      inventory.treeType === MULTI &&
      (inventory.status === INCOMPLETE_SAMPLE_TREE ||
        inventory.status === SYNCED ||
        inventory.status === PENDING_DATA_UPLOAD) &&
      (sampleTreeIndex === 0 || sampleTreeIndex)
    ) {
      if (inventory.sampleTrees[sampleTreeIndex]?.imageUrl) {
        filePath = inventory.sampleTrees[sampleTreeIndex].imageUrl;
      } else if (
        inventory.sampleTrees.length &&
        inventory.sampleTrees[sampleTreeIndex]?.cdnImageUrl
      ) {
        filePath = inventory.sampleTrees[sampleTreeIndex].cdnImageUrl;
      }
    }
    if (
      ((inventory.polygons[0]?.coordinates[0]?.imageUrl && inventory.treeType !== MULTI) ||
        (inventory.sampleTrees[sampleTreeIndex]?.imageUrl && inventory.sampleTrees)) &&
      filePath
    ) {
      imageSource = {
        uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${filePath}`,
      };
    } else if (
      (inventory.polygons[0]?.coordinates[0]?.cdnImageUrl ||
        (inventory.sampleTrees[sampleTreeIndex]?.cdnImageUrl &&
          inventory.sampleTrees.length !== 0)) &&
      filePath
    ) {
      imageSource = {
        uri: `${protocol}://${cdnUrl}/media/cache/coordinate/large/${filePath}`,
      };
    } else {
      imageSource = false;
    }
  }

  const renderDetails = ({ polygons, hid }: any) => {
    let coords;
    if (polygons[0]) {
      coords = polygons[0].coordinates[0];
    }
    let shouldEdit;
    if (
      inventory &&
      (inventory.status === INCOMPLETE ||
        inventory.status === INCOMPLETE_SAMPLE_TREE ||
        inventory.status === FIX_NEEDED ||
        !inventory.status)
    ) {
      shouldEdit = true;
    } else {
      shouldEdit = false;
    }
    let detailHeaderStyle = !imageSource
      ? [styles.detailHeader, styles.defaultFontColor]
      : [styles.detailHeader];
    let detailContainerStyle = imageSource ? [styles.detailSubContainer] : [{}];

    if (
      route?.params?.isSampleTree &&
      inventory?.sampleTrees?.length &&
      inventory?.sampleTrees[sampleTreeIndex]
    ) {
      hid = inventory.sampleTrees[sampleTreeIndex]?.hid;
    }

    const isNonISUCountry: boolean = nonISUCountries.includes(countryCode);

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

    return (
      <View style={detailContainerStyle}>
        {hid ? (
          <View style={{ marginVertical: 5 }}>
            <Text style={detailHeaderStyle}>HID</Text>

            <Text style={styles.detailText}>{hid}</Text>
          </View>
        ) : (
          []
        )}
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_specie')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            onPress={() => onPressEditSpecies('species')}
            accessible={true}
            accessibilityLabel={i18next.t('label.tree_review_specie')}
            testID="species_btn">
            <Text style={[styles.detailText, { fontStyle: 'italic' }]}>
              {specieText
                ? i18next.t('label.tree_review_specie_text', { specieText })
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.select_species_height')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onPressEditSpecies('height')}
            accessibilityLabel="Height"
            testID="height_btn"
            accessible={true}>
            <FIcon name={'arrow-v'} style={styles.detailText} />
            <Text style={styles.detailText}>
              {getConvertedMeasurementText(specieHeight, 'm')}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{diameterLabel}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onPressEditSpecies('diameter')}
            accessibilityLabel={i18next.t('label.tree_review_diameter')}
            testID="diameter_btn"
            accessible={true}>
            <FIcon name={'arrow-h'} style={styles.detailText} />
            <Text style={styles.detailText}>
              {getConvertedMeasurementText(specieDiameter)}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_plantation_date')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            onPress={() => setIsShowDate(true)}
            accessible={true}
            accessibilityLabel="Register Planting Date"
            testID="register_planting_date">
            <Text style={styles.detailText}>
              {i18next.t('label.inventory_overview_date', {
                date: new Date(plantationDate),
              })}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        {status !== INCOMPLETE_SAMPLE_TREE && !route?.params?.isSampleTree && showProject ? (
          <View style={{ marginVertical: 5 }}>
            <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_project')}</Text>
            <TouchableOpacity
              disabled={!shouldEdit}
              onPress={() => onPressEditSpecies('project')}
              accessible={true}
              accessibilityLabel="register_project"
              testID="register_project">
              <Text style={styles.detailText}>
                {selectedProjectName || i18next.t('label.tree_review_unassigned')}{' '}
                {shouldEdit && <MIcon name={'edit'} size={20} />}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          []
        )}
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_tree_tag_header')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onPressEditSpecies('tagId')}
            accessibilityLabel={i18next.t('label.tree_review_tree_tag_header')}
            testID="tree-tag-btn"
            accessible={true}>
            <Text style={styles.detailText}>
              {tagId ? tagId : i18next.t('label.tree_review_not_tagged')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_location')}</Text>
          <Text style={styles.detailText}>
            {`${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`}{' '}
          </Text>
        </View>
        {!isSampleTree ? <ExportGeoJSON inventory={inventory} /> : []}
        <Label leftText={i18next.t('label.additional_data')} rightText={''} />

        <AdditionalDataOverview
          data={
            isSampleTree && (sampleTreeIndex === 0 || sampleTreeIndex)
              ? inventory?.sampleTrees[sampleTreeIndex]
              : inventory
          }
          isSampleTree={isSampleTree}
        />
      </View>
    );
  };

  const navigateBack = () => {
    if (!route?.params?.navigateBackToHomeScreen) {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'BottomTab' }, { name: 'TreeInventory' }],
        }),
      );
    } else {
      navigation.goBack();
    }
  };

  const onPressRemeasure = (item: any, index: string) => {
    let lastScreen;
    setSamplePlantLocationIndex(index)(dispatch);
    if (item?.plantLocationHistory?.length > 0) {
      lastScreen = item?.plantLocationHistory[item?.plantLocationHistory?.length - 1]?.lastScreen;
    } else {
      lastScreen = '';
    }

    if (lastScreen) {
      setRemeasurementId(item?.plantLocationHistory[item?.plantLocationHistory?.length - 1].id)(
        dispatch,
      );
      navigation.navigate(lastScreen);
    } else {
      navigation.navigate('RemeasurementForm');
    }
  };

  const onPressSave = (forceContinue: boolean = false) => {
    if (route?.params?.isSampleTree) {
      navigation.goBack();
    } else if (inventory?.status === INCOMPLETE) {
      setNavigationType('save');
      if (showProject && !selectedProjectName && !forceContinue) {
        setShowNoProjectWarning(true);
      } else if (specieText) {
        setShowNoProjectWarning(false);
        addAppMetadata({ inventory_id: inventoryState.inventoryID })
          .then(() => {
            let data = { inventory_id: inventoryState.inventoryID, status: PENDING_DATA_UPLOAD };
            changeInventoryStatus(data, dispatch).then(() => {
              navigateBack();
            });
          })
          .catch(err => {
            setIsError(true);
          });
      } else {
        // TODO:i18n - if this is used, please add translations
        alert('Species Name is required');
      }
    } else {
      navigateBack();
    }
    return true;
  };

  const onPressContinue = () => {
    updateSampleTree({
      toUpdate: 'changeStatusToPending',
      inventory,
      sampleTreeIndex,
      setInventory,
    })
      .then(() => {
        setSkipToInventoryOverview(false)(dispatch);
        setIsExtraSampleTree(false)(dispatch);
        navigation.dispatch(
          CommonActions.reset({
            index: 2,
            routes: [
              { name: 'BottomTab' },
              { name: 'TreeInventory' },
              {
                name: inventoryState.skipToInventoryOverview
                  ? 'InventoryOverview'
                  : 'AdditionalDataForm',
              },
            ],
          }),
        );
      })
      .catch(() => setIsError(true));
  };

  const onPressNextTree = (forceContinue = false) => {
    if (inventory.status === INCOMPLETE) {
      if (showProject && !selectedProjectName && !forceContinue) {
        setNavigationType('next-tree');
        setShowNoProjectWarning(true);
      } else {
        setNavigationType('save');
        setShowNoProjectWarning(false);

        addAppMetadata({ inventory_id: inventoryState.inventoryID })
          .then(() => {
            let data = { inventory_id: inventoryState.inventoryID, status: PENDING_DATA_UPLOAD };
            changeInventoryStatus(data, dispatch).then(() => {
              deleteInventoryId()(dispatch);

              navigation.dispatch(
                CommonActions.reset({
                  index: 2,
                  routes: [
                    { name: 'BottomTab' },
                    { name: 'TreeInventory' },
                    { name: 'RegisterSingleTree' },
                  ],
                }),
              );
            });
          })
          .catch(() => setIsError(true));
      }
    } else if (inventory.status === INCOMPLETE_SAMPLE_TREE || inventory.status === FIX_NEEDED) {
      updateSampleTree({
        toUpdate: 'changeStatusToPending',
        inventory,
        sampleTreeIndex,
        setInventory,
      })
        .then(() => {
          let data = {
            inventory_id: inventory.inventory_id,
            lastScreen: 'RecordSampleTrees',
          };
          updateLastScreen(data);
          navigation.dispatch(
            CommonActions.reset({
              index: 2,
              routes: [
                { name: 'BottomTab' },
                { name: 'TreeInventory' },
                { name: 'RecordSampleTrees' },
              ],
            }),
          );
        })
        .catch(() => setIsError(true));
    }
  };

  const handleDeleteInventory = () => {
    if (isSampleTree) {
      let inventoryStatus = inventory?.sampleTrees[sampleTreeIndex].status;
      updateSampleTree({
        toUpdate: inventoryState.isExtraSampleTree ? 'deleteExtraSampleTree' : 'deleteSampleTree',
        sampleTreeIndex,
        inventory,
        setInventory,
      })
        .then(() => {
          setIsExtraSampleTree(false)(dispatch);
          setShowDeleteAlert(!showDeleteAlert);
          if (inventoryStatus == INCOMPLETE && !inventoryState.skipToInventoryOverview) {
            let data = {
              inventory_id: inventory.inventory_id,
              lastScreen: 'RecordSampleTrees',
            };
            updateLastScreen(data);
            navigation.dispatch(
              CommonActions.reset({
                index: 2,
                routes: [
                  { name: 'BottomTab' },
                  { name: 'TreeInventory' },
                  { name: 'RecordSampleTrees' },
                ],
              }),
            );
          } else {
            setSkipToInventoryOverview(false)(dispatch);
            let data = {
              inventory_id: inventory.inventory_id,
              lastScreen: 'InventoryOverview',
            };
            updateLastScreen(data);
            navigation.dispatch(
              CommonActions.reset({
                index: 2,
                routes: [
                  { name: 'BottomTab' },
                  { name: 'TreeInventory' },
                  { name: 'InventoryOverview' },
                ],
              }),
            );
          }
        })
        .catch(err => console.error(err));
    } else {
      deleteInventory({ inventory_id: inventory.inventory_id }, dispatch)
        .then(() => {
          setShowDeleteAlert(!showDeleteAlert);
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [{ name: 'BottomTab' }, { name: 'TreeInventory' }],
            }),
          );
        })
        .catch(err => console.error(err));
    }
  };

  return isShowManageSpecies ? (
    isSampleTree ? (
      <SpecieSampleTree
        onPressBack={() => setIsShowManageSpecies(false)}
        registrationType={registrationType}
        addSpecieToInventory={addSpecieNameToInventory}
        editOnlySpecieName={true}
        isSampleTree={isSampleTree}
      />
    ) : (
      <ManageSpecies
        onPressBack={() => setIsShowManageSpecies(false)}
        registrationType={registrationType}
        addSpecieToInventory={addSpecieNameToInventory}
        editOnlySpecieName={true}
        isSampleTree={isSampleTree}
      />
    )
  ) : (
    <SafeAreaView style={styles.mainContainer}>
      <InputModal
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
        value={
          editEnable === 'diameter'
            ? specieEditDiameter
              ? specieEditDiameter.toString()
              : '0'
            : editEnable === 'height'
            ? specieEditHeight
              ? specieEditHeight.toString()
              : '0'
            : editedTagId
        }
        inputType={editEnable === 'diameter' || editEnable === 'height' ? 'number' : 'text'}
        setValue={
          editEnable === 'diameter'
            ? setSpecieEditDiameter
            : editEnable === 'height'
            ? setSpecieEditHeight
            : setEditedTagId
        }
        onSubmitInputField={() => onSubmitInputField({ action: editEnable })}
      />
      {renderDateModal()}
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header
            style={{ flex: 1 }}
            closeIcon
            onBackPress={() => onPressSave()}
            headingText={
              isSampleTree && (sampleTreeIndex === 0 || sampleTreeIndex)
                ? i18next.t('label.sample_tree_review_tree_number', {
                    ongoingSampleTreeNumber: sampleTreeIndex + 1,
                    sampleTreesCount: totalSampleTrees,
                  })
                : status === SYNCED
                ? i18next.t('label.tree_review_details')
                : i18next.t('label.tree_review_header')
            }
            TitleRightComponent={() => (
              <TouchableOpacity
                style={{ marginLeft: 'auto' }}
                onPress={() => setShowDeleteAlert(true)}>
                <Text style={styles.rightText}>
                  {status === INCOMPLETE ||
                  status === INCOMPLETE_SAMPLE_TREE ||
                  status === FIX_NEEDED ||
                  (status === PENDING_DATA_UPLOAD && inventory?.treeType === SINGLE)
                    ? i18next.t('label.tree_review_delete')
                    : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
          {inventory && (
            <View style={styles.scrollViewContainer}>
              {imageSource && (
                <Image
                  source={imageSource}
                  style={locateTree === ON_SITE ? styles.imgSpecie : styles.bgImage}
                />
              )}
              {renderDetails(inventory)}
            </View>
          )}
        </ScrollView>
        {inventory?.treeType === SINGLE && status === INCOMPLETE ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PrimaryButton
              onPress={() => onPressSave()}
              btnText={i18next.t('label.tree_review_Save')}
              theme={'white'}
              halfWidth={true}
            />
            <PrimaryButton
              onPress={() => onPressNextTree()}
              btnText={i18next.t('label.tree_review_next_btn')}
              halfWidth={true}
            />
          </View>
        ) : inventory?.sampleTreesCount === inventory?.completedSampleTreesCount + 1 &&
          isIncompleteSampleTree ? (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={onPressContinue}
              btnText={
                inventoryState.skipToInventoryOverview
                  ? i18next.t('label.tree_review_continue_to_review')
                  : i18next.t('label.tree_review_continue_to_additional_data')
              }
            />
          </View>
        ) : (status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE || status === FIX_NEEDED) &&
          !route?.params?.isSampleTree ? (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={() => onPressNextTree()}
              btnText={i18next.t('label.tree_review_next_btn')}
            />
          </View>
        ) : showRemeasurementButton ? (
          <View style={[styles.bottomBtnsContainer, { flexDirection: 'column' }]}>
            <PrimaryButton
              onPress={() => {
                onPressRemeasure(route.params.item, `${route.params.sampleTreeIndex}`);
              }}
              btnText={i18next.t('label.remeasure')}
              disabled={isRemeasurementDisabled}
              // disabled={false}
            />
            {isRemeasurementDisabled ? (
              <Text>{i18next.t('label.you_are_far_to_remeasure')}</Text>
            ) : (
              []
            )}
          </View>
        ) : (
          []
        )}
      </View>
      <AlertModal
        visible={showDeleteAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={
          status === SYNCED
            ? i18next.t('label.tree_review_delete_uploaded_registration')
            : i18next.t('label.tree_review_delete_not_yet_uploaded_registration')
        }
        primaryBtnText={i18next.t('label.tree_review_delete')}
        secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
        onPressPrimaryBtn={handleDeleteInventory}
        onPressSecondaryBtn={() => setShowDeleteAlert(!showDeleteAlert)}
        showSecondaryButton={true}
      />
      <AlertModal
        visible={showNoProjectWarning}
        heading={i18next.t('label.project_not_assigned')}
        message={i18next.t('label.project_not_assigned_message')}
        primaryBtnText={i18next.t('label.continue')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={() =>
          navigationType === 'save' ? onPressSave(true) : onPressNextTree(true)
        }
        onPressSecondaryBtn={() => setShowNoProjectWarning(false)}
        showSecondaryButton={true}
      />
      <AlertModal
        visible={showInputError || isError}
        heading={
          isError
            ? i18next.t('label.something_went_wrong')
            : i18next.t('label.tree_inventory_input_error')
        }
        message={isError ? i18next.t('label.error_saving_inventory') : inputErrorMessage}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
          setIsError(false);
          setShowInputError(false);
        }}
      />
      <AlertModal
        visible={showIncorrectRatioAlert}
        heading={i18next.t('label.not_optimal_ratio')}
        message={i18next.t('label.not_optimal_ratio_message')}
        primaryBtnText={i18next.t('label.check_again')}
        onPressPrimaryBtn={() => {
          setShowIncorrectRatioAlert(false);
          if (editEnable === 'diameter') {
            setSpecieEditDiameter(specieDiameter);
          } else {
            setSpecieEditHeight(specieHeight);
          }
        }}
        showSecondaryButton
        secondaryBtnText={i18next.t('label.continue')}
        onPressSecondaryBtn={() => {
          setShowIncorrectRatioAlert(false);
          onSubmitInputField({ action: editEnable, forceContinue: true });
        }}
      />
    </SafeAreaView>
  );
};
export default SingleTreeOverview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
  },
  subScript: {
    fontSize: 10,
    color: Colors.WHITE,
  },
  overViewContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 15,
    overflow: 'hidden',
    marginVertical: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  detailContainer: {
    marginTop: 24,
  },
  scrollViewContainer: {
    flex: 1,
    marginTop: 0,
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
  detailSubContainer: {
    paddingTop: 10,
  },
  imgSpecie: {
    width: '100%',
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 13,
  },
  detailHead: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    lineHeight: Typography.LINE_HEIGHT_24,
  },
  detailTxt: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
    lineHeight: Typography.LINE_HEIGHT_24,
  },
  rightText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PRIMARY,
  },
});
