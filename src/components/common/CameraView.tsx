import {StyleSheet, Text, View} from 'react-native'
import React, {useEffect, useRef} from 'react'
import {Camera, CameraCapturedPicture, CameraType, PermissionStatus} from 'expo-camera'
import {scaleSize} from 'src/utils/constants/mixins'
import CustomButton from './CustomButton'

interface Props{
  takePicture:(metaData: CameraCapturedPicture)=>void;
}

const CameraView = (props:Props) => {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const cameraRef = useRef<Camera>(null)
  useEffect(() => {
    requestPermission()
  }, [])

  const captureImage = async () => {
    const data = await cameraRef.current.takePictureAsync()
    if(data){
      props.takePicture(data)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {permission && permission.status !== PermissionStatus.GRANTED ? (
          <Text>Please provide camera permission</Text>
        ) : (
          <Camera type={CameraType.back} style={styles.cameraWrapper} ref={cameraRef}/>
        )}
      </View>
      <CustomButton
        label="Select location & continue"
        containerStyle={styles.btnContainer}
        pressHandler={captureImage}
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
    width: '92%',
    height: '70%',
    backgroundColor: 'blue',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: scaleSize(50),
  },
  tempLable: {
    justifyContent: 'center',
    alignItems: 'center',
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
