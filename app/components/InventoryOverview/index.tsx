import MapboxGL from '@react-native-mapbox-gl/maps';
import { CommonActions } from '@react-navigation/routers';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import i18next from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import RNFS from 'react-native-fs';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Share from 'react-native-share';
import { SvgXml } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { APIConfig } from '../../actions/Config';
import { setSkipToInventoryOverview } from '../../actions/inventory';
import { map_img, marker_png, plus_icon, two_trees } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import {
  addAppMetadata,
  changeInventoryStatus,
  deleteInventory,
  getInventory,
  updateInventory,
  updateLastScreen,
  updatePlantingDate,
} from '../../repositories/inventory';
import { getProjectById } from '../../repositories/projects';
import { getScientificSpeciesById } from '../../repositories/species';
import { getUserDetails, getUserInformation } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import { ALPHABETS } from '../../utils';
import { toBase64 } from '../../utils/base64';
import { cmToInch, meterToFoot, nonISUCountries } from '../../utils/constants';
import getGeoJsonData from '../../utils/convertInventoryToGeoJson';
import { getNotSampledSpecies } from '../../utils/getSampleSpecies';
import {
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  OFF_SITE,
  ON_SITE,
  PENDING_DATA_UPLOAD,
  SYNCED,
} from '../../utils/inventoryConstants';
import { askExternalStoragePermission } from '../../utils/permissions';
import { Header, InventoryCard, Label, LargeButton, PrimaryButton } from '../Common';
import AdditionalDataOverview from '../Common/AdditionalDataOverview';
import AlertModal from '../Common/AlertModal';
import Markers from '../Common/Markers';
import MarkerSVG from '../Common/MarkerSVG';
import SampleTreeMarkers from '../Common/SampleTreeMarkers';
import SampleTreesReview from '../SampleTrees/SampleTreesReview';

let scrollAdjust = 0;

