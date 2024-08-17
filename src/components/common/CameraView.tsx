import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { CameraCapturedPicture, CameraView, PermissionStatus, useCameraPermissions } from 'expo-camera';
import { scaleSize } from 'src/utils/constants/mixins'
import CustomButton from './CustomButton'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'src/locales'
import useLogManagement from 'src/hooks/realm/useLogManagement';
import { useToast } from 'react-native-toast-notifications';


interface Props {
  takePicture: (metaData: CameraCapturedPicture) => void
}

const CameraMainView = (props: Props) => {
  const [permission, requestPermission] = useCameraPermissions()
  const { addNewLog } = useLogManagement()
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const toast = useToast()
  useEffect(() => {
    requestPermission()
  }, [])

  const captureImage = async () => {
    try {
      setLoading(true)
      const data = await cameraRef.current.takePictureAsync({ skipProcessing: true, quality: 0, base64: false })
      if (data) {
        props.takePicture(data)
      } else {
        setLoading(false)
      }
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error ocurred while capturing image',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      toast.show("Error Ocurred, Please try again");
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


  const showCameraOrLoading = () => {

    return <>
      <CameraView
        facing={i18next.t('label.back')}
        style={styles.cameraWrapper}
        ref={cameraRef}
      />
      {loading && <View style={styles.cameraBackDrop}></View>}
    </>
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {permission && permission.status !== PermissionStatus.GRANTED ? (
          <>
            <Text style={styles.centerText}>
              {i18next.t("label.camera_permission")}
            </Text>
            <Text style={styles.centerTextNote} onPress={onClickOpenSettings}>
              {i18next.t('label.open_settings')}
            </Text>
          </>
        ) : showCameraOrLoading()}
      </View>
      <CustomButton
        label={i18next.t("label.take_picture")}
        containerStyle={styles.btnContainer}
        pressHandler={captureImage}
        loading={loading}
        disable={loading}
        hideFadeIn
      />
    </View>
  )
}

export default CameraMainView

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
  tempLabel: {
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
    backgroundColor: Colors.BLACK
  },
  cameraBackDrop: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: Colors.BLACK,
    zIndex: 10
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 10,
  },
})
