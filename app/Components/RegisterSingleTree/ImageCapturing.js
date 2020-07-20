import React, {useState, useContext, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {Header, PrimaryButton} from '../Common';
import {Colors, Typography} from '_styles';
import {insertImageSingleRegisterTree, getInventory} from '../../Actions';
import {store} from '../../Actions/store';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RNCamera} from 'react-native-camera';

const ImageCapturing = ({updateScreenState}) => {
  const camera = useRef();

  const navigation = useNavigation();
  const {state} = useContext(store);
  const [imagePath, setImagePath] = useState('');
  const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);

  useEffect(() => {
    getInventory({inventoryID: state.inventoryID}).then(inventory => {
      if (inventory.polygons[0]?.coordinates[0]?.imageUrl) {
        setImagePath(inventory.polygons[0].coordinates[0].imageUrl);
      }
    });
  }, [state.inventoryID]);

  const onPressCamera = async () => {
    if (imagePath) {
      setImagePath('');
      return;
    }
    const options = {quality: 0.5};
    const data = await camera.current.takePictureAsync(options);
    setImagePath(data.uri);
  };

  const onPressClose = () => {
    setIsAlrightyModalShow(false);
  };

  const onPressContinue = () => {
    // Save Image in local
    if (imagePath) {
      let data = {inventory_id: state.inventoryID, imageUrl: imagePath};
      insertImageSingleRegisterTree(data).then(() => {
        setIsAlrightyModalShow(false);
        navigation.navigate('SingleTreeOverview');
      });
    } else {
      alert('Image is required');
    }
  };

  const onBackPress = () => {
    updateScreenState('MapMarking');
  };

  return (
    <SafeAreaView style={styles.container} fourceInset={{bottom: 'always'}}>
      <View style={styles.screenMargin}>
        <Header
          onBackPress={onBackPress}
          closeIcon
          headingText={`Location A`}
          subHeadingText={'Please take a picture facing planted trees.'}
        />
      </View>
      <View style={styles.container}>
        <View style={styles.container}>
          {imagePath ? (
            <Image source={{uri: imagePath}} style={styles.container} />
          ) : (
            <View style={styles.cameraContainer}>
              <RNCamera
                ratio={'1:1'}
                captureAudio={false}
                ref={camera}
                style={styles.container}
                androidCameraPermissionOptions={{
                  title: 'Permission to use camera',
                  message: 'We need your permission to use your camera',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={onPressCamera}
          style={styles.cameraIconContainer}>
          <View style={styles.cameraIconCont}>
            <Ionicons
              name={imagePath ? 'md-reverse-camera' : 'md-camera'}
              size={25}
            />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomBtnsContainer}>
        <PrimaryButton btnText={'Back'} halfWidth theme={'white'} />
        <PrimaryButton
          disabled={imagePath ? false : true}
          onPress={onPressContinue}
          btnText={'Continue'}
          halfWidth
        />
      </View>
    </SafeAreaView>
  );
};
export default ImageCapturing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
  },
  imageBelowTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    marginHorizontal: 25,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  screenMargin: {
    marginHorizontal: 25,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
  message: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  cameraIconCont: {
    width: 55,
    height: 55,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    borderWidth: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
});
