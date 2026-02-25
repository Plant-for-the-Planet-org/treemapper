import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useQuery, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { Colors, Typography } from 'src/utils/constants'
import Header from 'src/components/common/Header'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { updateMonitoringPlotData } from 'src/store/slice/monitoringPlotStateSlice'
import { useToast } from 'react-native-toast-notifications'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'

const { width } = Dimensions.get('window')
const IMAGE_SIZE = (width - 48) / 2

interface ImageItem {
    uri: string
    id: string
    dateTaken: number
}

const PlotGalleryView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'PlotGallery'>>()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { id: plotId } = route.params
    const realm = useRealm()
    const dispatch = useDispatch()
    const toast = useToast()
    const { updatePlotImage, addPlotImageRecord, deleteImageRecord } = useMonitoringPlotManagement()

    const [imageId, setImageId] = useState('')
    const imageDetails = useSelector((state: RootState) => state.cameraState)

    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)

    const realmImages = useQuery<{ image_id: string; local_uri: string; cdn_url: string; date_taken: number }>(
        RealmSchema.ImageData,
        collection => collection.filtered('parent_id == $0 AND type == $1', plotId, 'monitoring_plot'),
    )

    const images: ImageItem[] = realmImages
        .map(img => ({ uri: img.local_uri ? updateFilePath(img.local_uri) : img.cdn_url, id: img.image_id, dateTaken: img.date_taken }))
        .filter(item => item.uri !== '')

    useEffect(() => {
        if (imageDetails && imageDetails.id === imageId && imageId !== '') {
            console.log('Saving image for plot:', plotId, 'with URL:', JSON.stringify(imageDetails))
            handleSaveImage(imageDetails.url)
            setImageId('')
        }
    }, [imageDetails])

    const handleSaveImage = async (url: string) => {
        const result = await updatePlotImage(plotId, url)
        if (result) {
            await addPlotImageRecord(plotId, url)
            dispatch(updateMonitoringPlotData('PlotScreen'))
        } else {
            toast.show('Something went wrong')
        }
    }

    const handleAddImage = () => {
        const newID = String(new Date().getTime())
        setImageId(newID)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: 'PLOT_IMAGE',
            plotImage: true,
        })
    }

    const handleDeleteImage = (id: string) => {
        Alert.alert(
            'Delete Image',
            'Are you sure you want to delete this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteImageRecord(id)
                        if (!result) {
                            toast.show('Failed to delete image')
                        }
                    },
                },
            ],
        )
    }

    const renderImage = ({ item }: { item: ImageItem }) => {
        const dateLabel = item.dateTaken
            ? new Date(item.dateTaken).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
            : null
        return (
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                {dateLabel && (
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{dateLabel}</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(item.id)}>
                    <MaterialCommunityIcons name="trash-can" size={18} color={Colors.WHITE} />
                </TouchableOpacity>
            </View>
        )
    }

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons name="image-off-outline" size={64} color={Colors.NEW_PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>No Images Yet</Text>
            <Text style={styles.emptySubtitle}>Add photos to document this monitoring plot</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
                <MaterialCommunityIcons name="camera" size={20} color={Colors.WHITE} />
                <Text style={styles.addButtonLabel}>Add Image</Text>
            </TouchableOpacity>
        </View>
    )

    return (
        <SafeAreaView style={styles.container}>
            <Header label="Plot Gallery" />
            {images.length === 0 ? (
                renderEmpty()
            ) : (
                <View style={styles.galleryContainer}>
                    <FlatList
                        data={images}
                        renderItem={renderImage}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                    <TouchableOpacity style={styles.addMoreButton} onPress={handleAddImage}>
                        <MaterialCommunityIcons name="camera" size={20} color={Colors.WHITE} />
                        <Text style={styles.addButtonLabel}>Add More Images</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    )
}

export default PlotGalleryView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    galleryContainer: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
    },
    listContent: {
        padding: 12,
        paddingBottom: 90,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    imageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 6,
        padding: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        textAlign: 'center',
        marginBottom: 32,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.NEW_PRIMARY,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    addButtonLabel: {
        fontSize: 15,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
    },
    dateBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    dateText: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.WHITE,
    },
})
