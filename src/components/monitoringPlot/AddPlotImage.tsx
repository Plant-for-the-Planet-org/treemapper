import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from 'src/utils/constants'
import UploadSpecieIcon from 'assets/images/svg/UploadSpecieIcon.svg'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { SCALE_36, SCALE_26 } from 'src/utils/constants/spacing'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { useToast } from 'react-native-toast-notifications'
import { updateMonitoringPlotData } from 'src/store/slice/monitoringPlotStateSlice'

interface Props {
    image: string,
    plotID: string
}

const SpecieInfoImageSection = (props: Props) => {
    const { image, plotID } = props
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const imageDetails = useSelector((state: RootState) => state.cameraState)
    const [imageId, setImageId] = useState('')
    const { updatePlotImage } = useMonitoringPlotManagement()
    const toast = useToast()
    const dispatch = useDispatch()
    useEffect(() => {
        if (imageDetails && imageDetails.id === imageId) {
            handleUpdate(imageDetails.url)
            setImageId('')

        }
    }, [imageDetails])


    const handleUpdate = async (url: string) => {
        const result = await updatePlotImage(plotID, url)
        if (result) {
            dispatch(updateMonitoringPlotData('PlotScreen'))
        } else {
            toast.show("Something went wrong")
        }
    }



    const takePicture = () => {
        const newID = String(new Date().getTime())
        setImageId(newID)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: 'PLOT_IMAGE',
        })
    }


    return (
        <View style={styles.container}>
            {image === '' ? (
                <TouchableOpacity
                    style={styles.emptyImageContainer}
                    onPress={takePicture}>
                    <View style={{ alignItems: 'center' }}>
                        <UploadSpecieIcon />
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: image,
                        }}
                        style={styles.imageView}
                        resizeMode="cover"
                    />
                    <View style={styles.imageControls}>
                        <TouchableOpacity onPress={takePicture}>
                            <View style={[styles.iconContainer]}>
                                <PenIcon width={SCALE_26} height={SCALE_26} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { handleUpdate('') }}
                            style={styles.iconContainer}>
                            <BinIcon width={18} height={18} fill={Colors.TEXT_COLOR} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}

export default SpecieInfoImageSection

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    emptyImageContainer: {
        height: 200,
        backgroundColor: 'rgba(0,122,73,0.2)',
        borderRadius: 12,
        borderColor: 'rgb(0,122,73)',
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        width: '96%',
        marginLeft: '2%',
    },

    imageContainer: {
        borderRadius: 50,
        aspectRatio: 1
    },
    imageView: {
        borderRadius: 12,
        resizeMode: 'cover',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.TEXT_COLOR,
        aspectRatio: 1
    },
    imageControls: {
        position: 'absolute',
        bottom: 10,
        right: 10,

    },
    iconContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        width: SCALE_36,
        height: SCALE_36,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8
    },
})
