import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useRef, useState } from 'react';
import { Image, Linking, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { PrimaryButton } from '../../components/Common';
import Header from '../../components/Common/Header';
import { InventoryContext } from '../../reducers/inventory';
import dbLog from '../../repositories/logs';
import { addImageToPlantLocationHistory } from '../../repositories/plantLocationHistory';
import { Colors, Typography } from '../../styles';
import { LogTypes } from '../../utils/constants';
import { copyImageAndGetData } from '../../utils/FSInteration';

type Props = {};

// TODO: Make this component common for all the screens where Image Capture is used
const TakePicture = ({}: Props) => {
  const [imagePath, setImagePath] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const camera = useRef();
  const navigation = useNavigation();

  const { state } = useContext(InventoryContext);

  const onClickOpenSettings = async () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  };

  // handles the camera taking a picture and stores the image in [imagePath]
  const onPressCamera = async () => {
    if (imagePath) {
      setImagePath('');
      return;
    }
    setIsCapturing(true);
    const data = await camera?.current?.takePictureAsync().catch((err: any) => {
      alert(i18next.t('label.permission_camera_message'));
      dbLog.error({
        logType: LogTypes.OTHER,
        message: `Failed to take picture ${err}`,
        logStack: JSON.stringify(err),
      });
      setImagePath('');
      return;
    });
    if (data) {
      setImagePath(data.uri);
    }
    setIsCapturing(false);
  };

  // stores the imagePath in the plant location history data
  // TODO: Refactor this function to store the image according to the flow
  const onPressContinue = async () => {
    if (imagePath) {
      try {
        const imageUrl = await copyImageAndGetData(imagePath);
        let data: any = {
          remeasurementId: state.selectedRemeasurementId,
          lastScreen: 'RemeasurementReview',
          imageUrl,
        };
        await addImageToPlantLocationHistory(data);
        navigation.navigate('RemeasurementReview');
      } catch (err) {
        console.error('error while saving file', err);
      }
    } else {
      alert(i18next.t('label.image_capturing_required'));
    }
  };

  return (
    <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
      {/* shows the header text */}
      <View style={styles.screenMargin}>
        <Header
          // onBackPress={() => {}}
          hideBackIcon
          headingText={i18next.t('label.image_capturing_header')}
          subHeadingText={i18next.t('label.image_capturing_sub_header')}
          style={{ marginTop: 20 }}
        />
      </View>
      <View style={styles.container}>
        {/* if image path is present then shows the image with buttons to Retak and Continue */}
        {/* else shows cameara to take the picture */}
        <View style={styles.container}>
          {imagePath ? (
            <Image source={{ uri: imagePath }} style={styles.container} />
          ) : (
            <View style={styles.cameraContainer}>
              <RNCamera
                ratio={'1:1'}
                captureAudio={false}
                ref={camera}
                style={styles.container}
                notAuthorizedView={
                  <View
                    style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.message}>
                      {i18next.t('label.permission_camera_message')}
                    </Text>
                    {Platform.OS === 'ios' ? (
                      <Text style={styles.message} onPress={onClickOpenSettings}>
                        {i18next.t('label.open_settings')}
                      </Text>
                    ) : (
                      []
                    )}
                  </View>
                }
                androidCameraPermissionOptions={{
                  title: i18next.t('label.permission_camera_title'),
                  message: i18next.t('label.permission_camera_message'),
                  buttonPositive: i18next.t('label.permission_camera_ok'),
                  buttonNegative: i18next.t('label.permission_camera_cancel'),
                }}
              />
            </View>
          )}
        </View>
      </View>
      {/* shows the button depending on the imagePath */}
      <View style={[styles.bottomBtnsContainer, { justifyContent: 'space-between' }]}>
        <PrimaryButton
          onPress={isCapturing ? () => {} : onPressCamera}
          btnText={
            imagePath ? i18next.t('label.image_retake') : i18next.t('label.image_click_picture')
          }
          theme={imagePath ? 'white' : null}
          halfWidth={imagePath}
        />
        {imagePath ? (
          <PrimaryButton
            disabled={imagePath ? false : true}
            onPress={onPressContinue}
            btnText={i18next.t('label.continue')}
            halfWidth={true}
          />
        ) : (
          []
        )}
      </View>
    </SafeAreaView>
  );
};

export default TakePicture;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  screenMargin: {
    marginHorizontal: 25,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    marginHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  message: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
    padding: 20,
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
  bottomBtnsWidth: {
    width: '100%',
  },
});
