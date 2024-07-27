import { Image, StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'

import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateImageDetails } from 'src/store/slice/takePictureSlice'

interface Props {
  image: string
  interventionID: string
  tag: 'EDIT_INTERVENTION' | 'EDIT_SAMPLE_TREE'
  treeId?: string
  isCDN?:boolean
}

const InterventionCoverImage = (props: Props) => {
  const { image, tag, interventionID, treeId, isCDN } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const imageDetails = useSelector((state: RootState) => state.cameraState)
  const {updateSampleTreeImage } = useInterventionManagement()
  const [imageId, setImageId] = useState('')
  const dispatch = useDispatch();


  useEffect(() => {
    if (imageId === imageDetails.id && imageId !== '') {
        updateSampleTreeImage(interventionID, treeId, imageDetails.url)
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

  const clearImage = () => {
      updateSampleTreeImage(interventionID, treeId, '')
  }


  const uri  = isCDN?`${process.env.EXPO_PUBLIC_API_PROTOCOL}://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/project/large/${image}`:image
  return (
    <View style={styles.container}>
      {uri.length>0 && <View style={styles.wrapper}>
      {!isCDN && <TouchableOpacity style={styles.editIconWrapper} onPress={editImage}>
        <PenIcon width={30} height={30} />
      </TouchableOpacity>}
      {!treeId && <TouchableOpacity style={styles.editBinWrapper} onPress={clearImage}>
        <BinIcon width={15} height={15} fill={Colors.TEXT_COLOR} />
      </TouchableOpacity>}
      <Image source={{ uri: uri }} style={styles.imageWrapper} />
      </View>}
      {uri.length===0 && <View style={styles.emptyContainer}>
      {!isCDN && <TouchableOpacity style={styles.editIconWrapper} onPress={editImage}>
        <PenIcon width={30} height={30} />
      </TouchableOpacity>}
      <View style={styles.emptyWrapper}>
        <Text style={styles.emptyLabel}>Add Cover Image</Text>
      </View>
      </View>}
    </View>
  )
}

export default InterventionCoverImage

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper:{
    width: '100%',
    height: scaleSize(250),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  imageWrapper: {
    width: '90%',
    height: '95%',
    borderRadius: 10,
    backgroundColor: 'black',
  },
  emptyContainer:{
    width: '100%',
    height: scaleSize(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyWrapper: {
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
    height:50,
    width:'90%',
    borderRadius:8
  },
  emptyLabel:{
    fontSize:16,
    fontFamily:Typography.FONT_FAMILY_SEMI_BOLD,
    color:Colors.TEXT_COLOR
  },
  editIconWrapper: {
    width: 30, height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    top: 20,
    right: '8%',
    zIndex: 1
  },
  editBinWrapper: {
    width: 30, height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    top: 60,
    right: '8%',
    zIndex: 1
  },
  label: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE,
    textAlign:'center'
  }
})
