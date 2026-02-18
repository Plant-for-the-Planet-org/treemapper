import { Linking, Platform, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { CameraCapturedPicture, CameraView, PermissionStatus, useCameraPermissions } from 'expo-camera';
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
  const [cameraReady, setCameraReady] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const toast = useToast()

  useEffect(() => {
    if (!permission) {
      requestPermission()
    }
  }, [permission])

  const handleCameraReady = () => {
    setCameraReady(true)
  }

  const handleCameraMountError = (error: { message: string }) => {
    addNewLog({
      logType: 'INTERVENTION',
      message: 'Camera mount error',
      logLevel: 'error',
      statusCode: '',
      logStack: JSON.stringify(error)
    })
    toast.show('Camera failed to start. Please try again.')
  }

  const captureImage = async () => {
    if (!cameraReady) {
      toast.show('Camera is not ready yet. Please wait.')
      return
    }

    if (!cameraRef.current) {
      toast.show('Camera reference not available')
      return
    }

    try {
      setLoading(true)

      // Take picture with proper options
      // skipProcessing must be true on iOS to avoid native image processing
      // that can hang indefinitely on certain devices
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
        skipProcessing: Platform.OS === 'ios',
      })

      if (data && data.uri) {
        props.takePicture(data)
      } else {
        throw new Error('No image data returned from camera')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'

      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while capturing image',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify({
          message: errorMessage,
          stack: error?.stack,
          name: error?.name
        })
      })

      toast.show('Failed to capture image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onClickOpenSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings()
      } else {
        await Linking.openURL('app-settings:')
      }
    } catch (error) {
      toast.show('Unable to open settings')
    }
  }

  const renderCameraView = () => {
    return (
      <>
        <CameraView
          facing="back" // Use string literal, not translation
          style={styles.cameraWrapper}
          ref={cameraRef}
          onCameraReady={handleCameraReady}
          onMountError={handleCameraMountError}
          active={!loading} // Pause camera when processing
        />
        {loading && (
          <View style={styles.cameraBackDrop}>
            <ActivityIndicator size="large" color={Colors.WHITE} />
            <Text style={styles.loadingText}>Processing image...</Text>
          </View>
        )}
        {!cameraReady && !loading && (
          <View style={styles.cameraBackDrop}>
            <ActivityIndicator size="large" color={Colors.WHITE} />
            <Text style={styles.loadingText}>Initializing camera...</Text>
          </View>
        )}
      </>
    )
  }

  const renderPermissionRequest = () => {
    return (
      <>
        <Text style={styles.centerText}>
          {i18next.t('label.camera_permission')}
        </Text>
        <Text style={styles.centerTextNote} onPress={onClickOpenSettings}>
          {i18next.t('label.open_settings')}
        </Text>
      </>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {permission?.status === PermissionStatus.GRANTED 
          ? renderCameraView() 
          : renderPermissionRequest()
        }
      </View>
      <CustomButton
        label={i18next.t('label.take_picture')}
        containerStyle={styles.btnContainer}
        pressHandler={captureImage}
        loading={loading}
        disable={loading || !cameraReady || permission?.status !== PermissionStatus.GRANTED}
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
    height: '80%',
    borderTopColor: Colors.GRAY_BACKDROP,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: '5%',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.WHITE,
    marginTop: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 16,
  },
  btnContainer: {
    width: '100%',
    height: 80,
    position: 'absolute',
    bottom: '5%',
  },
})