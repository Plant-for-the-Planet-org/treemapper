import { Image, StyleSheet, View, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { scaleSize } from 'src/utils/constants/mixins'
import { Colors } from 'src/utils/constants'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateImageDetails } from 'src/store/slice/takePictureSlice'
import { updateLastUpdatedAt } from 'src/store/slice/interventionSlice'

interface Props {
  image: string
  interventionID: string
  tag: 'EDIT_INTERVENTION' | 'EDIT_SAMPLE_TREE'
  isRegistered?: boolean
  treeId?: string
}

const IterventionCoverImage = (props: Props) => {
  const { image, tag, interventionID, treeId } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const imageDetails = useSelector((state: RootState) => state.cameraState)
  const { updateInterventionCoverImage, updateSampleTreeImage } = useInterventionManagement()
  const [imageId, setImageId] = useState('')
  const dispatch = useDispatch();


  useEffect(() => {
    if (imageId === imageDetails.id && imageId !== '') {
      if (tag === 'EDIT_INTERVENTION') {
        updateInterventionCoverImage(imageDetails.url, interventionID)
        dispatch(updateLastUpdatedAt())
      } else {
        updateSampleTreeImage(interventionID, treeId, imageDetails.url)
        dispatch(updateLastUpdatedAt())
      }
      dispatch(updateImageDetails({
        id: '',
        url: ''
      }))
    }
  }, [imageDetails])

  const editImage = () => {
    const newID = String(new Date().getTime())
    setImageId(newID)
    navigation.navigate('TakePicture', {
      id: newID,
      screen: tag,
    })
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.editIconWrapper} onPress={editImage}>
        <PenIcon width={30} height={30} />
      </TouchableOpacity>
      {image.length !== 0 ? <Image source={{ uri: image }} style={styles.imageWrapper} /> : <View style={styles.svgWrapper} />}
    </View>
  )
}

export default IterventionCoverImage

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(250),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  imageWrapper: {
    width: '90%',
    height: '95%',
    borderRadius: 12,
    backgroundColor: 'black',
  },
  svgWrapper: {
    width: '90%',
    height: '95%',
    borderRadius: 12,
    backgroundColor: Colors.BLACK,
  },
  editIconWrapper: {
    width: 30, height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    top: '6%',
    right: '8%',
    zIndex: 1
  }
})
