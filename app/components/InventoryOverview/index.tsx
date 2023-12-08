import {
  View,
  Text,
  Image,
  Modal,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  BackHandler,
  InteractionManager,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import bbox from '@turf/bbox';
import turfArea from '@turf/area';
import RNFS from 'react-native-fs';
import turfCenter from '@turf/center';
import { SvgXml } from 'react-native-svg';
import { convertArea } from '@turf/helpers';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CommonActions } from '@react-navigation/routers';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import React, { useContext, useEffect, useRef, useState } from 'react';

import {
  getInventory,
  addAppMetadata,
  deleteInventory,
  updateInventory,
  updateLastScreen,
  updatePlantingDate,
  changeInventoryStatus,
  updateMissingStatusOfSingleInventory,
  changeSampleTreesStatusToPendingUpload,
} from '../../repositories/inventory';
import {
  SYNCED,
  ON_SITE,
  OFF_SITE,
  INCOMPLETE,
  FIX_NEEDED,
  getIncompleteStatus,
  PENDING_DATA_UPLOAD,
  INCOMPLETE_SAMPLE_TREE,
} from '../../utils/inventoryConstants';
import Markers from '../Common/Markers';
import AlertModal from '../Common/AlertModal';
import { APIConfig } from '../../actions/Config';
import { Colors, Typography } from '../../styles';
import ExportGeoJSON from '../Common/ExportGeoJSON';
import { Header, Label, PrimaryButton } from '../Common';
import { InventoryContext } from '../../reducers/inventory';
import SampleTreeMarkers from '../Common/SampleTreeMarkers';
import { map_img, plus_icon, two_trees } from '../../assets';
import { getProjectById } from '../../repositories/projects';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import { getNotSampledSpecies } from '../../utils/getSampleSpecies';
import { setSkipToInventoryOverview } from '../../actions/inventory';
import AdditionalDataOverview from '../Common/AdditionalDataOverview';
import { getScientificSpeciesById } from '../../repositories/species';
import { getUserInformation } from '../../repositories/user';
import { cmToInch, meterToFoot, nonISUCountries } from '../../utils/constants';
import { UserContext } from '../../reducers/user';

let scrollAdjust = 0;

type RootStackParamList = {
  InventoryOverview: {
    navigateToScreen: boolean;
  };
};

type InventoryOverviewScreenRouteProp = RouteProp<RootStackParamList, 'InventoryOverview'>;

