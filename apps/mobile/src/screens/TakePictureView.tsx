import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { scaleSize } from 'src/utils/constants/mixins'
import CameraView from 'src/components/common/CameraView'
import { Colors } from 'src/utils/constants'
import type { CapturedPicture } from 'src/components/common/CameraView'
import ImagePreview from 'src/components/takePicture/ImagePreview'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import i18next from 'src/locales/index'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'

const TakePicture = () => {
  const [imageMetaData, setImageMetaData] = useState<CapturedPicture>({
    width: 0,
    height: 0,
    uri: '',
  })
  const route = useRoute<RouteProp<RootStackParamList, 'TakePicture'>>()
  const plotImage = route.params?.plotImage ?? false
  const posthog = usePostHog()

  const takePicture = (data: CapturedPicture) => {
    // Track every successful capture so we can compare photo_taken vs
    // photo_retaken to see how often field conditions require a second try.
    captureAnalyticsEvent(posthog, AnalyticsEvents.PHOTO_TAKEN, {
      is_plot_image: plotImage,
    })
    setImageMetaData(data)
  }
  const retakePicture = () => {
    captureAnalyticsEvent(posthog, AnalyticsEvents.PHOTO_RETAKEN, {
      is_plot_image: plotImage,
    })
    setImageMetaData({
      width: 0,
      height: 0,
      uri: '',
    })
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        label={i18next.t('label.take_picture')}
        note={plotImage?"Please take a picture of the plot.":!imageMetaData.uri? 'Please take a photo of the entire tree' : ''}
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
  headerLabel: {
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
