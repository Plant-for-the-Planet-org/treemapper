import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from 'src/utils/constants'
import UploadSpecieIcon from 'assets/images/svg/UploadSpecieIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { AFTER_CAPTURE } from 'src/types/type/app.type'
import { scaleSize } from 'src/utils/constants/mixins'

interface Props {
    image: string
    screenType: AFTER_CAPTURE
    onImageCaptured: (url: string) => void
}

const AddPlantImage = ({ image, screenType, onImageCaptured }: Props) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const imageDetails = useSelector((state: RootState) => state.cameraState)
    const [imageId, setImageId] = useState('')

    useEffect(() => {
        if (imageId && imageDetails.id === imageId) {
            onImageCaptured(imageDetails.url)
            setImageId('')
        }
    }, [imageDetails])

    const takePicture = () => {
        const newID = String(new Date().getTime())
        setImageId(newID)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: screenType,
        })
    }

    return (
        <View style={styles.container}>
            {image === '' ? (
                <TouchableOpacity style={styles.emptyImageContainer} onPress={takePicture}>
                    <UploadSpecieIcon />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={takePicture} activeOpacity={0.8}>
                    <Image
                        source={{ uri: image }}
                        style={styles.imageView}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            )}
        </View>
    )
}

export default AddPlantImage

const styles = StyleSheet.create({
    container: {
        width: '96%',
        marginLeft: '2%',
        paddingBottom: 16,
    },
    emptyImageContainer: {
        height: scaleSize(130),
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 12,
        borderColor: '#86C059',
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageView: {
        width: '100%',
        height: scaleSize(180),
        borderRadius: 12,
    },
})
