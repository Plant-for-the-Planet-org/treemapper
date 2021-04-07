import i18next from 'i18next';
import React, { useRef } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import { copyImageAndGetData } from '../../../utils/copyToFS';
import { Colors, Typography } from '_styles';

export default function Camera({ handleCamera }) {
  const camera = useRef();

  const takePicture = async () => {
    const options = { quality: 0.5, base64: true };
    const data = await camera.current.takePictureAsync(options).catch((err) => {
      alert(i18next.t('label.permission_camera_message'));
    });
    // setImagePath(data.uri);
    const base64Image = data.base64;
    const fsurl = await copyImageAndGetData(data.uri);
    handleCamera({ uri: data.uri, fsurl, base64Image });
  };

  const onClickOpenSettings = async () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  };

  return (
    <RNCamera
      ratio={'1:1'}
      captureAudio={false}
      ref={camera}
      style={{ flex: 1 }}
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
      }}>
      <TouchableOpacity
        activeOpacity={0.5}
        style={styles.btnAlignment}
        onPress={() => takePicture()}>
        <Icon name="camera" size={50} color="#fff" />
      </TouchableOpacity>
    </RNCamera>
  );
}

const styles = StyleSheet.create({
  btnAlignment: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
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
});
