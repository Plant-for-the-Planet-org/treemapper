import React, { useEffect, useContext, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { Colors, Typography } from '_styles';
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  updateSpecieName,
  updateSpecieDiameter,
  initiateInventory,
  getInventory,
  changeInventoryStatus,
  updatePlantingDate,
  deleteInventory,
  updateLastScreen,
  updateSpecieHeight,
} from '../../repositories/inventory';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import i18next from 'i18next';
import { initiateInventoryState } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { getUserInformation } from '../../repositories/user';
import { INCOMPLETE_INVENTORY } from '../../utils/inventoryStatuses';

const SingleTreeOverview = ({ navigation }) => {
  const specieDiameterRef = useRef();

  const { state: inventoryState, dispatch } = useContext(InventoryContext);
  const [inventory, setInventory] = useState();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isShowDate, setIsShowDate] = useState(false);
  const [plantationDate, setPlantationDate] = useState(new Date());
  const [specieText, setSpecieText] = useState('');
  const [specieEditText, setSpecieEditText] = useState('');
  const [specieDiameter, setSpecieDiameter] = useState('');
  const [specieEditDiameter, setSpecieEditDiameter] = useState('');
  const [specieHeight, setSpecieHeight] = useState('');
  const [specieEditHeight, setSpecieEditHeight] = useState('');
  const [locateTree, setLocateTree] = useState(null);
  const [editEnable, setEditEnable] = useState('');
  const [status, setStatus] = useState('');
  const [countryCode, setCountryCode] = useState('');

  useEffect(() => {
    let data = { inventory_id: inventoryState.inventoryID, last_screen: 'SingleTreeOverview' };
    updateLastScreen(data);
    const unsubscribe = navigation.addListener('focus', () => {
      getInventory({ inventoryID: inventoryState.inventoryID }).then((inventory) => {
        inventory.species = Object.values(inventory.species);
        inventory.polygons = Object.values(inventory.polygons);
        setInventory(inventory);
        setStatus(inventory.status);
        setSpecieText(inventory.specei_name);
        setLocateTree(inventory.locate_tree);
        setSpecieDiameter(Math.round(inventory.species_diameter * 100) / 100);
        setSpecieHeight(Math.round(inventory.species_height * 100) / 100);
        setPlantationDate(new Date(Number(inventory.plantation_date)));
      });
    });
    Country();
  }, []);

  const onSubmitInputField = (action) => {
    const dimensionRegex = /^[0-9]{1,5}\.?[0-9]{0,2}$/;
    if (action === 'species' && specieEditText !== '') {
      setSpecieText(specieEditText);
      updateSpecieName({ inventory_id: inventoryState.inventoryID, speciesText: specieEditText });
      setIsOpenModal(false);
    } else if (
      action === 'diameter' &&
      specieEditDiameter !== '' &&
      Number(specieEditDiameter) !== 0 &&
      dimensionRegex.test(specieEditDiameter)
    ) {
      setSpecieDiameter(specieEditDiameter);
      updateSpecieDiameter({
        inventory_id: inventory.inventory_id,
        speciesDiameter: Number(specieEditDiameter),
      });
      setIsOpenModal(false);
    } else if (
      action === 'height' &&
      specieEditHeight !== '' &&
      Number(specieEditHeight) !== 0 &&
      dimensionRegex.test(specieEditHeight)
    ) {
      setSpecieHeight(specieEditHeight);
      updateSpecieHeight({
        inventory_id: inventory.inventory_id,
        speciesHeight: Number(specieEditHeight),
      });
      setIsOpenModal(false);
    } else {
      console.log('Something wrong!');
      Alert.alert(
        'Error',
        'Please Enter Valid Input',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false },
      );
      setIsOpenModal(false);
    }
    setEditEnable('');
  };

  const Country = () => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  };

  const Countries = ['US', 'LR', 'MM'];

  const renderInputModal = () => {
    return (
      <Modal transparent={true} visible={isOpenModal}>
        <View style={styles.cont}>
          <View style={styles.cont}>
            <View style={styles.cont} />
            <KeyboardAvoidingView
              behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
              style={styles.bgWhite}>
              <View style={styles.externalInputContainer}>
                <Text style={styles.labelModal}>
                  {editEnable === 'species'
                    ? i18next.t('label.tree_review_name_of_species')
                    : editEnable === 'diameter'
                      ? i18next.t('label.tree_review_diameter')
                      : 'Height'}
                </Text>
                {editEnable === 'species' ? (
                  <TextInput
                    value={specieEditText}
                    style={styles.value}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    onChangeText={(text) => setSpecieEditText(text.replace(/  +/g, ' '))}
                    onSubmitEditing={() => onSubmitInputField(editEnable)}
                    keyboardType={'email-address'}
                  />
                ) : editEnable === 'diameter' ? (
                  <TextInput
                    ref={specieDiameterRef}
                    value={specieEditDiameter.toString()}
                    style={styles.value}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    keyboardType={'decimal-pad'}
                    onChangeText={(text) => setSpecieEditDiameter(text.replace(/[^0-9.]/g, ''))}
                    onSubmitEditing={() => onSubmitInputField(editEnable)}
                  />
                ) : (
                  <TextInput
                    value={specieEditHeight.toString()}
                    style={styles.value}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    keyboardType={'decimal-pad'}
                    onChangeText={(text) => setSpecieEditHeight(text.replace(/[^0-9.]/g, ''))}
                    onSubmitEditing={() => onSubmitInputField('height')}
                  />
                )}
                <MCIcon
                  onPress={() => onSubmitInputField(editEnable)}
                  name={'arrow-right'}
                  size={30}
                  color={Colors.PRIMARY}
                />
              </View>
              <SafeAreaView />
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    );
  };

  const onPressEditSpecies = (action) => {
    setEditEnable(action);
    setIsOpenModal(true);
  };

  const renderDateModal = () => {
    const onChangeDate = (e, selectedDate) => {
      updatePlantingDate({
        inventory_id: inventoryState.inventoryID,
        plantation_date: `${selectedDate.getTime()}`,
      });
      setIsShowDate(false);
      setPlantationDate(selectedDate);
    };
    const handleConfirm = (data) => onChangeDate(null, data);
    const hideDatePicker = () => setIsShowDate(false);

    return (
      isShowDate && (
        <DateTimePickerModal
          isVisible={true}
          maximumDate={new Date()}
          testID="dateTimePicker1"
          timeZoneOffsetInMinutes={0}
          value={new Date(plantationDate)}
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
    filePath = inventory.polygons[0]?.coordinates[0]?.imageUrl;
    imageSource = filePath ? { uri: filePath } : false;
  }
  const renderDetails = ({ polygons }) => {
    let coords;
    if (polygons[0]) {
      coords = polygons[0].coordinates[0];
    }
    let shouldEdit =
      inventory.status === INCOMPLETE_INVENTORY ? true : inventory.status == null ? true : false;
    let detailHeaderStyle = !imageSource
      ? [styles.detailHeader, styles.defaulFontColor]
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
                Countries.includes(countryCode)
                  ? `${Math.round(specieDiameter * 100) / 100}inches`
                  : `${Math.round(specieDiameter * 100) / 100}cm`
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 5 }}>
          <Text style={detailHeaderStyle}>Height (in m)</Text>
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
                ? Countries.includes(countryCode)
                  ? `${Math.round(specieHeight * 100) / 100}foot`
                  : `${Math.round(specieHeight * 100) / 100}m`
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
                date: plantationDate,
              })}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      // </ScrollView>
    );
  };

  // const renderOnSite = ({ polygons }) => {
  //   let coords;
  //   if (polygons[0]) {
  //     coords = polygons[0].coordinates[0];
  //   }

  //   return (
  //     <View
  //       style={{
  //         paddingTop: 20,
  //         fontFamily: Typography.FONT_FAMILY_REGULAR,
  //         fontSize: Typography.FONT_SIZE_18,
  //       }}>
  //       <View
  //         style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 }}>
  //         <Text style={styles.detailHead}>Location</Text>
  //         <Text style={styles.detailTxt}>
  //           {`${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`}{' '}
  //         </Text>
  //       </View>
  //       <View
  //         style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 }}>
  //         <Text style={styles.detailHead}>Species</Text>
  //         <Text style={styles.detailTxt}>{specieText} </Text>
  //       </View>
  //       <View
  //         style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 }}>
  //         <Text style={styles.detailHead}>Diameter</Text>
  //         <Text style={styles.detailTxt}>{`${specieDiameter}cm`} </Text>
  //       </View>
  //       <View
  //         style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 }}>
  //         <Text style={styles.detailHead}>Date</Text>
  //         <Text style={styles.detailTxt}>{`${specieDiameter}cm`} </Text>
  //       </View>
  //     </View>
  //   );
  // };
  const onPressSave = () => {
    if (inventory.status == 'complete') {
      navigation.navigate('TreeInventory');
    } else {
      if (specieText) {
        let data = { inventory_id: inventoryState.inventoryID, status: 'pending' };
        changeInventoryStatus(data, dispatch).then(() => {
          navigation.navigate('TreeInventory');
        });
      } else {
        alert('Species Name  is required');
      }
    }
  };

  // const onPressSaveOnSite = () => {
  //   if (inventory.status == 'complete') {
  //     navigation.navigate('TreeInventory');
  //   } else {
  //     if (specieText) {
  //       let data = { inventory_id: state.inventoryID };
  //       statusToComplete(data).then(() => {
  //         navigation.navigate('RegisterSingleTree');
  //       });
  //     } else {
  //       alert('Species Name  is required');
  //     }
  //   }
  // };
  const onPressNextTree = () => {
    if (inventory.status === INCOMPLETE_INVENTORY) {
      changeInventoryStatus(
        { inventory_id: inventoryState.inventoryID, status: 'pending' },
        dispatch,
      ).then(async () => {
        const result = await initiateInventory({ treeType: 'single' }, dispatch);
        if (result) {
          initiateInventoryState(result)(dispatch);
          navigation.navigate('RegisterSingleTree');
        }
      });
    } else {
      navigation.goBack('TreeInventory');
    }
  };

  const onBackPress = () => {
    if (inventory.status === INCOMPLETE_INVENTORY) {
      navigation.navigate('RegisterSingleTree', { isEdit: true });
    } else {
      goBack();
    }
  };

  const onBackPressOnSite = () => {
    navigation.navigate('TreeInventory');
    // setIsShowSpeciesListModal(true);
    // if (direction){
    //   navigation.navigate('SelectSpecies', {species: inventory.species, inventory: inventory});
    // }else {
    // navigation.goBack();
    // }
  };

  // const renderSpeciesModal = () => {
  //   const closeSelectSpeciesModal = () => setIsShowSpeciesListModal(false);
  //   if(inventory) {
  //     return (
  //       <SelectSpecies
  //         species={inventory.species}
  //         visible={isShowSpeciesListModal}
  //         closeSelectSpeciesModal={closeSelectSpeciesModal}
  //         treeType={inventory.locate_tree}
  //         onPressSaveAndContinue={onPressSaveAndContinue}
  //       />
  //     );
  //   } else {
  //     return;
  //   }
  // };

  const goBack = () => {
    navigation.goBack();
  };

  const handleDeleteInventory = () => {
    deleteInventory(
      { inventory_id: inventory.inventory_id },
      inventory.status === 'pending' ? dispatch : null,
    )
      .then(() => {
        navigation.navigate('TreeInventory');
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {renderInputModal()}
      {renderDateModal()}
      {/* {renderSpeciesModal()} */}
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {locateTree === 'on-site' ? (
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 0 }}>
              <Header
                closeIcon
                onBackPress={onBackPressOnSite}
                headingText={i18next.t('label.tree_review_header')}
              />
              <TouchableOpacity style={{ paddingTop: 15 }} onPress={handleDeleteInventory}>
                <Text
                  style={{
                    fontFamily: Typography.FONT_FAMILY_REGULAR,
                    fontSize: Typography.FONT_SIZE_18,
                    lineHeight: Typography.LINE_HEIGHT_24,
                  }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Header
              closeIcon
              onBackPress={onBackPress}
              headingText={
                locateTree === 'off-site' ? 'Tree Details' : i18next.t('label.tree_review_header')
              }
            />
          )}

          <View style={styles.scrollViewContainer}>
            {inventory && locateTree !== 'on-site' && (
              <>
                {imageSource && <Image source={imageSource} style={styles.bgImage} />}
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0)',
                    imageSource ? Colors.GRAY_LIGHTEST : 'rgba(255,255,255,0)',
                  ]}
                  style={styles.detailContainer}>
                  {renderDetails(inventory)}
                </LinearGradient>
              </>
            )}
            {locateTree === 'on-site' && (
              <>
                {imageSource && <Image source={imageSource} style={styles.imgSpecie} />}
                {renderDetails(inventory)}
              </>
            )}
          </View>
        </ScrollView>
        {/* {locateTree === 'on-site' ? (
          <PrimaryButton
            onPress={onPressNextTree}
            btnText={i18next.t('label.tree_review_next_btn')}

          />
        ) : */}
        {status === INCOMPLETE_INVENTORY ? (
          <View style={styles.bottomBtnsContainer}>
            <PrimaryButton
              onPress={onPressNextTree}
              btnText={i18next.t('label.tree_review_next_btn')}
              halfWidth
              theme={'white'}
            />
            <PrimaryButton
              onPress={onPressSave}
              btnText={i18next.t('label.tree_review_Save')}
              halfWidth
            />
          </View>
        ) : (
          []
        )}
      </View>
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
  externalInputContainer: {
    flexDirection: 'row',
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 25,
    borderTopWidth: 0.5,
    borderColor: Colors.TEXT_COLOR,
  },
  value: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    flex: 1,
    paddingVertical: 10,
  },
  labelModal: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
    marginRight: 10,
  },
  defaulFontColor: {
    color: Colors.TEXT_COLOR,
  },
  detailSubContainer: {
    paddingTop: 10,
  },
  imgSpecie: {
    // marginTop: 0,
    width: '100%',
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 13,
    marginTop: 24,
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
