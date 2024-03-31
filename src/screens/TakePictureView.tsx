import {StyleSheet, Text, View} from 'react-native'
import React, {useState} from 'react'
import Header from 'src/components/common/Header'
import {scaleSize} from 'src/utils/constants/mixins'
import CameraView from 'src/components/common/CameraView'
import {Colors} from 'src/utils/constants'
import {CameraCapturedPicture} from 'expo-camera'
import ImagePreview from 'src/components/pointRegister/ImagePreview'
import {useRoute, RouteProp} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation.type'

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

  return (
    <View style={styles.container}>
      <Header label="Take picture" />
      <View style={styles.headerNoteWrapper}>
        <Text style={styles.headerLable}>
          Please take a picture in which {'\n'} the tree is visible
        </Text>
      </View>
      <View style={styles.backDropWrapper} />
      {imageMetaData.uri ? (
        <ImagePreview
          imageData={imageMetaData}
          id={route.params.id}
          screen={route.params.screen}
        />
      ) : (
        <CameraView takePicture={takePicture} />
      )}
    </View>
  )
}

export default TakePicture

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
