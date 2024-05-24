import {StyleSheet, Text, View} from 'react-native'
import React, {useEffect, useRef, useState} from 'react'
import {
  Camera,
  CameraCapturedPicture,
  CameraType,
  PermissionStatus,
} from 'expo-camera'
import {scaleSize} from 'src/utils/constants/mixins'
import CustomButton from './CustomButton'
import {Colors} from 'src/utils/constants'

interface Props {
  takePicture: (metaData: CameraCapturedPicture) => void
}

const CameraView = (props: Props) => {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef<Camera>(null)
  useEffect(() => {
    requestPermission()
  }, [])

  const captureImage = async () => {
    setLoading(true)
    const data = await cameraRef.current.takePictureAsync()
    if (data) {
      props.takePicture(data)
    } else {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {permission && permission.status !== PermissionStatus.GRANTED ? (
          <Text style={styles.centerText}>
            Please provide camera permission
          </Text>
        ) : (
          <Camera
            type={CameraType.back}
            style={styles.cameraWrapper}
            ref={cameraRef}
            ratio="1:1"
          />
        )}
      </View>
      <CustomButton
        label="Take Picture"
        containerStyle={styles.btnContainer}
        pressHandler={captureImage}
        loading={loading}
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