const InventoryOverview = ({ navigation }: any) => {
  const { protocol, cdnUrl } = APIConfig;
  const windowHeight = Dimensions.get('window').height;

  const cameraRef = useRef();
  // reference for camera to focus on map
  const camera = useRef(null);
  const scrollPosition = useRef(new Animated.Value(0)).current;
  const { state, dispatch } = useContext(InventoryContext);

  const [inventory, setInventory] = useState<any>(null);
  const [locationTitle, setLocationTitle] = useState<string>('');
  const [selectedLOC, setSelectedLOC] = useState<any>(null);
  const [isLOCModalOpen, setIsLOCModalOpen] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showProject, setShowProject] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [showAddSampleTrees, setShowAddSampleTrees] = useState(false);
  const [showNoSpeciesAlert, setShowNoSpeciesAlert] = useState(false);
  const [showLessSampleTreesAlert, setShowLessSampleTreesAlert] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('');
  // const [focusCoordinate, setFocusCoordinate] = useState<number[] | null>();
  const [alphabets, setAlphabets] = useState([]);
  const [coordinateModalShow, setCoordinateModalShow] = useState<boolean>(false);
  const [coordinateIndex, setCoordinateIndex] = useState<number | null>();
  const [isSampleTree, setIsSampleTree] = useState<boolean | null>();
  const [bounds, setBounds] = useState([]);
  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);
  const [isPointForMultipleTree, setIsPointForMultipleTree] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState([]);
  const [layoutAboveMap, setLayoutAboveMap] = useState<number | null>();
  const [customModalPosition, setCustomModalPosition] = useState<number | null>();
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
          type: 'LineString',
          coordinates: [],
        },
      },
    ],
  });

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
    getUserDetails().then((userDetails) => {
      if (userDetails) {
        setCountryCode(userDetails.country || '');
        const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetails));
        if (stringifiedUserDetails?.type === 'tpo') {
          setShowProject(true);
        } else {
          setShowProject(false);
        }
      }
    });

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });
    return unsubscribe;
  }, [navigation]);

  const hardBackHandler = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainScreen' },
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
      getInventory({ inventoryID: state.inventoryID }).then(async (inventoryData) => {
        const geoJSONData = getGeoJsonData(inventoryData);
        setInventory(inventoryData);

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
        if (inventoryData.polygons.length > 0) {
          if (
            inventoryData.polygons[0].coordinates.length === 1 &&
            inventoryData.polygons[0].isPolygonComplete
          ) {
            setIsPointForMultipleTree(true);
            setCenterCoordinate([
              inventoryData.polygons[0].coordinates[0].longitude,
              inventoryData.polygons[0].coordinates[0].latitude,
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

  const renderPolygon = (polygons: any, locationType: any) => {
    return (
      <FlatList
        keyboardShouldPersistTaps={'always'}
        data={polygons}
        renderItem={({ item, index }) => {
          return (
            <View>
              <Label
                leftText={i18next.t('label.inventory_overview_polygon_left_text', {
                  locationType,
                })}
                rightText={''}
              />
              <FlatList
                data={item.coordinates}
                renderItem={({ item: oneCoordinate, index }) => {
                  let normalizeData = {
                    title: i18next.t('label.inventory_overview_title_coordinates', {
                      alphabetindex: ALPHABETS[index],
                    }),
                    subHeading: `${oneCoordinate.latitude.toFixed(
                      5,
                    )}˚N,${oneCoordinate.longitude.toFixed(7)}˚E`,
                    date: i18next.t('label.inventory_overview_view_location'),
                    imageURL: oneCoordinate.imageUrl,
                    cdnImageUrl: oneCoordinate.cdnImageUrl,
                    index: index,
                    countryCode: countryCode,
                  };
                  return (
                    <InventoryCard
                      data={normalizeData}
                      activeBtn={true}
                      onPressActiveBtn={onPressViewLOC}
                    />
                  );
                }}
                keyExtractor={(item, index) => `location-${index}`}
              />
            </View>
          );
        }}
      />
    );
  };

  const onPressViewLOC = (index: number) => {
    let selectedCoords = inventory.polygons[0].coordinates[index];
    let normalCoords: any = [selectedCoords.longitude, selectedCoords.latitude];
    setSelectedLOC(normalCoords);
    setLocationTitle(ALPHABETS[index]);
    setIsLOCModalOpen(!isLOCModalOpen);
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

  const onPressSave = ({ forceContinue }: { forceContinue?: boolean }) => {
    if (inventory.species.length > 0) {
      if (inventory.locateTree === OFF_SITE) {
        addAppDataAndSave();
      } else if (inventory?.sampleTrees && inventory?.sampleTrees?.length > 4) {
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
        setShowLessSampleTreesAlert(true);
      }
    } else {
      alert(i18next.t('label.inventory_overview_select_species'));
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

  const onBackPress = () => {
    // * FOR LOCATION MODAL
    setIsLOCModalOpen(!isLOCModalOpen);
    setSelectedLOC(null);
  };

  const renderViewLOCModal = () => {
    return (
      <Modal transparent visible={isLOCModalOpen} animationType={'slide'}>
        <SafeAreaView />
        <View style={styles.mainContainer}>
          <View style={styles.screenMargin}>
            <Header
              onBackPress={onBackPress}
              closeIcon
              headingText={i18next.t('label.inventory_overview_view_loc_modal_header', {
                locationTitle,
              })}
            />
          </View>
          <MapboxGL.MapView onDidFinishRenderingMapFully={focusMarker} style={styles.cont}>
            <MapboxGL.Camera ref={cameraRef} />
            {/* {inventory.treeType === MULTI && <Markers geoJSON={geoJSON} alphabets={alphabets} />} */}

            {selectedLOC && (
              <MapboxGL.PointAnnotation id={'markerContainer1'} coordinate={selectedLOC}>
                <MarkerSVG point={locationTitle} color={Colors.PRIMARY} />
              </MapboxGL.PointAnnotation>
            )}
          </MapboxGL.MapView>
        </View>
      </Modal>
    );
  };
  const renderMapView = () => {
    let shouldRenderShape = geoJSON.features[0].geometry.coordinates.length > 1;
    return (
      <MapboxGL.MapView
        showUserLocation={false}
        style={styles.mapContainer}
        ref={map}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}>
        {/* <SampleTreeMarkers geoJSON={geoJSON} isPointForMultipleTree={isPointForMultipleTree} /> */}
        {/* <Markers geoJSON={geoJSON} alphabets={alphabets} /> */}
        <MapboxGL.Camera
          ref={(el) => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />
        {shouldRenderShape && !isPointForMultipleTree && (
          <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
          </MapboxGL.ShapeSource>
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
            setCoordinateModalShow={setCoordinateModalShow}
            setCoordinateIndex={setCoordinateIndex}
            onPressMarker={onPressMarker}
            setIsSampleTree={setIsSampleTree}
            locateTree={inventory.locateTree}
          />
        ) : (
          []
        )}
      </MapboxGL.MapView>
    );
  };
  const askAndroidStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: i18next.t('label.storage_permission_android_title'),
          message: i18next.t('label.storage_permission_android_message'),
          buttonPositive: i18next.t('label.permission_camera_ok'),
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          i18next.t('label.storage_permission_denied_header'),
          i18next.t('label.storage_permission_denied_sub_header'),
        );
        return false;
      }
    } catch (err) {
      bugsnag.notify(err);
      return false;
    }
  };
  const onPressMarker = async (isSampleTree: boolean, coordinate: []) => {
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
  };

  const onPressExportJSON = async () => {
    const exportGeoJSONFile = async () => {
      if (inventory.polygons.length > 0) {
        const geoJSON = await getGeoJsonData(inventory);

        const options = {
          url: 'data:application/json;base64,' + toBase64(JSON.stringify(geoJSON)),
          message: i18next.t('label.inventory_overview_export_json_message'),
          title: i18next.t('label.inventory_overview_export_json_title'),
          filename: `TreeMapper GeoJSON ${inventory.inventory_id}`,
          saveToFiles: true,
        };
        Share.open(options)
          .then(() => {
            alert(i18next.t('label.inventory_overview_export_json_success'));
          })
          .catch((err) => {
            if (err?.error?.code != 'ECANCELLED500') {
              // iOS cancel button pressed
              alert(i18next.t('label.inventory_overview_export_json_error'));
            }
          });
      }
    };
    const permissionResult = await askExternalStoragePermission();
    if (permissionResult) {
      await exportGeoJSONFile();
    }
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

  const renderAddSampleTreeButton = (inventoryStatus: string) => {
    return (
      (inventoryStatus === INCOMPLETE || inventoryStatus === INCOMPLETE_SAMPLE_TREE) && (
        <TouchableOpacity
          onPress={addSampleTree}
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
            {i18next.t('label.inventory_overview_add_sample_tree')}
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
          routes: [
            { name: 'MainScreen' },
            { name: 'TreeInventory' },
            { name: 'RecordSampleTrees' },
          ],
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
          routes: [
            { name: 'MainScreen' },
            { name: 'TreeInventory' },
            { name: 'RecordSampleTrees' },
          ],
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
      .catch((err) => {
        console.error(err);
      });
  };

  let locationType;
  let isSingleCoordinate, locateType;
  if (inventory) {
    isSingleCoordinate = inventory.polygons[0].coordinates.length == 1;
    locationType = isSingleCoordinate
      ? i18next.t('label.tree_inventory_point')
      : i18next.t('label.tree_inventory_polygon');
    locateType =
      inventory.locateTree === OFF_SITE
        ? i18next.t('label.tree_inventory_off_site')
        : i18next.t('label.tree_inventory_on_site');
  }
  const handleScroll = (event) => {
    const positionX = event.nativeEvent.contentOffset.x;
    const positionY = event.nativeEvent.contentOffset.y;
  };
  let status = inventory ? inventory.status : PENDING_DATA_UPLOAD;

  return (
    <SafeAreaView style={styles.mainContainer}>
      {renderViewLOCModal()}
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
                onLayout={(e) => {
                  setLayoutAboveMap(e.nativeEvent.layout.height);
                }}>
                <Header
                  closeIcon
                  headingText={i18next.t('label.inventory_overview_header_text')}
                  subHeadingText={i18next.t('label.inventory_overview_sub_header')}
                  onBackPress={() => navigation.navigate('TreeInventory')}
                  rightText={
                    status == INCOMPLETE_SAMPLE_TREE ||
                    status == INCOMPLETE ||
                    status == PENDING_DATA_UPLOAD
                      ? i18next.t('label.tree_review_delete')
                      : []
                  }
                  onPressFunction={() => setShowAlert(true)}
                />
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
                {(inventory?.status === INCOMPLETE ||
                  inventory?.status === INCOMPLETE_SAMPLE_TREE) &&
                inventory?.locateTree === ON_SITE ? (
                  <View style={{ position: 'absolute', top: 0, right: 0, paddingTop: 25 }}>
                    <TouchableOpacity
                      style={{
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        margin: 10,
                        backgroundColor: Colors.WHITE,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: Colors.LIGHT_BORDER_COLOR,
                      }}
                      onPress={() => addAnotherSampleTree()}>
                      <Text
                        style={{
                          color: '#007A49',
                          fontFamily: Typography.FONT_FAMILY_REGULAR,
                          fontSize: Typography.FONT_SIZE_14,
                          fontWeight: Typography.FONT_WEIGHT_BOLD,
                        }}>
                        {i18next.t('label.add_sample_tree')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  []
                )}
              </View>
              {showProject ? (
                <Label
                  leftText={i18next.t('label.tree_review_project')}
                  rightText={
                    selectedProjectName
                      ? selectedProjectName
                      : i18next.t('label.tree_review_unassigned')
                  }
                  onPressRightText={() =>
                    status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE
                      ? navigation.navigate('SelectProject', { selectedProjectId })
                      : {}
                  }
                  rightTextStyle={
                    status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE
                      ? { color: Colors.PRIMARY }
                      : { color: Colors.TEXT_COLOR }
                  }
                />
              ) : (
                []
              )}

              <Label
                leftText={i18next.t('label.inventory_overview_left_text_planted_species')}
                rightText={
                  status === INCOMPLETE || status === INCOMPLETE_SAMPLE_TREE
                    ? i18next.t('label.edit')
                    : ''
                }
                onPressRightText={handleSelectSpecies}
              />
              <FlatList
                data={inventory.species}
                renderItem={({ item }) => (
                  <Label
                    leftText={i18next.t('label.inventory_overview_loc_left_text', { item })}
                    rightText={i18next.t('label.inventory_overview_loc_right_text', { item })}
                    style={{ marginVertical: 10 }}
                    leftTextStyle={{
                      paddingLeft: 20,
                      fontFamily: Typography.FONT_FAMILY_REGULAR,
                    }}
                    rightTextStyle={{ color: Colors.TEXT_COLOR }}
                  />
                )}
              />
              {inventory && inventory.species.length <= 0 ? renderAddSpeciesButton(status) : null}
              {/* {renderPolygon(inventory.polygons, locationType)} */}
              {/* {inventory?.sampleTrees.length > 0 && (
                <SampleTreesReview
                  sampleTrees={inventory?.sampleTrees}
                  navigation={navigation}
                  totalSampleTrees={inventory.sampleTreesCount}
                  inventoryDispatch={dispatch}
                />
              )} */}
              {inventory?.completedSampleTreesCount == 0 && inventory?.locateTree === ON_SITE
                ? renderAddSampleTreeButton(status)
                : null}
              <LargeButton
                onPress={onPressExportJSON}
                heading={i18next.t('label.inventory_overview_loc_export_json')}
                active={false}
                medium
              />
              <Label leftText={i18next.t('label.additional_data')} rightText={''} />

              <AdditionalDataOverview data={inventory} />
            </ScrollView>
            {(inventory.status === INCOMPLETE || inventory.status === INCOMPLETE_SAMPLE_TREE) && (
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
        // setScrollAdjust={setScrollAdjust}
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
  const [countryCode, setCountryCode] = useState<string | undefined>();
  useEffect(() => {
    if (coordinateIndex || coordinateIndex === 0) {
      if (isSampleTree !== null && !isSampleTree) {
        setMarker(inventory?.polygons[0].coordinates[coordinateIndex]);
        initiateMarkerData(inventory?.polygons[0].coordinates[coordinateIndex]);
      } else if (isSampleTree !== null && isSampleTree) {
        setMarker(inventory?.sampleTrees[coordinateIndex - 1]);
        initiateMarkerData(inventory?.sampleTrees[coordinateIndex - 1]);
      }
    }
    getUserInformation().then((data) => {
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
        style={styles.outsideModalContainer}
        onPressIn={() => {
          setCoordinateModalShow(false);
          setCustomModalPosition();
          scrollAdjust = 0;
          initialState();
        }}
      />
      <View style={styles.modalContainer}>
        <View
          style={{
            width: 225,
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
      </View>
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
  markerContainer: {
    width: 30,
    height: 43,
    paddingBottom: 85,
  },
  markerText: {
    width: 30,
    height: 43,
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    paddingTop: 4,
  },
  screenMargin: {
    marginHorizontal: 25,
  },
  plantSpeciesText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  detailText: {
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  mapContainer: {
    backgroundColor: Colors.WHITE,
    height: 380,
    marginVertical: 25,
  },
  modalContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 3,
    // borderColor: 'green',
    position: 'relative',
  },
  outsideModalContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
