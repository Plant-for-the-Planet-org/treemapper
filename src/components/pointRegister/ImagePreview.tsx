import {StyleSheet, View} from 'react-native'
import React from 'react'
import {CameraCapturedPicture} from 'expo-camera'
import {scaleSize} from 'src/utils/constants/mixins'
import CustomButton from 'src/components/common/CustomButton'
import {Image} from 'expo-image'
import {Colors} from 'src/utils/constants'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {useDispatch} from 'react-redux'
import {updateImageDetails} from 'src/store/slice/takePictureSlice'
import {AFTER_CAPTURE} from 'src/types/type/app.type'
import {copyImageAndGetData} from 'src/utils/helpers/fileSystemHelper'
import {updateCoverImageURL} from 'src/store/slice/registerFormSlice'
interface Props {
  imageData: CameraCapturedPicture
  id: string
  screen: AFTER_CAPTURE
}

const ImagePreview = (props: Props) => {
  const {imageData, id, screen} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()

  const navigateToNext = async () => {
    const finalURL = await copyImageAndGetData(imageData.uri)
    dispatch(
      updateImageDetails({
        id: id,
        url: finalURL,
      }),
    )
    
    if (screen === 'POINT_REGISTER' || screen === 'POLYGON_REGISTER') {
      dispatch(updateCoverImageURL(finalURL))
    }

    if (screen === 'SPECIES_INFO') {
      navigation.goBack()
    } else {
      navigation.replace('ManageSpecies', {isSelectSpecies: true})
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Image
          style={styles.imageContainer}
          source={imageData.uri}
          contentFit="cover"
        />
      </View>
      <View style={styles.btnContainer}>
        <CustomButton
          label="Retake"
          containerStyle={styles.btnWrapper}
          pressHandler={() => {}}
        />
        <CustomButton
          label="Continue"
          containerStyle={styles.btnWrapper}
          pressHandler={navigateToNext}
        />
      </View>
    </View>
  )
}

export default ImagePreview

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  wrapper: {
    width: '92%',
    height: '70%',
    borderTopColor: Colors.GRAY_BACKDROP,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: scaleSize(50),
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  btnWrapper: {
    flex: 1,
    width: '90%',
  },
  imageContainer: {
    widht: '100%',
    height: '100%',
  },
})
