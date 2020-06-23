import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { getAreaName, createOfflineMap, getAllOfflineMaps } from "../../Actions";
import MapboxGL from '@react-native-mapbox-gl/maps';
import { MAPBOXGL_ACCCESS_TOKEN } from 'react-native-dotenv';
import Geolocation from '@react-native-community/geolocation';


MapboxGL.setAccessToken(MAPBOXGL_ACCCESS_TOKEN);
const DownloadMap = ({ navigation }) => {
    const [isLoaderShow, setIsLoaderShow] = useState(false)
    const [areaName, setAreaName] = useState('')
    const [numberOfOfflineMaps, setNumberOfOfflineMaps] = useState(0)

    const MapBoxGLRef = useRef();
    const MapBoxGLCameraRef = useRef();

    useEffect(() => {
        navigation.addListener('focus', () => {
            getAllOfflineMaps()
        })
    }, [])

    const getAllOfflineMaps = async () => {
        const packs = await MapboxGL.offlineManager.getPacks()
        setNumberOfOfflineMaps(packs.length)
    }

    const initialMapCamera = () => {
        Geolocation.getCurrentPosition(position => {
            MapBoxGLCameraRef.current.setCamera({
                centerCoordinate: [position.coords.longitude, position.coords.latitude],
                zoomLevel: 15,
                animationDuration: 2000,
            })
        }, (err) => alert(err.message));

    }

    const onPressDownloadArea = async () => {

        let offllineMapId = `TreeMapper-offline-map-id-${Date.now()}`

        setIsLoaderShow(true)
        let coords = await MapBoxGLRef.current.getCenter();
        let bounds = await MapBoxGLRef.current.getVisibleBounds();
        getAreaName({ coords }).then(async (areaName) => {
            setAreaName(areaName)
            const progressListener = (offlineRegion, status) => {
                if (status.percentage == 100) {
                    createOfflineMap({ name: offllineMapId, size: status.completedTileSize, areaName: areaName }).then(() => {
                        setTimeout(() => alert('Map download complete'), 0)
                        getAllOfflineMaps()
                        setIsLoaderShow(false)
                        setAreaName('')
                    })
                }
            };
            const errorListener = (offlineRegion, err) => {
                if (err.message !== "timeout") {
                    setIsLoaderShow(false)
                    setAreaName('')
                    alert(err.message)
                }
            };
            await MapboxGL.offlineManager.createPack({
                name: offllineMapId,
                styleURL: 'mapbox://styles/haideralishah/ck9nual3q0ejy1ilidwhjl3mz',
                minZoom: 14,
                maxZoom: 20,
                bounds: bounds
            }, progressListener, errorListener)
        })


    }

    const renderLoaderModal = () => {
        return (
            <Modal
                transparent
                visible={isLoaderShow}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', }}>
                    <View style={{ backgroundColor: '#fff', width: 250, justifyContent: 'center', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 20, }}>
                        <ActivityIndicator size={40} style={{ backgroundColor: '#fff', borderRadius: 20, marginVertical: 20 }} />
                        <Text style={{ fontSize: 16, textAlign: 'center' }}>{areaName}</Text>
                    </View>
                </View>
            </Modal>
        )
    }

    const onPressViewAll = () => {
        navigation.navigate('SavedAreas')
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <Header headingText={'Download this area?'} />
                <View style={{ flex: 1, backgroundColor: '#fff', marginHorizontal: -25, overflow: 'hidden' }}>
                    <MapboxGL.MapView
                        onDidFinishRenderingMapFully={initialMapCamera}
                        ref={MapBoxGLRef}
                        style={{ flex: 1, marginVertical: 10 }}
                        styleURL={MapboxGL.StyleURL.Street}
                        zoomLevel={15}
                        centerCoordinate={[11.256, 43.77]}
                    >
                        <MapboxGL.UserLocation showsUserHeadingIndicator />
                        <MapboxGL.Camera ref={MapBoxGLCameraRef} />
                    </MapboxGL.MapView>
                    {/* <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' }} /> */}
                </View>
                {numberOfOfflineMaps == 0 ? <PrimaryButton onPress={onPressDownloadArea} btnText={'DOWNLOAD'} /> :
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <PrimaryButton onPress={onPressViewAll} btnText={'View all'} halfWidth theme={'white'} />
                        <PrimaryButton onPress={onPressDownloadArea} btnText={'Download'} halfWidth />
                    </View>}
            </View>
            {renderLoaderModal()}
        </SafeAreaView>
    )
}
export default DownloadMap;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})