import { useNetInfo } from '@react-native-community/netinfo';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  BackHandler,
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '_styles';
import { deleteInventoryId } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { UserContext } from '../../reducers/user';
import {
  changeInventoryStatus,
  deleteInventory,
  getInventory,
  updateInventory,
  updateLastScreen,
  updatePlantingDate,
  updateSingleTreeSpecie,
  updateSpecieDiameter,
  updateSpecieHeight,
  updateTreeTag,
} from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { getProjectById } from '../../repositories/projects';
import { getUserInformation } from '../../repositories/user';
import { checkLoginAndSync } from '../../utils/checkLoginAndSync';
import {
  cmToInch,
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
  meterToFoot,
  nonISUCountries,
} from '../../utils/constants';
import {
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  MULTI,
  ON_SITE,
  PENDING_DATA_UPLOAD,
  SINGLE,
} from '../../utils/inventoryConstants';
import { Header, PrimaryButton, InputModal } from '../Common';
import AlertModal from '../Common/AlertModal';
import ManageSpecies from '../ManageSpecies';

const SingleTreeOverview = () => {
  const { state: inventoryState, dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const [inventory, setInventory] = useState();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isShowDate, setIsShowDate] = useState(false);
  const [plantationDate, setPlantationDate] = useState(new Date());
  const [specieText, setSpecieText] = useState('');
  const [specieDiameter, setSpecieDiameter] = useState('');
  const [specieEditDiameter, setSpecieEditDiameter] = useState('');
  const [specieHeight, setSpecieHeight] = useState('');
  const [specieEditHeight, setSpecieEditHeight] = useState('');
  const [editedTagId, setEditedTagId] = useState('');
  const [tagId, setTagId] = useState('');
  const [locateTree, setLocateTree] = useState(null);
  const [editEnable, setEditEnable] = useState('');
  const [status, setStatus] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isShowManageSpecies, setIsShowManageSpecies] = useState(false);
  const [registrationType, setRegistrationType] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [isSampleTree, setIsSampleTree] = useState(false);
  const [sampleTreeIndex, setSampleTreeIndex] = useState();

  const netInfo = useNetInfo();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    if (route?.params?.isSampleTree) {
      setSampleTreeIndex(route.params.sampleTreeIndex);
    }
  }, [route.params]);

  useEffect(() => {
    if (!route?.params?.isSampleTree) {
      let data = { inventory_id: inventoryState.inventoryID, lastScreen: 'SingleTreeOverview' };
      updateLastScreen(data);
    }
    const unsubscribe = navigation.addListener('focus', () => {
      if (inventoryState.inventoryID) {
        getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
          setInventory(inventoryData);
          setStatus(inventoryData.status);
          setLocateTree(inventoryData.locateTree);
          setRegistrationType(inventoryData.treeType);

          getUserInformation().then(async (data) => {
            setCountryCode(data.country);
            if (
              inventoryData.status === INCOMPLETE_SAMPLE_TREE ||
              (route?.params?.isSampleTree &&
                (route?.params?.sampleTreeIndex === 0 || route?.params?.sampleTreeIndex))
            ) {
              const index = route?.params?.isSampleTree
                ? route?.params?.sampleTreeIndex
                : inventoryData.completedSampleTreesCount === inventoryData.sampleTreesCount
                  ? inventoryData.completedSampleTreesCount - 1
                  : inventoryData.completedSampleTreesCount;

              const currentSampleTree = inventoryData.sampleTrees[index];
              const diameter = nonISUCountries.includes(data.country)
                ? Math.round(currentSampleTree.specieDiameter * cmToInch * 100) / 100
                : currentSampleTree.specieDiameter;
              const height = nonISUCountries.includes(data.country)
                ? Math.round(currentSampleTree.specieHeight * meterToFoot * 100) / 100
                : currentSampleTree.specieHeight;

              setSampleTreeIndex(index);
              setIsSampleTree(true);
              setSpecieText(currentSampleTree.specieName);
              setSpecieDiameter(diameter);
              setSpecieEditDiameter(diameter);
              setSpecieHeight(height);
              setSpecieEditHeight(height);
              setPlantationDate(currentSampleTree.plantationDate);
              setTagId(currentSampleTree.tagId);
              setEditedTagId(currentSampleTree.tagId);
            } else {
              const diameter = nonISUCountries.includes(data.country)
                ? Math.round(inventoryData.specieDiameter * cmToInch * 100) / 100
                : inventoryData.specieDiameter;
              const height = nonISUCountries.includes(data.country)
                ? Math.round(inventoryData.specieHeight * meterToFoot * 100) / 100
                : inventoryData.specieHeight;

              if (inventoryData.projectId) {
                const project = await getProjectById(inventoryData.projectId);
                if (project) {
                  setSelectedProjectName(project.name);
                  setSelectedProjectId(project.id);
                }
              } else {
                setSelectedProjectName('');
                setSelectedProjectId('');
              }

              setSpecieText(inventoryData.species[0].aliases);
              setSpecieDiameter(diameter);
              setSpecieEditDiameter(diameter);
              setSpecieHeight(height);
              setSpecieEditHeight(height);
              setPlantationDate(inventoryData.plantation_date);
              setTagId(inventoryData.tagId);
              setEditedTagId(inventoryData.tagId);
            }
          });
        });
      }
    });

    return unsubscribe;
  }, [isShowManageSpecies, navigation]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onPressSave);
    return BackHandler.removeEventListener('hardwareBackPress', onPressSave);
  }, []);

  const onSubmitInputField = (action) => {
    const dimensionRegex = /^\d{0,5}(\.\d{1,3})?$/;

    const diameterMinValue = nonISUCountries.includes(countryCode)
      ? diameterMinInch
      : diameterMinCm;
    const diameterMaxValue = nonISUCountries.includes(countryCode)
      ? diameterMaxInch
      : diameterMaxCm;

    const heightMinValue = nonISUCountries.includes(countryCode) ? heightMinFoot : heightMinM;
    const heightMaxValue = nonISUCountries.includes(countryCode) ? heightMaxFoot : heightMaxM;

    if (
      action === 'diameter' &&
      specieEditDiameter !== '' &&
      Number(specieEditDiameter) >= diameterMinValue &&
      Number(specieEditDiameter) <= diameterMaxValue &&
      dimensionRegex.test(specieEditDiameter)
    ) {
      setSpecieDiameter(specieEditDiameter);
      const refactoredSpecieDiameter = nonISUCountries.includes(countryCode)
        ? Number(specieEditDiameter) * inchToCm
        : Number(specieEditDiameter);

      if (!isSampleTree && !route?.params?.isSampleTree) {
        updateSpecieDiameter({
          inventory_id: inventory.inventory_id,
          speciesDiameter: refactoredSpecieDiameter,
        });
      } else {
        updateSampleTree(action, refactoredSpecieDiameter);
      }
      setIsOpenModal(false);
    } else if (
      action === 'height' &&
      specieEditHeight !== '' &&
      Number(specieEditHeight) >= heightMinValue &&
      Number(specieEditHeight) <= heightMaxValue &&
      dimensionRegex.test(specieEditHeight)
    ) {
      setSpecieHeight(specieEditHeight);
      const refactoredSpecieHeight = nonISUCountries.includes(countryCode)
        ? Number(specieEditHeight) * footToMeter
        : Number(specieEditHeight);

      if (!isSampleTree && !route?.params?.isSampleTree) {
        updateSpecieHeight({
          inventory_id: inventory.inventory_id,
          speciesHeight: refactoredSpecieHeight,
        });
      } else {
        updateSampleTree(action, refactoredSpecieHeight);
      }
      setIsOpenModal(false);
    } else if (action === 'tagId') {
      setTagId(editedTagId);
      if (!isSampleTree && !route?.params?.isSampleTree) {
        updateTreeTag({
          inventoryId: inventory.inventory_id,
          tagId: editedTagId,
        });
      } else {
        updateSampleTree(action);
      }
      setIsOpenModal(false);
    } else {
      // TODO:i18n - if this is used, please add translations
      setShowInputError(true);
      setIsOpenModal(false);
    }
    setEditEnable('');
  };

  const updateSampleTree = (toUpdate, value = null) => {
    let updatedSampleTrees = inventory.sampleTrees;
    let sampleTree = updatedSampleTrees[sampleTreeIndex];
    let inventoryData = {};
    switch (toUpdate) {
      case 'diameter': {
        sampleTree = {
          ...sampleTree,
          specieDiameter: value,
        };
        break;
      }
      case 'height': {
        sampleTree = {
          ...sampleTree,
          specieHeight: value,
        };
        break;
      }
      case 'tagId': {
        sampleTree = {
          ...sampleTree,
          tagId: editedTagId,
        };
        break;
      }
      case 'plantationDate': {
        sampleTree = {
          ...sampleTree,
          plantationDate: value,
        };
        break;
      }
      case 'specie': {
        sampleTree = {
          ...sampleTree,
          specieId: value?.guid,
          specieName: value?.scientificName,
        };
        break;
      }
      case 'changeStatusToPending': {
        sampleTree = {
          ...sampleTree,
          status: PENDING_DATA_UPLOAD,
        };
        inventoryData = {
          ...inventoryData,
          completedSampleTreesCount: inventory.completedSampleTreesCount + 1,
        };
        break;
      }
      default:
        break;
    }
    updatedSampleTrees[sampleTreeIndex] = sampleTree;

    inventoryData = {
      ...inventoryData,
      sampleTrees: [...updatedSampleTrees],
    };

    updateInventory({
      inventory_id: inventory.inventory_id,
      inventoryData,
    })
      .then(() => {
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully modified ${toUpdate} for sample tree #${
            sampleTreeIndex + 1
          } having inventory_id: ${inventory.inventory_id}`,
        });
        getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
          setInventory(inventoryData);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Failed to modify ${toUpdate} for sample tree #${
            sampleTreeIndex + 1
          } having inventory_id: ${inventory.inventory_id}`,
        });
        console.error(
          `Failed to modify ${toUpdate} for sample tree #${
            sampleTreeIndex + 1
          } having inventory_id: ${inventory.inventory_id}`,
          err,
        );
      });
  };

  const onPressEditSpecies = (action) => {
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

  const addSpecieNameToInventory = (specie) => {
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
      updateSampleTree('specie', specie);
    }
    setSpecieText(specie.scientificName);
  };

  const onChangeDate = (selectedDate) => {
    if (!isSampleTree && !route?.params?.isSampleTree) {
      updatePlantingDate({
        inventory_id: inventoryState.inventoryID,
        plantation_date: selectedDate,
      });
    } else {
      updateSampleTree('plantationDate', selectedDate);
    }

    setIsShowDate(false);
    setPlantationDate(selectedDate);
  };

  const renderDateModal = () => {
    const handleConfirm = (data) => onChangeDate(data);
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

  let filePath, imageSource;

  if (inventory) {
    const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
    if (inventory.treeType === SINGLE) {
      filePath = inventory.polygons[0]?.coordinates[0]?.imageUrl;
    } else if (
      inventory.treeType === MULTI &&
      (inventory.status === INCOMPLETE_SAMPLE_TREE || inventory.status === 'complete') &&
      (sampleTreeIndex === 0 || sampleTreeIndex)
    ) {
      filePath = inventory.sampleTrees[sampleTreeIndex].imageUrl;
    }

    imageSource = filePath
      ? { uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${filePath}` }
      : false;
  }

  const renderDetails = ({ polygons }) => {
    let coords;
    if (polygons[0]) {
      coords = polygons[0].coordinates[0];
    }
    let shouldEdit;
    if (
      inventory &&
      (inventory.status === INCOMPLETE ||
        inventory.status === INCOMPLETE_SAMPLE_TREE ||
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
    return (
      // <ScrollView>
      <View style={detailContainerStyle}>
        <View>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_location')}</Text>
          <Text style={styles.detailText}>
            {`${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`}{' '}
          </Text>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_specie')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            onPress={() => onPressEditSpecies('species')}
            accessible={true}
            accessibilityLabel={i18next.t('label.tree_review_specie')}
            testID="species_btn">
            <Text style={styles.detailText}>
              {specieText
                ? i18next.t('label.tree_review_specie_text', { specieText })
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_diameter_header')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onPressEditSpecies('diameter')}
            accessibilityLabel={i18next.t('label.tree_review_diameter')}
            testID="diameter_btn"
            accessible={true}>
            <FIcon name={'arrow-h'} style={styles.detailText} />
            <Text style={styles.detailText}>
              {specieDiameter
                ? // i18next.t('label.tree_review_specie_diameter', { specieDiameter })
                nonISUCountries.includes(countryCode)
                  ? ` ${Math.round(specieDiameter * 100) / 100} ${i18next.t(
                    'label.select_species_inches',
                  )}`
                  : ` ${Math.round(specieDiameter * 100) / 100} cm`
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_height_header')}</Text>
          <TouchableOpacity
            disabled={!shouldEdit}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onPressEditSpecies('height')}
            accessibilityLabel="Height"
            testID="height_btn"
            accessible={true}>
            <FIcon name={'arrow-v'} style={styles.detailText} />
            <Text style={styles.detailText}>
              {specieHeight
                ? nonISUCountries.includes(countryCode)
                  ? ` ${Math.round(specieHeight * 100) / 100} ` +
                    i18next.t('label.select_species_feet')
                  : ` ${Math.round(specieHeight * 100) / 100} m`
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 15 }}>
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
        {status !== INCOMPLETE_SAMPLE_TREE && !route?.params?.isSampleTree ? (
          <View style={{ marginBottom: 15 }}>
            <Text style={detailHeaderStyle}>
              {i18next.t('label.tree_review_project').toUpperCase()}
            </Text>
            <TouchableOpacity
              disabled={!shouldEdit}
              onPress={() => onPressEditSpecies('project')}
              accessible={true}
              accessibilityLabel="register_project"
              testID="register_project">
              <Text style={styles.detailText}>
                {selectedProjectName
                  ? selectedProjectName
                  : i18next.t('label.tree_review_unassigned')}{' '}
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
      </View>
      // </ScrollView>
    );
  };

  const onPressSave = () => {
    if (route?.params?.isSampleTree) {
      navigation.goBack();
    } else if (inventory.status === 'complete' || inventory.status === INCOMPLETE_SAMPLE_TREE) {
      navigation.navigate('TreeInventory');
    } else {
      if (specieText) {
        let data = { inventory_id: inventoryState.inventoryID, status: 'pending' };
        changeInventoryStatus(data, dispatch).then(() => {
          checkLoginAndSync({
            sync: true,
            dispatch,
            userDispatch,
            connected: netInfo.isConnected,
            internet: netInfo.isInternetReachable,
          });
          navigation.navigate('TreeInventory');
        });
      } else {
        // TODO:i18n - if this is used, please add translations
        alert('Species Name  is required');
      }
    }
  };

  const onPressContinueToSpecies = () => {
    updateSampleTree('changeStatusToPending');
    navigation.dispatch(
      CommonActions.reset({
        index: 3,
        routes: [
          { name: 'MainScreen' },
          { name: 'TreeInventory' },
          { name: 'InventoryOverview' },
          { name: 'TotalTreesSpecies' },
        ],
      }),
    );
  };

  const onPressNextTree = () => {
    if (inventory.status === INCOMPLETE) {
      changeInventoryStatus(
        { inventory_id: inventoryState.inventoryID, status: 'pending' },
        dispatch,
      ).then(() => {
        deleteInventoryId()(dispatch);
        checkLoginAndSync({
          sync: true,
          dispatch,
          userDispatch,
          connected: netInfo.isConnected,
          internet: netInfo.isInternetReachable,
        });
        navigation.navigate('RegisterSingleTree');
      });
    } else if (inventory.status === INCOMPLETE_SAMPLE_TREE) {
      updateSampleTree('changeStatusToPending');

      let data = {
        inventory_id: inventory.inventory_id,
        lastScreen: 'RecordSampleTrees',
      };
      updateLastScreen(data);
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [
            { name: 'MainScreen' },
            { name: 'TreeInventory' },
            { name: 'RecordSampleTrees' },
          ],
        }),
      );
    }
  };

  const handleDeleteInventory = () => {
    deleteInventory({ inventory_id: inventory.inventory_id }, dispatch)
      .then(() => {
        setShowDeleteAlert(!showDeleteAlert);
        navigation.navigate('TreeInventory');
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return isShowManageSpecies ? (
    <ManageSpecies
      onPressBack={() => setIsShowManageSpecies(false)}
      registrationType={registrationType}
      addSpecieToInventory={addSpecieNameToInventory}
      editOnlySpecieName={true}
      isSampleTree={isSampleTree}
    />
  ) : (
    <SafeAreaView style={styles.mainContainer}>
      <InputModal
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
        value={
          editEnable === 'diameter'
            ? specieEditDiameter.toString()
            : editEnable === 'height'
              ? specieEditHeight.toString()
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
        onSubmitInputField={() => onSubmitInputField(editEnable)}
      />
      {renderDateModal()}
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
              closeIcon
              onBackPress={onPressSave}
              headingText={
                isSampleTree && (sampleTreeIndex === 0 || sampleTreeIndex)
                  ? i18next.t('label.sample_tree_review_tree_number', {
                    ongoingSampleTreeNumber: sampleTreeIndex + 1,
                  })
                  : status === 'complete'
                    ? i18next.t('label.tree_review_details')
                    : i18next.t('label.tree_review_header')
              }
            />
            {status !== INCOMPLETE_SAMPLE_TREE && !route?.params?.isSampleTree && (
              <TouchableOpacity style={{ paddingTop: 15 }} onPress={() => setShowDeleteAlert(true)}>
                <Text
                  style={{
                    fontFamily: Typography.FONT_FAMILY_REGULAR,
                    fontSize: Typography.FONT_SIZE_18,
                    lineHeight: Typography.LINE_HEIGHT_24,
                  }}>
                  {i18next.t('label.tree_review_delete')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
              onPress={onPressNextTree}
              btnText={i18next.t('label.tree_review_next_btn')}
              halfWidth={true}
            />
          </View>
        ) : inventory?.sampleTreesCount === inventory?.completedSampleTreesCount + 1 ? (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={onPressContinueToSpecies}
              btnText={i18next.t('label.tree_review_continue_to_species')}
            />
          </View>
        ) : (status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE) &&
          !route?.params?.isSampleTree ? (
            <View style={styles.bottomBtnsContainer}>
              <PrimaryButton
                onPress={onPressNextTree}
                btnText={i18next.t('label.tree_review_next_btn')}
              />
            </View>
          ) : (
            []
          )}
      </View>
      <AlertModal
        visible={showDeleteAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={
          status === 'complete'
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
        visible={showInputError}
        heading={i18next.t('label.tree_inventory_input_error')}
        message={i18next.t('label.tree_inventory_input_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => setShowInputError(false)}
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
    justifyContent: 'space-between',
    marginTop: 10,
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
});
