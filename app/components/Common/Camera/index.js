import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';
import { copyImageAndGetData } from '../../../utils/copyToFS';
import { toBase64 } from '../../../utils/base64';

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
  return (
    <RNCamera
      ratio={'1:1'}
      captureAudio={false}
      ref={camera}
      style={{ flex: 1 }}
      notAuthorizedView={
        <View>
          <Text>{i18next.t('label.permission_camera_message')}</Text>
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
});
