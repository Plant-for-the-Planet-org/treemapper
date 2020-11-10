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
} from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { Colors, Typography } from '_styles';
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  updateLastScreen,
  getInventory,
  statusToPending,
  updateSpeceiName,
  updateSpeceiDiameter,
  updatePlantingDate,
  initiateInventory,
} from '../../Actions';
import { store } from '../../Actions/store';
import { LocalInventoryActions } from '../../Actions/Action';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import i18next from 'i18next';

const SingleTreeOverview = ({ navigation }) => {
  const specieDiameterRef = useRef();

  const { state, dispatch } = useContext(store);
  const [inventory, setInventory] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isSpeciesEnable, setIsSpeciesEnable] = useState(false);
  const [isShowDate, setIsShowDate] = useState(false);
  const [plantationDate, setPLantationDate] = useState(new Date());

  const [specieText, setSpecieText] = useState('');
  const [specieDiameter, setSpecieDiameter] = useState('10');

  useEffect(() => {
    let data = { inventory_id: state.inventoryID, last_screen: 'SingleTreeOverview' };
    updateLastScreen(data);
    const unsubscribe = navigation.addListener('focus', () => {
      getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
        inventory.species = Object.values(inventory.species);
        inventory.polygons = Object.values(inventory.polygons);
        setInventory(inventory);
        setSpecieText(inventory.specei_name);
        setSpecieDiameter(inventory.species_diameter);
        setPLantationDate(new Date(Number(inventory.plantation_date)).toLocaleDateString());
      });
    });
  }, []);

  const onSubmitInputFeild = (action) => {
    if (action === 'specieText') {
      updateSpeceiName({ inventory_id: state.inventoryID, specieText: specieText });
    } else {
      updateSpeceiDiameter({
        inventory_id: state.inventoryID,
        speceisDiameter: Number(specieDiameter),
      });
    }
  };

  const onPressNextIcon = () => {
    if (isSpeciesEnable) {
      onSubmitInputFeild('specieText');
      setTimeout(() => {
        setIsSpeciesEnable(false);
        setTimeout(() => {
          specieDiameterRef.current.focus();
        }, 0);
      }, 0);
    } else {
      setIsOpenModal(false);
      onSubmitInputFeild('specieDiameter');
    }
  };

  const renderinputModal = () => {
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
                  {isSpeciesEnable
                    ? i18next.t('label.tree_review_name_of_species')
                    : i18next.t('label.tree_review_diameter')}
                </Text>
                {isSpeciesEnable ? (
                  <TextInput
                    value={specieText}
                    style={styles.value}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    onChangeText={(text) => setSpecieText(text)}
                    onSubmitEditing={() => onSubmitInputFeild('specieText')}
                    keyboardType={'email-address'}
                  />
                ) : (
                  <TextInput
                    ref={specieDiameterRef}
                    value={specieDiameter}
                    style={styles.value}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    keyboardType={'number-pad'}
                    onChangeText={(text) => setSpecieDiameter(text)}
                    onSubmitEditing={() => onSubmitInputFeild('specieDiameter')}
                  />
                )}
                <MCIcon
                  onPress={onPressNextIcon}
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
    setIsOpenModal(true);
    if (action == 'species') {
      setTimeout(() => setIsSpeciesEnable(true), 0);
    } else {
      setTimeout(() => setIsSpeciesEnable(false), 0);
    }
  };

  const renderDateModal = () => {
    const onChangeDate = (e, selectedDate) => {
      updatePlantingDate({
        inventory_id: state.inventoryID,
        plantation_date: `${selectedDate.getTime()}`,
      });
      setIsShowDate(false);
      setPLantationDate(selectedDate);
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
    let shouldEdit = inventory.status == 'incomplete';
    let detailHeaderStyle = !imageSource
      ? [styles.detailHeader, styles.defaulFontColor]
      : [styles.detailHeader];
    let detailContainerStyle = imageSource ? [styles.detailSubContainer] : [{}];

    return (
      <View style={detailContainerStyle}>
        <View>
          <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_location')}</Text>
          <Text style={styles.detailText}>
            {`${coords.latitude.toFixed(5)}˚N,${coords.longitude.toFixed(5)}˚E`}{' '}
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
                ? i18next.t('label.tree_review_specie_diameter', { specieDiameter })
                : i18next.t('label.tree_review_unable')}{' '}
              {shouldEdit && <MIcon name={'edit'} size={20} />}
            </Text>
          </TouchableOpacity>
        </View>

        {!imageSource && (
          <View>
            <Text style={detailHeaderStyle}>{i18next.t('label.tree_review_plantation_date')}</Text>
            <TouchableOpacity
              disabled={!shouldEdit}
              onPress={() => setIsShowDate(true)}
              accessible={true}
              accessibilityLabel={i18next.t('label.tree_review_register_planting_date')}
              testID="register_planting_date">
              <Text style={styles.detailText}>
                {i18next.t('label.tree_review_plantation_date_text', {
                  date: new Date(Number(plantationDate)),
                })}{' '}
                {shouldEdit && <MIcon name={'edit'} size={20} />}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const onPressSave = () => {
    if (inventory.status == 'complete') {
      navigation.navigate('TreeInventory');
    } else {
      if (specieText) {
        let data = { inventory_id: state.inventoryID };
        statusToPending(data).then(() => {
          navigation.navigate('TreeInventory');
        });
      } else {
        alert('Species Name  is required');
      }
    }
  };

  const onPressNextTree = () => {
    if (inventory.status == 'incomplete') {
      statusToPending({ inventory_id: state.inventoryID }).then(() => {
        initiateInventory({ treeType: 'single' }).then((inventoryID) => {
          dispatch(LocalInventoryActions.setInventoryId(inventoryID));
          navigation.push('RegisterSingleTree');
        });
      });
    } else {
      navigation.goBack('TreeInventory');
    }
  };

  const onBackPress = () => {
    if (inventory.status == 'incomplete') {
      navigation.navigate('RegisterSingleTree', { isEdit: true });
    } else {
      goBack();
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {renderinputModal()}
      {renderDateModal()}
      <View style={styles.container}>
        <Header
          closeIcon
          onBackPress={onBackPress}
          headingText={i18next.t('label.tree_review_header')}
        />
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {inventory && (
            <View style={styles.overViewContainer}>
              {imageSource && <Image source={imageSource} style={styles.bgImage} />}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0)',
                  imageSource ? Colors.GRAY_LIGHTEST : 'rgba(255,255,255,0)',
                ]}
                style={styles.detailContainer}>
                {renderDetails(inventory)}
              </LinearGradient>
            </View>
          )}
        </ScrollView>
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
  },
  detailContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollViewContainer: {
    flex: 1,
    marginTop: 20,
  },
  detailHeader: {
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginVertical: 5,
  },
  detailText: {
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.PRIMARY,
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
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    padding: 20,
  },
});
