import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { scaleSize } from 'src/utils/constants/mixins'
import CameraView from 'src/components/common/CameraView'
import { Colors } from 'src/utils/constants'
import { CameraCapturedPicture } from 'expo-camera'
import ImagePreview from 'src/components/takePicture/ImagePreview'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'

const TakePicture = () => {
  const [imageMetaData, setImageMetaData] = useState<CameraCapturedPicture>({
    width: 0,
    height: 0,
    uri: '',
  })
  const route = useRoute<RouteProp<RootStackParamList, 'TakePicture'>>()
  const takePicture = (data: CameraCapturedPicture) => {
    setImageMetaData(data)
  }
  const retakePicture = () => {
    setImageMetaData({
      width: 0,
      height: 0,
      uri: '',
    })
  }
  return (
    <SafeAreaView style={styles.container}>
      <Header
        label="Take Picture"
        note={!imageMetaData.uri ? 'Please take a photo of the entire tree' : ''}
      />
      {imageMetaData.uri ? (
        <ImagePreview
          imageData={imageMetaData}
          id={route.params.id}
          screen={route.params.screen}
          retakePicture={retakePicture}
        />
      ) : (
        <CameraView takePicture={takePicture} />
      )}
    </SafeAreaView>
  )
}

export default TakePicture

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  section: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerNoteWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerLable: {
    textAlign: 'center',
  },
  backDropWrapper: {
    width: '100%',
    height: scaleSize(200),
    backgroundColor: Colors.NEW_PRIMARY,
    zIndex: -1,
    position: 'absolute',
    top: 0,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
})
