import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraCapturedPicture,
  CameraType,
  PermissionStatus,
} from 'expo-camera'
import { scaleSize } from 'src/utils/constants/mixins'
import CustomButton from './CustomButton'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'src/locales'


interface Props {
  takePicture: (metaData: CameraCapturedPicture) => void
}

const CameraView = (props: Props) => {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [loading, setLoading] = useState(true)
  const cameraRef = useRef<Camera>(null)

  useEffect(() => {
    requestPermission()
  }, [])

  const captureImage = async () => {
    setLoading(true)
    const data = await cameraRef.current.takePictureAsync({skipProcessing:true})
    if (data) {
      props.takePicture(data)
    } else {
      setLoading(false)
    }
  }
  const onClickOpenSettings = async () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:')
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {permission && permission.status !== PermissionStatus.GRANTED ? (
          <>
            <Text style={styles.centerText}>
              Please provide camera permission
            </Text>
            <Text style={styles.centerTextNote} onPress={onClickOpenSettings}>
              {i18next.t('label.open_settings')}
            </Text>
          </>
        ) : (
          <Camera
            type={CameraType.back}
            style={styles.cameraWrapper}
            ref={cameraRef}
            onCameraReady={() => {
              setLoading(false)
            }}
            ratio="1:1"
          />
        )}
      </View>
      <CustomButton
        label="Take Picture"
        containerStyle={styles.btnContainer}
        pressHandler={captureImage}
        loading={loading}
        disable={loading}
        hideFadein
      />
    </View>
  )
}

export default CameraView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  wrapper: {
    width: '95%',
    height: '85%',
    borderTopColor: Colors.GRAY_BACKDROP,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: '5%',
  },
  tempLable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    marginTop: 100,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  },
  centerTextNote: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    marginTop: 50,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  },
  cameraWrapper: {
    width: '100%',
    height: '100%',
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
})
