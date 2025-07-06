import { StyleSheet, View } from 'react-native'
import React from 'react'
import { CameraCapturedPicture } from 'expo-camera'
import CustomButton from 'src/components/common/CustomButton'
import * as ExpoImage from 'expo-image';
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { updateImageDetails } from 'src/store/slice/takePictureSlice'
import { AFTER_CAPTURE } from 'src/types/type/app.type'
import { copyImageAndGetData } from 'src/utils/helpers/fileSystemHelper'
import { updateSampleImageUrl } from 'src/store/slice/sampleTreeSlice'
import { RootState } from 'src/store'
import i18next from 'src/locales'

interface Props {
  imageData: CameraCapturedPicture
  id: string
  screen: AFTER_CAPTURE
  retakePicture: () => void
}

const ImagePreview = (props: Props) => {
  const { imageData, id, screen, retakePicture } = props
  const interventionID = useSelector((state: RootState) => state.sampleTree.form_id)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()

  const navigateToNext = async () => {
    const hasSpecies = screen === 'SPECIES_INFO' || screen === 'PLOT_IMAGE' ||  screen === 'REMEASUREMENT_IMAGE' 
    const getBasics = () => {
      if (screen === 'SPECIES_INFO'  || screen === 'PLOT_IMAGE' || screen === 'REMEASUREMENT_IMAGE') {
        return { uid: id, hasSpecies: hasSpecies }
      }
      return {
        uid: interventionID || id,
        hasSpecies: hasSpecies || false
      }
    }
    const d = getBasics()
    const finalURL = await copyImageAndGetData(imageData.uri, d.uid, d.hasSpecies)
    dispatch(
      updateImageDetails({
        id: id,
        url: finalURL,
      }),
    )
    if (screen === 'SPECIES_INFO' || screen === 'EDIT_INTERVENTION' || screen === 'EDIT_SAMPLE_TREE' || screen === 'PLOT_IMAGE' || screen === 'REMEASUREMENT_IMAGE') {
      navigation.goBack()
      return;
    }

    if (screen === 'SAMPLE_TREE') {
      dispatch(updateSampleImageUrl(finalURL))
      navigation.navigate('AddMeasurement')
    }
  }

  return (
    <View style={styles.containerPreview}>
      <View style={styles.wrapperPreview}>
        <ExpoImage.Image
          style={styles.imageContainerPreview}
          source={imageData.uri}
          contentFit="cover"
        />
      </View>
      <View style={styles.btnContainerPreview}>
        <CustomButton
          label={i18next.t('label.retake')}
          containerStyle={styles.btnWrapperPreview}
          pressHandler={retakePicture}
          wrapperStyle={styles.borderWrapperPreview}
          labelStyle={styles.highlightLabelPreview}
          hideFadeIn
        />
        <CustomButton
          label={i18next.t('label.continue')}
          containerStyle={styles.btnWrapperPreview}
          pressHandler={navigateToNext}
          wrapperStyle={styles.noBorderWrapperPreview}
          hideFadeIn
        />
      </View>
    </View>
  )
}

export default ImagePreview

const styles = StyleSheet.create({
  containerPreview: {
    flex: 1,
    alignItems: 'center',
  },
  wrapperPreview: {
    width: '95%',
    height: '80%',
    borderTopColor: Colors.GRAY_BACKDROP,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: "5%"
  },
  btnContainerPreview: {
    width: '95%',
    height:80,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: '5%',
  },
  btnWrapperPreview: {
    flex: 1,
    width: '90%',
  },
  imageContainerPreview: {
    width: '100%',
    height: '100%',
  },
  borderWrapperPreview: {
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
  noBorderWrapperPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '80%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 12,
  },
  opaqueWrapperPreview: {
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
  highlightLabelPreview: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLabelPreview: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
})
