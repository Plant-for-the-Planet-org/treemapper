import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  PermissionsAndroid,
  ImageBackground,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { Header, LargeButton, PrimaryButton, Label, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native';
import {
  getInventory,
  changeInventoryStatus,
  updatePlantingDate,
  updateLastScreen,
  addSpeciesAction,
} from '../../repositories/inventory';
import MapboxGL from '@react-native-mapbox-gl/maps';
import RNFetchBlob from 'rn-fetch-blob';
import { marker_png, plus_icon, two_trees } from '../../assets';
import { APLHABETS } from '../../utils';
import { bugsnag } from '../../utils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { Colors, Typography } from '_styles';
import { SvgXml } from 'react-native-svg';
import { TouchableOpacity } from 'react-native-gesture-handler';
import i18next from 'i18next';
import SelectSpecies from '../SelectSpecies/index';
import { InventoryContext } from '../../reducers/inventory';

const InventoryOverview = ({ navigation }) => {
  const cameraRef = useRef();

  const { state, dispatch } = useContext(InventoryContext);

  const [inventory, setInventory] = useState(null);
  const [locationTitle, setlocationTitle] = useState('');
  const [selectedLOC, setSelectedLOC] = useState(null);
  const [isLOCModalOpen, setIsLOCModalOpen] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [isShowSpeciesListModal, setIsShowSpeciesListModal] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initiatState();
      let data = { inventory_id: state.inventoryID, last_screen: 'InventoryOverview' };
      updateLastScreen(data);
    });
  }, []);

  const initiatState = () => {
    getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
      inventory.species = Object.values(inventory.species);
      inventory.polygons = Object.values(inventory.polygons);
      setInventory(inventory);
    });
  };
  `Location Type: ${locationType}`;
  const renderPolygon = (polygons, locationType) => {
    return (
      <FlatList
        keyboardShouldPersistTaps={'always'}
        data={polygons}
        renderItem={({ item, index }) => {
          return (
            <View>
              <Label
                leftText={i18next.t('label.tree_inventory_overview_polygon_left_text', {
                  locationType,
                })}
                rightText={''}
              />
              <FlatList
                data={Object.values(item.coordinates)}
                renderItem={({ item: oneCoordinate, index }) => {
                  let normalizeData = {
                    title: `Coordinate ${APLHABETS[index]}`,
                    subHeading: `${oneCoordinate.latitude.toFixed(
                      5,
                    )}˚N,${oneCoordinate.longitude.toFixed(7)}˚E`,
                    date: 'View location',
                    imageURL: oneCoordinate.imageUrl,
                    index: index,
                  };
                  return (
                    <InventoryCard
                      data={normalizeData}
                      activeBtn={inventory.status === 'complete' ? true : false}
                      onPressActiveBtn={onPressViewLOC}
                    />
                  );
                }}
              />
            </View>
          );
        }}
      />
    );
  };

  const onPressViewLOC = (index) => {
    let selectedCoords = Object.values(inventory.polygons[0].coordinates)[index];
    let normalCoords = [selectedCoords.longitude, selectedCoords.latitude];
    setSelectedLOC(normalCoords);
    setlocationTitle(APLHABETS[index]);
    setIsLOCModalOpen(!isLOCModalOpen);
  };

  const onPressSave = () => {
    if (inventory.status == 'incomplete') {
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
    return new Promise(async (resolve, reject) => {
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
          resolve();
        } else {
          Alert.alert(
            i18next.t('label.storage_permission_denied_header'),
            i18next.t('label.storage_permission_denied_sub_header'),
          );
        }
      } catch (err) {
        reject();
        bugsnag.notify(err);
      }
    });
  };

  const onPressExportJSON = async () => {
    let exportgeoJSONFile = () => {
      inventory.species = Object.values(inventory.species);
      inventory.polygons = Object.values(inventory.polygons);
      if (inventory.polygons.length > 0) {
        let featureList = inventory.polygons.map((onePolygon) => {
          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: Object.values(onePolygon.coordinates).map((oneCoordinate) => [
                oneCoordinate.longitude,
                oneCoordinate.latitude,
              ]),
            },
          };
        });
        let geoJSON = {
          type: 'FeatureCollection',
          features: featureList,
        };
        let fileName = `Tree Mapper GeoJSON ${inventory.inventory_id}.json`;
        let path = `${
          Platform.OS == 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : RNFetchBlob.fs.dirs.DownloadDir
        }/${fileName}`;
        RNFetchBlob.fs
          .writeFile(path, JSON.stringify(geoJSON), 'utf88')
          .then((success) => {
            alert(
              `GeoJSON file export in ${Platform.OS == 'ios' ? 'document' : 'download'} directory`,
            );
          })
          .catch((err) => alert(i18next.t('label.inventory_overview_export_json_error')));
      }
    };
    if (Platform.OS == 'android') {
      askAndroidStoragePermission().then(() => {
        exportgeoJSONFile();
      });
    } else {
      exportgeoJSONFile();
    }
  };

  const renderDatePicker = () => {
    const handleConfirm = (data) => onChangeDate(null, data);
    const hideDatePicker = () => setShowDate(false);

    return (
      showDate && (
        <DateTimePickerModal
          isVisible={showDate}
          maximumDate={new Date()}
          testID="dateTimssePicker"
          timeZoneOffsetInMinutes={0}
          value={new Date(Number(inventory.plantation_date))}
          mode={'date'}
          is24Hour={true}
          display="default"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )
    );
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDate(false);
    setInventory({ ...inventory, plantation_date: `${selectedDate.getTime()}` });
    updatePlantingDate({
      inventory_id: state.inventoryID,
      plantation_date: `${selectedDate.getTime()}`,
    });
  };

  const renderAddSpeciesButton = (status) => {
    return (
      status == 'incomplete' && (
        <TouchableOpacity
          onPress={() => setIsShowSpeciesListModal(true)}
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
    status == 'incomplete' && inventory.locate_tree == 'off-site' ? setShowDate(true) : null;
  };

  const onPressSaveAndContinueMultiple = (selectedspeciesList) => {
    //  Add it to local Db
    addSpeciesAction({ inventory_id: state.inventoryID, species: selectedspeciesList }).then(() => {
      initiatState();
    });
  };

  const renderSelectSpeciesModal = () => {
    const closeSelectSpeciesModal = () => setIsShowSpeciesListModal(false);
    if (inventory) {
      console.log(inventory);
      return (
        <SelectSpecies
          speciess={inventory.species}
          invent={inventory}
          visible={isShowSpeciesListModal}
          closeSelectSpeciesModal={closeSelectSpeciesModal}
          onPressSaveAndContinueMultiple={onPressSaveAndContinueMultiple}
        />
      );
    } else {
      return;
    }
  };

  let locationType;
  let isSingleCoordinate, locateType;
  if (inventory) {
    isSingleCoordinate = Object.keys(inventory.polygons[0].coordinates).length == 1;
    locationType = isSingleCoordinate
      ? i18next.t('label.tree_inventory_point')
      : i18next.t('label.tree_inventory_polygon');
    locateType =
      inventory.locate_tree == 'off-site'
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
              <Label
                leftText={i18next.t('label.inventory_overview_left_text')}
                rightText={i18next.t('label.inventory_overview_date', {
                  date: new Date(Number(inventory.plantation_date)),
                })}
                onPressRightText={() => onPressDate(status)}
              />
              {!isSingleCoordinate && (
                <Label leftText={`${locateType} Registration`} rightText={''} />
              )}
              <Label
                leftText={i18next.t('label.inventory_overview_left_text_planted_species')}
                rightText={status == 'incomplete' ? i18next.t('label.edit') : ''}
                onPressRightText={() => setIsShowSpeciesListModal(true)}
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
              <LargeButton
                onPress={onPressExportJSON}
                heading={i18next.t('label.inventory_overview_loc_export_json')}
                active={false}
                medium
              />
            </ScrollView>
            <View>
              <View style={styles.bottomBtnsContainer}>
                <PrimaryButton
                  btnText={i18next.t('label.inventory_overview_loc_next_tree')}
                  halfWidth
                  theme={'white'}
                />
                <PrimaryButton
                  onPress={onPressSave}
                  btnText={i18next.t('label.inventory_overview_loc_save')}
                  halfWidth
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
      {renderDatePicker()}
      {renderSelectSpeciesModal()}
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
  bottomBtnsContainer: {
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
