import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Modal, PermissionsAndroid, ImageBackground, Text, Platform, Alert } from 'react-native';
import { Header, LargeButton, PrimaryButton, Label, LabelAccordian, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native';
import { store } from '../../Actions/store';
import { getInventory, statusToPending, updateLastScreen, updatePlantingDate } from '../../Actions'
import MapboxGL from '@react-native-mapbox-gl/maps';
import RNFetchBlob from 'rn-fetch-blob';
import { marker_png } from '../../assets';
import { APLHABETS } from '../../Utils'
import { bugsnag } from '../../Utils'
import DateTimePicker from '@react-native-community/datetimepicker';

const InventoryOverview = ({ navigation, }) => {

    const cameraRef = useRef()

    const { state } = useContext(store);

    const [inventory, setInventory] = useState(null)
    const [locationTitle, setlocationTitle] = useState('')
    const [selectedLOC, setSelectedLOC] = useState(null)
    const [isLOCModalOpen, setIsLOCModalOpen] = useState(false)
    const [showDate, setShowDate] = useState(false);

    useEffect(() => {

        const unsubscribe = navigation.addListener('focus', () => {
            getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
                inventory.species = Object.values(inventory.species);
                inventory.polygons = Object.values(inventory.polygons);
                setInventory(inventory)
            })

        });

        let data = { inventory_id: state.inventoryID, last_screen: 'InventoryOverview' }
        updateLastScreen(data)
    }, [])

    const renderPolygon = (polygons) => {
        return (
            <FlatList
                keyboardShouldPersistTaps={'always'}
                data={polygons}
                renderItem={({ item, index }) => {
                    return (<View>
                        <Label leftText={`Polygon ${APLHABETS[index]}`} rightText={''} />
                        <FlatList
                            data={Object.values(item.coordinates)}
                            renderItem={({ item: oneCoordinate, index }) => {
                                let normalizeData = { title: `Coordinate ${APLHABETS[index]}`, measurement: `${oneCoordinate.latitude.toFixed(3)},${oneCoordinate.longitude.toFixed(3)}`, date: 'View location', imageURL: oneCoordinate.imageUrl, index: index }
                                return (
                                    <InventoryCard data={normalizeData} activeBtn onPressActiveBtn={onPressViewLOC} />
                                )
                            }}
                        />
                    </View>)
                }}
            />

        )
    }

    const onPressViewLOC = (index) => {
        let selectedCoords = Object.values(inventory.polygons[0].coordinates)[index]
        let normalCoords = [selectedCoords.longitude, selectedCoords.latitude]
        setSelectedLOC(normalCoords)
        setlocationTitle(APLHABETS[index])
        setIsLOCModalOpen(!isLOCModalOpen)
    }

    const onPressSave = () => {
        let data = { inventory_id: state.inventoryID }
        statusToPending(data).then(() => {
            navigation.navigate('TreeInventory')
        })
    }

    const onPressEdit = () => {
        navigation.navigate('MultipleTrees', { isEdit: true })
    }

    const focusMarker = () => {
        cameraRef.current.setCamera({
            centerCoordinate: selectedLOC,
            zoomLevel: 18,
            animationDuration: 2000,
        })
    }

    const onBackPress = () => {
        setIsLOCModalOpen(!isLOCModalOpen)
        setSelectedLOC(null)
    }

    const renderViewLOCModal = () => {
        return (
            <Modal transparent visible={isLOCModalOpen}>
                <SafeAreaView />
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{ marginHorizontal: 25 }}>
                        <Header onBackPress={onBackPress} closeIcon headingText={`Location ${locationTitle}`} />
                    </View>
                    <MapboxGL.MapView
                        onDidFinishRenderingMapFully={focusMarker}
                        style={{ flex: 1 }}>
                        <MapboxGL.Camera ref={cameraRef} />
                        {selectedLOC && <MapboxGL.PointAnnotation id={`markerContainer1`} coordinate={selectedLOC}>
                            <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
                                <Text style={styles.markerText}>{locationTitle}</Text>
                            </ImageBackground>
                        </MapboxGL.PointAnnotation>}
                    </MapboxGL.MapView>
                </View>
            </Modal >
        )
    }

    const askAndroidStoragePermission = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: "Storage Permission",
                        message: "App needs access to memory to download the file ",
                        'buttonPositive': 'Ok'
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    resolve()
                } else {
                    Alert.alert(
                        "Permission Denied!",
                        "You need to give storage permission to save geoJSON the file"
                    );
                }
            } catch (err) {
                reject()
                bugsnag.notify(err)
            }
        })
    }

    const onPressExportJSON = async () => {
        let exportgeoJSONFile = () => {
            inventory.species = Object.values(inventory.species);
            inventory.polygons = Object.values(inventory.polygons);
            if (inventory.polygons.length > 0) {
                let featureList = inventory.polygons.map((onePolygon) => {
                    return {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': Object.values(onePolygon.coordinates).map(oneCoordinate => ([oneCoordinate.longitude, oneCoordinate.latitude]))
                        }
                    }
                })
                let geoJSON = {
                    'type': 'FeatureCollection',
                    'features': featureList
                }
                let fileName = `Tree Inventory GeoJSON ${inventory.inventory_id}.json`
                let path = `${Platform.OS == 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
                RNFetchBlob.fs.writeFile(path, JSON.stringify(geoJSON), 'utf88')
                    .then((success) => {
                        alert(`GeoJSON file export in ${Platform.OS == 'ios' ? 'document' : 'download'} directory`)
                    }).catch((err) => alert('unable to save file '))
            }
        }
        if (Platform.OS == 'android') {
            askAndroidStoragePermission().then(() => {
                exportgeoJSONFile()
            })
        } else {
            exportgeoJSONFile()
        }

    }

    const renderDatePicker = () => {
        return (
            showDate && <DateTimePicker
                testID="dateTimssePicker"
                timeZoneOffsetInMinutes={0}
                value={new Date(Number(inventory.plantation_date))}
                mode={'date'}
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
            />
        )
    }
    const onChangeDate = (event, selectedDate) => {
        setShowDate(false)
        setInventory({ ...inventory, plantation_date: `${selectedDate.getTime()}` });
        updatePlantingDate({ inventory_id: state.inventoryID, plantation_date: `${selectedDate.getTime()}` })
    };

    const onPressDate = () => setShowDate(true)

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {renderViewLOCModal()}
            <View style={styles.container}>
                {inventory !== null ? <View style={{ flex: 1, }} >
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
                        <Header headingText={''} subHeadingText={'Trees will be added to your inventory to sync when you have internet.'} />
                        <Label leftText={'Plant Date'} rightText={new Date(Number(inventory.plantation_date)).toLocaleDateString()} onPressRightText={onPressDate} />
                        <Label leftText={`On Site Registration`} rightText={''} />
                        <LabelAccordian data={inventory.species} onPressRightText={onPressEdit} plantingDate={new Date(Number(inventory.plantation_date))} status={inventory.status} />
                        {renderPolygon(inventory.polygons)}
                        <LargeButton onPress={onPressExportJSON} heading={'Export GeoJson'} active={false} medium />
                    </ScrollView>
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <PrimaryButton btnText={'Next Tree'} halfWidth theme={'white'} />
                            <PrimaryButton onPress={onPressSave} btnText={'Save'} halfWidth />
                        </View>
                    </View>
                </View> : null}
            </View>
            {renderDatePicker()}

        </SafeAreaView>
    )
}
export default InventoryOverview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: '#fff'
    },
    markerContainer: {
        width: 30, height: 43, paddingBottom: 85,
    },
    markerText: {
        width: 30, height: 43, color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', paddingTop: 4
    }

})