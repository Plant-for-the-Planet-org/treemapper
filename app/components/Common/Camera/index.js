import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';

export default function index({handleCamera}) {
  const camera = useRef();
  // const [imagePath, setImagePath] = useState(null);

  const takePicture =async () => {
    const options = { quality: 0.5 };
    const data = await camera.current.takePictureAsync(options).catch((err) => {
      alert(i18next.t('label.permission_camera_message'));
    });
    // setImagePath(data.uri);
    handleCamera(data.uri);
  };
  return (
    <RNCamera
      ratio={'1:1'}
      captureAudio={false}
      ref={camera}
      style={{flex: 1}}
      notAuthorizedView={(<View><Text>{i18next.t('label.permission_camera_message')}</Text></View>)}
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
