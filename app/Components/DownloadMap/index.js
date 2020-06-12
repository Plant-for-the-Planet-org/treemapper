import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { MAPBOXGL_ACCCESS_TOKEN } from 'react-native-dotenv';

// MapboxGL.offlineManager.setTileCountLimit(10000);
MapboxGL.setAccessToken(MAPBOXGL_ACCCESS_TOKEN);




const DownloadMap = ({ navigation }) => {
    const [isLoaderShow, setIsLoaderShow] = useState(false)
    const MapBoxGLRef = useRef();

    const onPressDownloadArea = async () => {
        setIsLoaderShow(true)
        let bounds = await MapBoxGLRef.current.getVisibleBounds();
        const progressListener = (offlineRegion, status) => {
            if (status.percentage == 100) {
                setIsLoaderShow(false)
                alert('Map download complete')
            }
        };
        const errorListener = (offlineRegion, err) => {
            if (err.message !== "timeout") {
                setIsLoaderShow(false)
                alert(err.message)
            }
         };

        await MapboxGL.offlineManager.createPack({
            name: `chicago ${Date.now()}`,
            styleURL: 'mapbox://styles/haideralishah/ck9nual3q0ejy1ilidwhjl3mz',
            minZoom: 14,
            maxZoom: 20,
            bounds: bounds
        }, progressListener, errorListener)
    }

    const renderLoaderModal = () => {
        return (
            <Modal
                transparent
                visible={isLoaderShow}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <ActivityIndicator size={40} style={{ borderWidth: 1, padding: 50, backgroundColor: '#fff', borderRadius: 20 }} />
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
                        ref={MapBoxGLRef}
                        style={{ flex: 1, marginVertical: 10 }}
                        styleURL={MapboxGL.StyleURL.Street}
                        zoomLevel={15}
                        centerCoordinate={[11.256, 43.77]}
                    >
                    </MapboxGL.MapView>
                    {/* <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' }} /> */}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PrimaryButton onPress={onPressViewAll} btnText={'View all'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressDownloadArea} btnText={'Download'} halfWidth />
                </View>
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