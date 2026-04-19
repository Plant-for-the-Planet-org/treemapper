import { StyleSheet, View, ActivityIndicator, Text } from 'react-native'
import React, { useState, useEffect } from 'react'
import type { CapturedPicture } from 'src/components/common/CameraView'
import CustomButton from 'src/components/common/CustomButton'
import * as ExpoImage from 'expo-image'
import { Colors, Typography } from 'src/utils/constants'
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
import { useToast } from 'react-native-toast-notifications'

interface Props {
  imageData: CapturedPicture
  id: string
  screen: AFTER_CAPTURE
  retakePicture: () => void
}

const ImagePreview = (props: Props) => {
  const { imageData, id, screen, retakePicture } = props
  const interventionID = useSelector((state: RootState) => state.sampleTree.form_id)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const toast = useToast()

  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Validate image data on mount
    if (!imageData.uri) {
      setImageError(true)
      setImageLoading(false)
      toast.show('Invalid image data. Please retake the picture.')
    }
  }, [imageData.uri])

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = (error: any) => {
    console.error('Image load error:', error)
    setImageLoading(false)
    setImageError(true)
    toast.show('Failed to load image. Please retake the picture.')
  }

  const navigateToNext = async () => {
    if (processing) return

    try {
      setProcessing(true)

      // Validate image URI before processing
      if (!imageData.uri) {
        throw new Error('Image URI is invalid')
      }

      const hasSpecies = 
        screen === 'SPECIES_INFO' || 
        screen === 'PLOT_IMAGE' || 
        screen === 'REMEASUREMENT_IMAGE'

      const getBasics = () => {
        if (hasSpecies) {
          return { uid: id, hasSpecies: true }
        }
        return {
          uid: interventionID || id,
          hasSpecies: false
        }
      }

      const basics = getBasics()

      // Copy image to permanent storage
      const finalURL = await copyImageAndGetData(
        imageData.uri, 
        basics.uid, 
        basics.hasSpecies
      )

      if (!finalURL) {
        throw new Error('Failed to save image')
      }

      // Update Redux store with the permanent image URL
      dispatch(
        updateImageDetails({
          id: id,
          url: finalURL,
        })
      )

      // Navigate based on screen type
      if (
        screen === 'SPECIES_INFO' || 
        screen === 'EDIT_INTERVENTION' || 
        screen === 'EDIT_SAMPLE_TREE' || 
        screen === 'PLOT_IMAGE' || 
        screen === 'REMEASUREMENT_IMAGE'
      ) {
        navigation.goBack()
        return
      }

      if (screen === 'SAMPLE_TREE') {
        dispatch(updateSampleImageUrl(finalURL))
        navigation.navigate('AddMeasurement')
      }
    } catch (error: any) {
      console.error('Error processing image:', error)
      const errorMessage = error?.message || 'Failed to process image'
      toast.show(`${errorMessage}. Please try again.`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRetake = () => {
    if (processing) return
    retakePicture()
  }

  const renderImageContent = () => {
    if (imageError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load image</Text>
          <Text style={styles.errorSubText}>Please retake the picture</Text>
        </View>
      )
    }

    return (
      <>
        <ExpoImage.Image
          style={styles.imageContainerPreview}
          source={{ uri: imageData.uri }}
          contentFit="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          cachePolicy="none"
        />
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.PRIMARY_DARK} />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        )}
      </>
    )
  }

  return (
    <View style={styles.containerPreview}>
      <View style={styles.wrapperPreview}>
        {renderImageContent()}
      </View>
      <View style={styles.btnContainerPreview}>
        <CustomButton
          label={i18next.t('label.retake')}
          containerStyle={styles.btnWrapperPreview}
          pressHandler={handleRetake}
          wrapperStyle={styles.borderWrapperPreview}
          labelStyle={styles.highlightLabelPreview}
          disable={processing}
          hideFadeIn
        />
        <CustomButton
          label={i18next.t('label.continue')}
          containerStyle={styles.btnWrapperPreview}
          pressHandler={navigateToNext}
          wrapperStyle={styles.noBorderWrapperPreview}
          loading={processing}
          disable={processing || imageError || imageLoading}
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
    marginTop: '5%',
    backgroundColor: Colors.GRAY_BACKDROP,
  },
  btnContainerPreview: {
    width: '95%',
    height: 80,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
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
  highlightLabelPreview: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
})