import MapboxGL from '@react-native-mapbox-gl/maps';
import i18next from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  BackHandler,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SvgXml } from 'react-native-svg';
import Share from 'react-native-share';
import { Colors, Typography } from '_styles';
import { marker_png, plus_icon, two_trees } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import {
  addSpeciesAction,
  changeInventoryStatus,
  getInventory,
  updateLastScreen,
  updatePlantingDate,
  deleteInventory,
} from '../../repositories/inventory';
import { ALPHABETS, bugsnag } from '../../utils';
import { Header, InventoryCard, Label, LargeButton, PrimaryButton } from '../Common';
import AlertModal from '../Common/AlertModal';
import { INCOMPLETE, INCOMPLETE_SAMPLE_TREE, OFF_SITE } from '../../utils/inventoryConstants';
import { toBase64 } from '../../utils/base64';
import SampleTreesReview from '../SampleTrees/SampleTreesReview';

const InventoryOverview = ({ navigation }) => {
  const cameraRef = useRef();

  const { state, dispatch } = useContext(InventoryContext);

  const [inventory, setInventory] = useState(null);
  const [locationTitle, setLocationTitle] = useState('');
  const [selectedLOC, setSelectedLOC] = useState(null);
  const [isLOCModalOpen, setIsLOCModalOpen] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', hardBackHandler);

    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
      let data = { inventory_id: state.inventoryID, lastScreen: 'InventoryOverview' };
      updateLastScreen(data);
    });
    return () => {
      unsubscribe();
      BackHandler.removeEventListener('hardwareBackPress', hardBackHandler);
    };
  }, []);

  const hardBackHandler = () => {
    navigation.navigate('TreeInventory');
    return true;
  };

  const initialState = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      setInventory(inventory);
    });
  };

  const renderPolygon = (polygons, locationType) => {
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
                    index: index,
                  };
                  return (
                    <InventoryCard
                      data={normalizeData}
                      activeBtn={inventory.status === 'complete'}
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

  const onPressViewLOC = (index) => {
    let selectedCoords = inventory.polygons[0].coordinates[index];
    let normalCoords = [selectedCoords.longitude, selectedCoords.latitude];
    setSelectedLOC(normalCoords);
    setLocationTitle(ALPHABETS[index]);
    setIsLOCModalOpen(!isLOCModalOpen);
  };

  const onPressSave = () => {
    if (inventory.status === INCOMPLETE || inventory.status === INCOMPLETE_SAMPLE_TREE) {
      if (inventory.species.length > 0) {
        let data = { inventory_id: state.inventoryID, status: 'pending' };
        changeInventoryStatus(data, dispatch).then(() => {
          navigation.navigate('TreeInventory');
        });
      } else {
        alert(i18next.t('label.inventory_overview_select_species'));
      }
    } else {
      navigation.navigate('TreeInventory');
    }
  };

  const focusMarker = () => {
    cameraRef.current.setCamera({
      centerCoordinate: selectedLOC,
      zoomLevel: 18,
      animationDuration: 2000,
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
            {selectedLOC && (
              <MapboxGL.PointAnnotation id={'markerContainer1'} coordinate={selectedLOC}>
                <ImageBackground
                  source={marker_png}
                  style={styles.markerContainer}
                  resizeMode={'cover'}>
                  <Text style={styles.markerText}>
                    {i18next.t('label.inventory_overview_loc', { locationTitle })}
                  </Text>
                </ImageBackground>
              </MapboxGL.PointAnnotation>
            )}
          </MapboxGL.MapView>
        </View>
      </Modal>
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

  const onPressExportJSON = async () => {
    const exportGeoJSONFile = () => {
      if (inventory.polygons.length > 0) {
        const featureList = inventory.polygons.map((onePolygon) => {
          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: onePolygon.coordinates.map((oneCoordinate) => [
                oneCoordinate.longitude,
                oneCoordinate.latitude,
              ]),
            },
          };
        });
        if (inventory.sampleTrees.length > 0) {
          for (const sampleTree of inventory.sampleTrees) {
            featureList.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [sampleTree.longitude, sampleTree.latitude],
              },
            });
          }
        }
        const geoJSON = {
          type: 'FeatureCollection',
          features: featureList,
        };
        const options = {
          url: 'data:application/json;base64,' + toBase64(JSON.stringify(geoJSON)),
          message: i18next.t('label.inventory_overview_export_json_message'),
          title: i18next.t('label.inventory_overview_export_json_title'),
          filename: `Tree Mapper GeoJSON ${inventory.inventory_id}`,
          saveToFiles: true,
        };
        Share.open(options)
          .then(() => {
            alert(i18next.t('label.inventory_overview_export_json_success'));
          })
          .catch(() => alert(i18next.t('label.inventory_overview_export_json_error')));
      }
    };
    if (Platform.OS == 'android') {
      const permissionResult = await askAndroidStoragePermission();
      if (permissionResult) {
        exportGeoJSONFile();
      }
    } else {
      exportGeoJSONFile();
    }
  };

  const onChangeDate = (selectedDate) => {
    setShowDate(false);
    setInventory({ ...inventory, plantation_date: selectedDate });
    updatePlantingDate({
      inventory_id: state.inventoryID,
      plantation_date: selectedDate,
    });
  };

  const renderDatePicker = () => {
    const handleConfirm = (data) => onChangeDate(data);
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

  const renderAddSpeciesButton = (status) => {
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
          <View style={styles.bannerImgContainer}>
            <SvgXml xml={plus_icon} />
          </View>
          <View style={styles.bannerImgContainer}>
            <SvgXml xml={two_trees} />
          </View>
        </TouchableOpacity>
      )
    );
  };

  const onPressDate = (status) => {
    if (status === INCOMPLETE && inventory.locateTree === OFF_SITE) {
      setShowDate(true);
    }
  };

  const onPressSaveAndContinueMultiple = (selectedSpeciesList) => {
    //  Add it to local Db
    addSpeciesAction({ inventory_id: state.inventoryID, species: selectedSpeciesList }).then(() => {
      initialState();
    });
  };

  const handleSelectSpecies = () => {
    navigation.navigate('TotalTreesSpecies');
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

  let status = inventory ? inventory.status : 'pending';

  return (
    <SafeAreaView style={styles.mainContainer}>
      {renderViewLOCModal()}
      <View style={styles.container}>
        {inventory !== null ? (
          <View style={styles.cont}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
              <Header
                closeIcon
                headingText={i18next.t('label.inventory_overview_header_text')}
                subHeadingText={i18next.t('label.inventory_overview_sub_header')}
                onBackPress={() => navigation.navigate('TreeInventory')}
              />
              {/* {status !== INCOMPLETE_SAMPLE_TREE && (
                <TouchableOpacity
                  style={{ paddingTop: 15 }}
                  onPress={() => setShowDeleteAlert(true)}>
                  <Text
                    style={{
                      fontFamily: Typography.FONT_FAMILY_REGULAR,
                      fontSize: Typography.FONT_SIZE_18,
                      lineHeight: Typography.LINE_HEIGHT_24,
                    }}>
                    {i18next.t('label.tree_review_delete')}
                  </Text>
                </TouchableOpacity>
              )} */}
              <Label
                leftText={i18next.t('label.inventory_overview_left_text')}
                rightText={i18next.t('label.inventory_overview_date', {
                  date: new Date(inventory.plantation_date),
                })}
                onPressRightText={() => onPressDate(status)}
              />
              {!isSingleCoordinate && (
                <Label leftText={`${locateType} Registration`} rightText={''} />
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
                    style={{ marginVertical: 5 }}
                    leftTextStyle={{ paddingLeft: 20, fontWeight: 'normal' }}
                  />
                )}
              />
              {inventory && inventory.species.length <= 0 ? renderAddSpeciesButton(status) : null}
              {renderPolygon(inventory.polygons, locationType)}
              {inventory?.sampleTrees.length > 0 && (
                <SampleTreesReview sampleTrees={inventory.sampleTrees} />
              )}
              <LargeButton
                onPress={onPressExportJSON}
                heading={i18next.t('label.inventory_overview_loc_export_json')}
                active={false}
                medium
              />
            </ScrollView>
            {(inventory.status === INCOMPLETE || inventory.status === INCOMPLETE_SAMPLE_TREE) && (
              <View style={styles.bottomButtonContainer}>
                <PrimaryButton
                  onPress={onPressSave}
                  btnText={i18next.t('label.inventory_overview_loc_save')}
                />
              </View>
            )}
          </View>
        ) : null}
      </View>
      <AlertModal
        visible={showDeleteAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={
          status === 'complete'
            ? i18next.t('label.tree_review_delete_uploaded_registration')
            : i18next.t('label.tree_review_delete_not_yet_uploaded_registration')
        }
        primaryBtnText={i18next.t('label.tree_inventory_alert_primary_btn_text')}
        secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
        onPressPrimaryBtn={handleDeleteInventory}
        onPressSecondaryBtn={() => setShowDeleteAlert(!showDeleteAlert)}
        showSecondaryButton={true}
      />
      {renderDatePicker()}
    </SafeAreaView>
  );
};
export default InventoryOverview;

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
});
