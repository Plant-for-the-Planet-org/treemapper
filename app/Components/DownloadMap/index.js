import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Modal, ActivityIndicator, Image } from 'react-native';
import { Header, PrimaryButton, } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { getAreaName, createOfflineMap, getAllOfflineMaps } from "../../Actions";
import MapboxGL from '@react-native-mapbox-gl/maps';
import Config from "react-native-config";
import Geolocation from '@react-native-community/geolocation';
import { active_marker } from '../../assets/index';
import { SvgXml } from 'react-native-svg';


MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const DownloadMap = ({ navigation }) => {
    const [isLoaderShow, setIsLoaderShow] = useState(false)
    const [areaName, setAreaName] = useState('')
    const [numberOfOfflineMaps, setNumberOfOfflineMaps] = useState(0)

    const MapBoxGLRef = useRef();
    const MapBoxGLCameraRef = useRef();

    useEffect(() => {
        navigation.addListener('focus', () => {
            getAllOfflineMapslocal()
        })
    }, [])

    const getAllOfflineMapslocal = async () => {
        getAllOfflineMaps().then((offlineMaps) => {
            setNumberOfOfflineMaps(Object.values(offlineMaps).length)
        })
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
                        setIsLoaderShow(false)
                        setTimeout(() => alert('Map download complete'), 1000)
                        getAllOfflineMapslocal()

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
                <View style={styles.dowloadModalContainer}>
                    <View style={styles.contentContainer}>
                        <ActivityIndicator size={40} style={styles.loader} />
                        <Text style={styles.areaName}>{areaName}</Text>
                    </View>
                </View>
            </Modal>
        )
    }

    const onPressViewAll = () => {
        navigation.navigate('SavedAreas')
    }

    const renderFakeMarker = () => {
        return (
            <View style={styles.fakeMarkerCont} >
                <SvgXml xml={active_marker}style={styles.markerImage}/>
            </View>)
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header headingText={'Download this area?'} />
                <View style={styles.mapViewContainer}>
                    <MapboxGL.MapView
                        onDidFinishRenderingMapFully={initialMapCamera}
                        ref={MapBoxGLRef}
                        style={styles.cont}
                        styleURL={MapboxGL.StyleURL.Street}
                        zoomLevel={15}
                        centerCoordinate={[11.256, 43.77]}>
                        <MapboxGL.UserLocation showsUserHeadingIndicator />
                        <MapboxGL.Camera ref={MapBoxGLCameraRef} />
                    </MapboxGL.MapView>
                    {renderFakeMarker()}
                </View>
                {numberOfOfflineMaps == 0 ? <PrimaryButton onPress={onPressDownloadArea} btnText={'Download'} /> :
                    <View style={styles.bottomBtnsContainer}>
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
    cont: { flex: 1 },
    mapViewContainer: {
        flex: 1, backgroundColor: Colors.WHITE, overflow: 'hidden', borderWidth: 2, marginVertical: 10, borderRadius: 10, borderColor: Colors.PRIMARY
    },
    fakeMarkerCont: {
        position: 'absolute', left: '50%', top: '50%', justifyContent: 'center', alignItems: 'center'
    },
    areaName: {
        fontSize: 16, textAlign: 'center'
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    dowloadModalContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)',
    },
    contentContainer: {
        backgroundColor: Colors.WHITE, width: 250, justifyContent: 'center', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 20,
    },
    loader: {
        backgroundColor: Colors.WHITE, borderRadius: 20, marginVertical: 20
    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-around'
    },
    markerImage: {
        position: 'absolute',
        resizeMode: 'contain',
        bottom: 0
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})
