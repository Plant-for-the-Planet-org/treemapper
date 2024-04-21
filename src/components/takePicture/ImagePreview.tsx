import {StyleSheet, View} from 'react-native'
import React from 'react'
import {CameraCapturedPicture} from 'expo-camera'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
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
import {updateSampleImageUrl} from 'src/store/slice/sampleTreeSlice'

interface Props {
  imageData: CameraCapturedPicture
  id: string
  screen: AFTER_CAPTURE
  retakePicture: () => void
}

const ImagePreview = (props: Props) => {
  const {imageData, id, screen, retakePicture} = props

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


    if (screen === 'SPECIES_INFO') {
      navigation.goBack()
      return;
    } 

    if (screen === 'SAMPLE_TREE') {
      dispatch(updateSampleImageUrl(finalURL))
      navigation.replace('AddMeasurment')
      return
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
          pressHandler={retakePicture}
          wrapperStyle={styles.borderWrapper}
          labelStyle={styles.highlightLabel}
        />
        <CustomButton
          label="Continue"
          containerStyle={styles.btnWrapper}
          pressHandler={navigateToNext}
          wrapperStyle={styles.noBorderWrapper}
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
    width: '95%',
    height: '85%',
    borderTopColor: Colors.GRAY_BACKDROP,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop:"5%"
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
  borderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '80%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_DARK,
  },
  noBorderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '80%',
    backgroundColor:Colors.PRIMARY_DARK,
    borderRadius: 12,
  },
  opaqueWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 10,
  },
  highlightLabel: {
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLable: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
})