const InventoryOverview = ({ navigation }: any) => {
  const { protocol, cdnUrl } = APIConfig;
  const windowHeight = Dimensions.get('window').height;

  // reference for camera to focus on map
  const camera = useRef(null);
  const scrollPosition = useRef(new Animated.Value(0)).current;
  const { state, dispatch } = useContext(InventoryContext);
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const showProject = userState?.type == 'tpo' ? true : false;
  const [inventory, setInventory] = useState<any>(null);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [showAddSampleTrees, setShowAddSampleTrees] = useState(false);
  const [showNoSpeciesAlert, setShowNoSpeciesAlert] = useState(false);
  const [showLessSampleTreesAlert, setShowLessSampleTreesAlert] = useState(false);

  const [coordinateModalShow, setCoordinateModalShow] = useState<boolean>(false);
  const [coordinateIndex, setCoordinateIndex] = useState<number | null>();
  const [isSampleTree, setIsSampleTree] = useState<boolean | null>(false);
  const [bounds, setBounds] = useState<any>([]);
  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);
  const [isPointForMultipleTree, setIsPointForMultipleTree] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState<any>([]);
  const [layoutAboveMap, setLayoutAboveMap] = useState<number | null>();
  const [customModalPosition, setCustomModalPosition] = useState<number | null>();
  const [plantingAreaInHa, setPlantingAreaInHa] = useState<number>(0);
  const [plantingDensity, setPlantingDensity] = useState<number>(0);

  const map = useRef(null);
  const scroll = useRef();
  const [geoJSON, setGeoJSON] = useState({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          isPolygonComplete: false,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      },
    ],
  });

  const [showNoProjectWarning, setShowNoProjectWarning] = useState<boolean>(false);
  const [saveWithoutProject, setSaveWithoutProject] = useState<boolean>(false);
  const [showMissingDataWarning, setShowMissingDataWarning] = useState<boolean>(false);

  const route: InventoryOverviewScreenRouteProp = useRoute();

  useEffect(() => {
    if (
      isCameraRefVisible &&
      bounds.length > 0 &&
      camera?.current?.fitBounds &&
      !isPointForMultipleTree
    ) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 30, 1000);
    }
    if (isCameraRefVisible && centerCoordinate.length > 0 && camera?.current?.setCamera) {
      let config = {
        centerCoordinate,
        animationMode: 'flyTo',
      };
      if (isPointForMultipleTree) {
        config.zoomLevel = 18;
      }
      camera.current.setCamera(config);
    }
  }, [isCameraRefVisible, bounds, centerCoordinate]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', hardBackHandler);
      initialState();
      let data = { inventory_id: state.inventoryID, lastScreen: 'InventoryOverview' };
      updateLastScreen(data);
    });
    const unsubscribeBlur = navigation.addListener('focus', () => {
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
    });
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      initialState();
    }, []),
  );

  useEffect(() => {
    const setPlantingArea = async (totalTreeCount: number) => {
      const geoJSONData = await getGeoJsonData({ inventoryData: inventory });
      if (geoJSONData.features.length > 0) {
        const areaInSqM = turfArea(geoJSONData.features[0]);
        const areaInHa = Math.round(convertArea(areaInSqM, 'meters', 'hectares') * 10000) / 10000;
        setPlantingAreaInHa(areaInHa);
        setPlantingDensity(Math.round((totalTreeCount / areaInHa) * 100) / 100);
      }
    };
    if (inventory) {
      const totalTreeCount = inventory?.species
        .map((species: any) => species.treeCount)
        .reduce((a: any, b: any) => a + b, 0);
      setPlantingArea(totalTreeCount);
    }
  }, [inventory]);

  const hardBackHandler = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'NavDrawer' },
          {
            name: 'TreeInventory',
          },
        ],
      }),
    );
    return true;
  };

  const initialState = () => {
    if (state.inventoryID) {
      getInventory({ inventoryID: state.inventoryID }).then(async (inventoryData: any) => {
        const geoJSONData = await getGeoJsonData({ inventoryData, includeStatus: true });
        setInventory(inventoryData);

        if (inventoryData.projectId) {
          const project: any = await getProjectById(inventoryData?.projectId);
          if (project) {
            setSelectedProjectName(project.name);
            setSelectedProjectId(project.id);
          }
        } else {
          setSelectedProjectName('');
          setSelectedProjectId('');
        }
        if (inventoryData?.polygons.length > 0) {
          if (
            inventoryData?.polygons[0]?.coordinates?.length === 1 &&
            inventoryData?.polygons[0]?.isPolygonComplete
          ) {
            setIsPointForMultipleTree(true);
            setCenterCoordinate([
              inventoryData?.polygons[0]?.coordinates[0]?.longitude,
              inventoryData?.polygons[0]?.coordinates[0]?.latitude,
            ]);
          } else {
            setCenterCoordinate(turfCenter(geoJSONData.features[0]));
            setBounds(bbox(geoJSONData.features[0]));
          }

          setGeoJSON(geoJSONData);
        }
      });
    }
  };

  const addAppDataAndSave = () => {
    addAppMetadata({ inventory_id: state.inventoryID })
      .then(() => {
        let data = { inventory_id: state.inventoryID, status: PENDING_DATA_UPLOAD };
        changeInventoryStatus(data, dispatch).then(() => {
          navigation.navigate('TreeInventory');
        });
      })
      .catch(() => {
        setIsError(true);
        setShowAlert(true);
      });
  };

  const onPressSave = async ({
    forceContinue,
    continueWithoutProject,
  }: {
    forceContinue?: boolean;
    continueWithoutProject?: boolean;
  }) => {
    continueWithoutProject = continueWithoutProject || saveWithoutProject;
    setSaveWithoutProject(continueWithoutProject);

    const result = await updateMissingStatusOfSingleInventory(inventory?.inventory_id);

    if (result?.isFixNeeded) {
      setShowMissingDataWarning(true);
    } else if (inventory.species.length > 0) {
      changeSampleTreesStatusToPendingUpload(inventory?.inventory_id);
      setShowMissingDataWarning(false);
      if (inventory.locateTree === OFF_SITE) {
        if ((showProject && (selectedProjectName || continueWithoutProject)) || !showProject) {
          setShowNoProjectWarning(false);
          addAppDataAndSave();
        } else {
          setShowNoProjectWarning(true);
        }
      } else if (inventory?.sampleTrees && inventory?.sampleTrees?.length > 4) {
        if ((showProject && (selectedProjectName || continueWithoutProject)) || !showProject) {
          setShowNoProjectWarning(false);
          let notSampledSpecies = getNotSampledSpecies(inventory);
          if (notSampledSpecies?.size == 0 || forceContinue) {
            addAppDataAndSave();
          } else if (forceContinue !== undefined && !forceContinue) {
            setSkipToInventoryOverview(true)(dispatch);
            navigation.navigate('SpecieSampleTree', { notSampledSpecies });
          } else {
            setShowAddSampleTrees(true);
          }
        } else {
          setShowNoProjectWarning(true);
        }
      } else {
        setShowLessSampleTreesAlert(true);
      }
    } else {
      setShowNoSpeciesAlert(true);
    }
  };

  const focusMarker = async (coordinate: []) => {
    const zoom = await map?.current?.getZoom();

    camera?.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel: zoom > 20 ? zoom : 20,
      animationDuration: 1500,
      animationMode: 'flyTo',
    });
  };

  const renderMapView = () => {
    let shouldRenderShape = geoJSON.features[0].geometry.coordinates[0].length > 1;
    return (
      <MapLibreGL.MapView
        showUserLocation={false}
        style={styles.mapContainer}
        ref={map}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}>
        <MapLibreGL.Camera
          ref={el => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />
        {shouldRenderShape && !isPointForMultipleTree && (
          <MapLibreGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapLibreGL.LineLayer id={'polyline'} style={polyline} />
          </MapLibreGL.ShapeSource>
        )}
        <SampleTreeMarkers
          geoJSON={geoJSON}
          isPointForMultipleTree={isPointForMultipleTree}
          setCoordinateModalShow={setCoordinateModalShow}
          setCoordinateIndex={setCoordinateIndex}
          setIsSampleTree={setIsSampleTree}
          onPressMarker={onPressMarker}
          locateTree={inventory.locateTree}
        />
        {!isPointForMultipleTree ? (
          <Markers
            geoJSON={geoJSON}
            onPressMarker={onPressMarker}
            locateTree={inventory.locateTree}
            ignoreLastMarker
          />
        ) : (
          []
        )}
      </MapLibreGL.MapView>
    );
  };

  const onPressMarker = async ({ isSampleTree, coordinate, coordinateIndex }: any) => {
    setCoordinateIndex(coordinateIndex);
    setIsSampleTree(isSampleTree);
    let approxModalHeight = isSampleTree ? 250 : 150;
    let halfMapHeight = 215;
    let markerHeight = 45;

    if (layoutAboveMap + halfMapHeight - scrollPosition._value + 100 > windowHeight) {
      scrollAdjust = layoutAboveMap + halfMapHeight + 150 - windowHeight;
      await scroll.current.scrollTo({
        x: 0,
        y: layoutAboveMap + halfMapHeight + 150 - windowHeight,
        animated: true,
      });
    }
    if (
      layoutAboveMap + halfMapHeight - scrollPosition._value - scrollAdjust >
      approxModalHeight + 50
    ) {
      setCustomModalPosition(
        layoutAboveMap +
          halfMapHeight -
          scrollPosition._value -
          scrollAdjust -
          approxModalHeight -
          markerHeight,
      );
    } else if (scrollPosition._value > layoutAboveMap + 25) {
      scroll.current.scrollTo({ x: 0, y: layoutAboveMap, animated: true });
      setCustomModalPosition(halfMapHeight);
    }
    focusMarker(coordinate);
    setCoordinateModalShow(true);
  };

  const onChangeDate = (selectedDate: any) => {
    setShowDate(false);
    setInventory({ ...inventory, plantation_date: selectedDate });
    updatePlantingDate({
      inventory_id: state.inventoryID,
      plantation_date: selectedDate,
    });
  };

  const renderDatePicker = () => {
    const handleConfirm = (data: any) => onChangeDate(data);
    const hideDatePicker = () => setShowDate(false);
    return (
      showDate && (
        <DateTimePickerModal
          headerTextIOS={i18next.t('label.inventory_overview_pick_a_date')}
          cancelTextIOS={i18next.t('label.inventory_overview_cancel')}
          confirmTextIOS={i18next.t('label.inventory_overview_confirm')}
          isVisible={showDate}
          maximumDate={new Date()}
          minimumDate={new Date(2006, 0, 1)}
          testID="dateTimePicker"
          timeZoneOffsetInMinutes={0}
          date={new Date(inventory.plantation_date)}
          mode={'date'}
          is24Hour={true}
          display="default"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )
    );
  };

  const renderAddSpeciesButton = (status: string) => {
    return (
      (status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE) && (
        <TouchableOpacity
          onPress={handleSelectSpecies}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: '#F0F0F0',
            borderRadius: 10,
            marginVertical: 10,
          }}
          accessibilityLabel="Species Button"
          testID="species_btn">
          <Text style={styles.plantSpeciesText}>
            {i18next.t('label.inventory_overview_add_species')}
          </Text>
          <View>
            <SvgXml xml={plus_icon} />
          </View>
          <View>
            <SvgXml xml={two_trees} />
          </View>
        </TouchableOpacity>
      )
    );
  };

  const addSampleTree = () => {
    if (inventory.species.length === 0) {
      setShowNoSpeciesAlert(true);
    } else {
      let data = {
        inventory_id: inventory.inventory_id,
        lastScreen: 'RecordSampleTrees',
      };
      updateLastScreen(data);
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [{ name: 'NavDrawer' }, { name: 'TreeInventory' }, { name: 'RecordSampleTrees' }],
        }),
      );
    }
  };
  const addAnotherSampleTree = () => {
    updateInventory({
      inventory_id: state.inventoryID,
      inventoryData: {
        sampleTreesCount:
          inventory.sampleTreesCount === inventory.completedSampleTreesCount
            ? inventory.sampleTreesCount + 1
            : inventory.sampleTreesCount,
      },
    }).then(() => {
      let data = {
        inventory_id: inventory.inventory_id,
        lastScreen: 'RecordSampleTrees',
      };
      updateLastScreen(data);
      setSkipToInventoryOverview(true)(dispatch);
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [{ name: 'NavDrawer' }, { name: 'TreeInventory' }, { name: 'RecordSampleTrees' }],
        }),
      );
    });
  };
  const onPressDate = (status: string) => {
    if (status === INCOMPLETE && inventory.locateTree === OFF_SITE) {
      setShowDate(true);
    }
  };

  const handleSelectSpecies = () => {
    navigation.navigate('TotalTreesSpecies', {
      retainNavigationStack: true,
      redirectToOverview: true,
    });
  };

  const handleDeleteInventory = () => {
    deleteInventory({ inventory_id: inventory.inventory_id }, dispatch)
      .then(() => {
        setShowAlert(!showAlert);
        navigation.navigate('TreeInventory');
      })
      .catch(err => {
        console.error(err);
      });
  };

  let isSingleCoordinate, locateType;
  if (inventory) {
    isSingleCoordinate = inventory.polygons[0].coordinates[0].length == 1;

    locateType =
      inventory.locateTree === OFF_SITE
        ? i18next.t('label.tree_inventory_off_site')
        : i18next.t('label.tree_inventory_on_site');
  }

  const handleAddSampleTree = () => {
    inventory?.completedSampleTreesCount == 0 && inventory?.locateTree === ON_SITE
      ? addSampleTree()
      : addAnotherSampleTree();
  };

  let status = inventory ? inventory.status : PENDING_DATA_UPLOAD;
  const showEditButton = inventory?.status && getIncompleteStatus().includes(inventory?.status);
  const showAddSampleTreeFlag =
    inventory?.status &&
    (getIncompleteStatus().includes(inventory?.status) || inventory?.status === FIX_NEEDED) &&
    inventory?.locateTree === ON_SITE;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        {inventory !== null ? (
          <View style={styles.cont}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps={'always'}
              ref={scroll}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollPosition } } }],
                { useNativeDriver: false },
              )}>
              <View
                onLayout={e => {
                  setLayoutAboveMap(e.nativeEvent.layout.height);
                }}>
                <Header
                  closeIcon
                  headingText={i18next.t('label.inventory_overview_header_text')}
                  subHeadingText={i18next.t('label.inventory_overview_sub_header')}
                  onBackPress={() => {
                    if (route?.params?.navigateToScreen) {
                      navigation.navigate(route.params.navigateToScreen);
                    } else {
                      navigation.navigate('TreeInventory');
                    }
                  }}
                  subHeadingStyle={{ width: '45%' }}
                  TitleRightComponent={() => (
                    <TouchableOpacity
                      style={{ marginLeft: 'auto' }}
                      onPress={() => setShowAlert(true)}>
                      <Text style={styles.rightText}>
                        {status == INCOMPLETE_SAMPLE_TREE ||
                        status == INCOMPLETE ||
                        status == PENDING_DATA_UPLOAD
                          ? i18next.t('label.tree_review_delete')
                          : []}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                {inventory.status === FIX_NEEDED ? (
                  <View style={styles.fixNeededContainer}>
                    <Text style={styles.fixNeededText}>
                      {`${i18next.t('label.tree_inventory_fix_needed')} ${i18next.t(
                        'label.tree_inventory_fix_needed_sample',
                      )}`}
                    </Text>
                    <Text style={[styles.fixNeededText, { marginTop: 12 }]}>
                      {i18next.t('label.fix_before_uploading')}
                    </Text>
                  </View>
                ) : (
                  []
                )}
                <Label
                  leftText={i18next.t('label.inventory_overview_left_text')}
                  rightText={i18next.t('label.inventory_overview_date', {
                    date: new Date(inventory.plantation_date),
                  })}
                  onPressRightText={() => onPressDate(status)}
                  rightTextStyle={
                    status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE
                      ? { color: Colors.PRIMARY }
                      : { color: Colors.TEXT_COLOR }
                  }
                />

                {!isSingleCoordinate && (
                  <Label leftText={`${locateType} Registration`} rightText={''} />
                )}
              </View>
              <View>
                {renderMapView()}
                {showEditButton ? (
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditPolygon')}>
                    <MIcon name={'edit'} size={20} color={Colors.TEXT_COLOR} />
                  </TouchableOpacity>
                ) : (
                  []
                )}
                {showAddSampleTreeFlag ? (
                  <View style={[styles.addSampleTreeCon, { right: showEditButton ? 48 : 0 }]}>
                    <TouchableOpacity style={styles.addSampleTreeBtn} onPress={handleAddSampleTree}>
                      <Text style={styles.addSampleTreeText}>
                        {i18next.t('label.add_sample_tree')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  []
                )}
              </View>

              {/* display the HID if available */}

              {inventory?.hid ? (
                <Label
                  leftText={'HID'}
                  rightText={inventory?.hid}
                  rightTextStyle={{ color: Colors.TEXT_COLOR }}
                />
              ) : (
                []
              )}

              {/* display planting area on the screen */}
              {!isSingleCoordinate ? (
                <>
                  <Label
                    leftText={i18next.t('label.planting_area')}
                    rightText={i18next.t('label.planting_area_value', { plantingAreaInHa })}
                    rightTextStyle={{ color: Colors.TEXT_COLOR }}
                  />
                  <Label
                    leftText={i18next.t('label.planting_density')}
                    rightText={i18next.t('label.planting_density_value', { plantingDensity })}
                    rightTextStyle={{ color: Colors.TEXT_COLOR }}
                  />
                </>
              ) : (
                []
              )}

              {/* display projects on the screen */}
              {showProject ? (
                <Label
                  leftText={i18next.t('label.tree_review_project')}
                  rightText={
                    selectedProjectName
                      ? selectedProjectName
                      : i18next.t('label.tree_review_unassigned')
                  }
                  onPressRightText={() =>
                    getIncompleteStatus().includes(status)
                      ? navigation.navigate('SelectProject', { selectedProjectId })
                      : {}
                  }
                  rightTextStyle={
                    getIncompleteStatus().includes(status)
                      ? { color: Colors.PRIMARY }
                      : { color: Colors.TEXT_COLOR }
                  }
                />
              ) : (
                []
              )}

              <Label
                leftText={i18next.t('label.inventory_overview_left_text_planted_species')}
                rightText={getIncompleteStatus().includes(status) ? i18next.t('label.edit') : ''}
                onPressRightText={handleSelectSpecies}
              />
              {inventory.species.map((item: any, index: number) => (
                <Label
                  key={`species-${index}`}
                  leftText={i18next.t('label.inventory_overview_loc_left_text', { item })}
                  rightText={i18next.t('label.inventory_overview_loc_right_text', { item })}
                  style={{ marginVertical: 10 }}
                  leftTextStyle={{
                    paddingLeft: 20,
                    fontFamily: Typography.FONT_FAMILY_REGULAR,
                  }}
                  rightTextStyle={{ color: Colors.TEXT_COLOR }}
                />
              ))}
              {inventory && inventory.species.length <= 0 ? renderAddSpeciesButton(status) : null}

              <ExportGeoJSON inventory={inventory} />

              <Label leftText={i18next.t('label.additional_data')} rightText={''} />

              <AdditionalDataOverview data={inventory} />
            </ScrollView>
            {(getIncompleteStatus().includes(inventory.status) ||
              inventory.status === FIX_NEEDED) && (
              <View style={styles.bottomButtonContainer}>
                <PrimaryButton
                  onPress={() => onPressSave({})}
                  btnText={i18next.t('label.inventory_overview_loc_save')}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}
          </View>
        ) : null}
      </View>
      <AlertModal
        visible={showAlert}
        heading={
          isError
            ? i18next.t('label.something_went_wrong')
            : i18next.t('label.tree_inventory_alert_header')
        }
        message={
          isError
            ? i18next.t('label.error_saving_inventory')
            : status === SYNCED
            ? i18next.t('label.tree_review_delete_uploaded_registration')
            : i18next.t('label.tree_review_delete_not_yet_uploaded_registration')
        }
        primaryBtnText={isError ? i18next.t('label.ok') : i18next.t('label.tree_review_delete')}
        secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
        onPressPrimaryBtn={isError ? () => setShowAlert(!showAlert) : handleDeleteInventory}
        onPressSecondaryBtn={() => setShowAlert(!showAlert)}
        showSecondaryButton={!isError}
      />
      <AlertModal
        visible={showAddSampleTrees}
        heading={i18next.t('label.add_more_sample_trees')}
        message={i18next.t('label.recommend_at_least_one_sample')}
        primaryBtnText={i18next.t('label.continue')}
        secondaryBtnText={i18next.t('label.skip')}
        onPressPrimaryBtn={() => {
          setShowAddSampleTrees(false);
          onPressSave({ forceContinue: false });
        }}
        onPressSecondaryBtn={() => {
          setShowAddSampleTrees(false);
          onPressSave({ forceContinue: true });
        }}
        showSecondaryButton={true}
      />
      <AlertModal
        visible={showNoSpeciesAlert}
        heading={i18next.t('label.no_species_found')}
        message={i18next.t('label.at_least_one_species')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => setShowNoSpeciesAlert(false)}
      />
      <AlertModal
        visible={showLessSampleTreesAlert}
        heading={i18next.t('label.need_more_sample_trees')}
        message={i18next.t('label.at_least_five_sample_trees')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => setShowLessSampleTreesAlert(false)}
      />
      <CoordinateOverviewModal
        coordinateModalShow={coordinateModalShow}
        setCoordinateModalShow={setCoordinateModalShow}
        coordinateIndex={coordinateIndex}
        isSampleTree={isSampleTree}
        protocol={protocol}
        cdnUrl={cdnUrl}
        inventory={inventory}
        initialState={initialState}
        navigation={navigation}
        layoutAboveMap={layoutAboveMap}
        scrollPosition={scrollPosition._value}
        customModalPosition={customModalPosition}
        setCustomModalPosition={setCustomModalPosition}
      />
      <AlertModal
        visible={showNoProjectWarning}
        heading={i18next.t('label.project_not_assigned')}
        message={i18next.t('label.project_not_assigned_message')}
        primaryBtnText={i18next.t('label.continue')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={() => onPressSave({ continueWithoutProject: true })}
        onPressSecondaryBtn={() => setShowNoProjectWarning(false)}
        showSecondaryButton={true}
      />
      <AlertModal
        visible={showMissingDataWarning}
        heading={i18next.t('label.missing_data_found')}
        message={i18next.t('label.missing_data_found_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => setShowMissingDataWarning(false)}
        showSecondaryButton={false}
      />
      {renderDatePicker()}
    </SafeAreaView>
  );
};
export default InventoryOverview;

const CoordinateOverviewModal = ({
  coordinateModalShow,
  setCoordinateModalShow,
  coordinateIndex,
  protocol,
  cdnUrl,
  inventory,
  isSampleTree,
  initialState,
  navigation,
  scrollPosition,
  layoutAboveMap,
  customModalPosition,
  setCustomModalPosition,
}: any) => {
  const [imageSource, setImageSource] = useState<any>();
  const [marker, setMarker] = useState<any>();
  const [scientificSpecies, setScientificSpecies] = useState<any>();
  const [countryCode, setCountryCode] = useState<string>('');
  useEffect(() => {
    if (coordinateIndex || coordinateIndex === 0) {
      if (isSampleTree !== null && !isSampleTree) {
        setMarker(inventory?.polygons[0].coordinates[0][coordinateIndex]);
        initiateMarkerData(inventory?.polygons[0].coordinates[0][coordinateIndex]);
      } else if (isSampleTree !== null && isSampleTree) {
        setMarker(inventory?.sampleTrees[coordinateIndex - 1]);
        initiateMarkerData(inventory?.sampleTrees[coordinateIndex - 1]);
      }
    }
    getUserInformation().then(data => {
      setCountryCode(data.country);
    });
  }, [coordinateIndex, coordinateModalShow]);

  const initiateMarkerData = (marker: any) => {
    if (marker) {
      if (marker.imageUrl) {
        const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
        setImageSource({
          uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${marker.imageUrl}`,
        });
      } else if (marker.cdnImageUrl) {
        setImageSource({
          uri: `${protocol}://${cdnUrl}/media/cache/coordinate/thumb/${marker.cdnImageUrl}`,
        });
      } else {
        setImageSource(map_img);
      }
      if (isSampleTree) {
        getScientificSpeciesById(marker.specieId).then((specie: any) =>
          setScientificSpecies(specie?.scientificName),
        );
      }
    }
  };
  const specieHeight = nonISUCountries.includes(countryCode)
    ? marker?.specieHeight * meterToFoot
    : marker?.specieHeight;
  const specieDiameter = nonISUCountries.includes(countryCode)
    ? marker?.specieDiameter * cmToInch
    : marker?.specieDiameter;

  const heightUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_feet')
    : 'm';
  const diameterUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_inches')
    : 'cm';
  return (
    <Modal visible={coordinateModalShow} transparent>
      <TouchableOpacity
        style={styles.modalContainer}
        onPressIn={() => {
          setCoordinateModalShow(false);
          setCustomModalPosition();
          scrollAdjust = 0;
          initialState();
        }}>
        <View
          style={{
            width: 250,
            backgroundColor: Colors.WHITE,
            borderRadius: 10,
            overflow: 'hidden',
            elevation: 10,
            position: 'absolute',
            top: customModalPosition ? customModalPosition : layoutAboveMap - scrollPosition + 215,
          }}>
          <Image
            source={imageSource}
            style={{
              height: 150,
              width: '100%',
            }}
            resizeMode={'cover'}
          />
          {isSampleTree ? (
            <TouchableOpacity
              style={{
                padding: 10,
                paddingRight: 0,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
              onPress={() => {
                setCoordinateModalShow(false);
                navigation.navigate('SingleTreeOverview', {
                  isSampleTree: true,
                  sampleTreeIndex: coordinateIndex - 1,
                  totalSampleTrees: inventory.totalSampleTrees,
                });
              }}>
              <View>
                <Text
                  style={{
                    fontSize: Typography.FONT_SIZE_16,
                    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
                    color: Colors.TEXT_COLOR,
                  }}>
                  {marker?.specieName}
                </Text>
                <View style={{ paddingVertical: 3 }}>
                  <View style={{ flexDirection: 'row', paddingVertical: 3 }}>
                    <Text
                      style={{
                        fontSize: Typography.FONT_SIZE_14,
                        fontFamily: Typography.FONT_FAMILY_REGULAR,
                        color: Colors.TEXT_COLOR,
                      }}>
                      #{coordinateIndex} • {scientificSpecies}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={{
                        fontSize: Typography.FONT_SIZE_14,
                        fontFamily: Typography.FONT_FAMILY_REGULAR,
                        color: Colors.TEXT_COLOR,
                      }}>
                      {Math.round(specieDiameter * 100) / 100}
                      {diameterUnit} • {Math.round(specieHeight * 100) / 100}
                      {heightUnit}
                      {marker?.tagId ? ` • ${marker?.tagId}` : []}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={30}
                style={{
                  flexDirection: 'row',
                  alignSelf: 'center',
                  color: Colors.GRAY_DARK,
                }}
              />
            </TouchableOpacity>
          ) : (
            []
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cont: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },

  plantSpeciesText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },

  mapContainer: {
    backgroundColor: Colors.WHITE,
    height: 380,
    marginVertical: 25,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  fixNeededContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#E86F5620',
    marginVertical: 24,
  },
  fixNeededText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.PLANET_RED,
  },
  addSampleTreeCon: {
    position: 'absolute',
    top: 0,
    paddingTop: 20,
  },
  addSampleTreeBtn: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    margin: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  addSampleTreeText: {
    color: '#007A49',
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  editBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    top: 30,
    right: 6,
  },
  rightText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PRIMARY,
  },
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
