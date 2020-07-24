import React, { useContext } from 'react';
import { View, StyleSheet, Text, Platform, SafeAreaView, Image, ActivityIndicator, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import { Header, PrimaryButton, Alrighty } from '../Common';
import { Colors } from '_styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { active_marker, marker_png } from '../../assets/index';
import { addCoordinates, getInventory, polygonUpdate } from '../../Actions';
import { useNavigation } from '@react-navigation/native';
import { store } from '../../Actions/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { MAPBOXGL_ACCCESS_TOKEN } from 'react-native-dotenv';
import { SvgXml } from 'react-native-svg';


MapboxGL.setAccessToken(MAPBOXGL_ACCCESS_TOKEN);

const infographicText = [
    { heading: 'Alrighty!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'If the next corner is your starting point tap Complete. Otherwise please walk to the next corner.' },
]
const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const IS_ANDROID = Platform.OS == 'android';

class MapMarking extends React.Component {
    state = {
        isAlrightyModalShow: false,
        centerCoordinates: [0, 0],
        activePolygonIndex: 0,
        loader: false,
        locateTree: '',
        geoJSON: {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {
                        'isPolygonComplete': false
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                        ]
                    }
                }
            ]
        }
    }


    async UNSAFE_componentWillMount() {
        if (IS_ANDROID) {
            MapboxGL.setTelemetryEnabled(false);
            await MapboxGL.requestAndroidLocationPermissions().then(() => {

            });
        }

    }

    componentDidMount() {
        this.initialState()
    }

    initialState = () => {
        const { inventoryID, updateActiveMarkerIndex, activeMarkerIndex } = this.props;
        getInventory({ inventoryID: inventoryID }).then((inventory) => {
            inventory.species = Object.values(inventory.species);
            inventory.polygons = Object.values(inventory.polygons);
            if (inventory.polygons.length > 0) {
                let featureList = inventory.polygons.map((onePolygon) => {
                    return {
                        'type': 'Feature',
                        'properties': {
                            'isPolygonComplete': onePolygon.isPolygonComplete
                        },
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
                if (activeMarkerIndex !== null && activeMarkerIndex < geoJSON.features[0].geometry.coordinates.length) {
                    updateActiveMarkerIndex(activeMarkerIndex)
                } else {
                    updateActiveMarkerIndex(geoJSON.features[0].geometry.coordinates.length)
                }
                this.setState({ geoJSON: geoJSON, locateTree: inventory.locate_tree, })

            } else {
                updateActiveMarkerIndex(0)
                this.setState({ locateTree: inventory.locate_tree })
            }
        })
    }

    onUpdateUserLocation = (location) => {
        if (!location) {
            // alert('Unable to retrive location')
            return;
        }
        if (!this.state.isInitial) {
            const currentCoords = [location.coords.longitude, location.coords.latitude]
            this.setState({ centerCoordinates: currentCoords, isInitial: true })
            this._camera.setCamera({
                centerCoordinate: currentCoords,
                zoomLevel: 18,
                animationDuration: 2000,
            })
        }
    }

    addMarker = async (complete) => {
        let { centerCoordinates, geoJSON, activePolygonIndex } = this.state;
        if (this.state.locateTree == 'on-site') {
            // Check distance 
            try {
                Geolocation.getCurrentPosition(position => {
                    let currentCoords = position.coords;
                    let markerCoords = centerCoordinates;

                    let isValidMarkers = true
                    geoJSON.features[activePolygonIndex].geometry.coordinates.map(oneMarker => {
                        let distance = this.distanceCalculator(markerCoords[1], markerCoords[0], oneMarker[1], oneMarker[0], 'K')
                        let distanceInMeters = distance * 1000;
                        if (distanceInMeters < 10)
                            isValidMarkers = false
                    })

                    let distance = this.distanceCalculator(currentCoords.latitude, currentCoords.longitude, markerCoords[1], centerCoordinates[0], 'K');
                    let distanceInMeters = distance * 1000;

                    if (!isValidMarkers) {
                        alert('You are at the same location. Please walk to the next location.')
                    } else if (distanceInMeters < 100) {
                        this.pushMaker(complete, currentCoords)
                    } else {
                        alert(`You are very far from your current location.`)
                    }
                }, (err) => alert(err.message));
            } catch (err) {
                alert('console 3')
                alert(JSON.stringify(err))
            }
        } else {
            this.setState({ isAlrightyModalShow: true })
            try {
                Geolocation.getCurrentPosition(position => {
                    let currentCoords = position.coords;
                    this.pushMaker(complete, currentCoords)
                }, (err) => alert(err.message))
            } catch (err) {
                alert('Unable to retrive location')
            }
        }
    }

    pushMaker = (complete, currentCoords) => {
        let { geoJSON, activePolygonIndex, centerCoordinates, locateTree } = this.state;
        const { activeMarkerIndex, updateActiveMarkerIndex } = this.props
        geoJSON.features[activePolygonIndex].geometry.coordinates[activeMarkerIndex] = centerCoordinates;
        if (complete) {
            console.log('GEOJSON BEFORE COMPLETE=', geoJSON.features[activePolygonIndex].geometry.coordinates)
            geoJSON.features[activePolygonIndex].properties.isPolygonComplete = true;
            geoJSON.features[activePolygonIndex].geometry.coordinates.push(geoJSON.features[activePolygonIndex].geometry.coordinates[0])
            console.log('GEOJSON AFTER COMPLETE=', geoJSON.features[activePolygonIndex].geometry.coordinates)

        }
        // console.log('GEOJSON=', complete, 'completeZ', geoJSON.features[activePolygonIndex].geometry.coordinates)
        // return;
        this.setState({ geoJSON }, () => {
            // change the state
            const { inventoryID } = this.props;
            const { geoJSON } = this.state;

            let data = { inventory_id: inventoryID, geoJSON: geoJSON, currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude } };
            addCoordinates(data).then(() => {
                if (locateTree == 'on-site') {
                    let location = ALPHABETS[geoJSON.features[activePolygonIndex].geometry.coordinates.length - (complete) ? 2 : 1]
                    this.props.toggleState(location, geoJSON.features[activePolygonIndex].geometry.coordinates.length)
                } else {
                    // For off site
                    if (complete) {
                        // alert('COMPLETE')
                        this.props.navigation.navigate('InventoryOverview')
                    }else{
                        updateActiveMarkerIndex(activeMarkerIndex + 1)

                    }
                }
            })
        })
    }

    distanceCalculator = (lat1, lon1, lat2, lon2, unit) => {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit == 'K') { dist = dist * 1.609344 }
            if (unit == 'N') { dist = dist * 0.8684 }
            return dist;
        }
    }

    onChangeRegionStart = () => this.setState({ loader: true })

    onChangeRegionComplete = async () => {
        const center = await this._map.getCenter();
        this.setState({ centerCoordinates: center, loader: false })
    }

    renderFakeMarker = (location) => {
        return (
            <View style={styles.fakeMarkerCont} >
                <SvgXml xml={active_marker} style={styles.markerImage} />
                {this.state.loader ? <ActivityIndicator color={Colors.WHITE} style={styles.loader} /> : <Text style={styles.activeMarkerLocation}>{location}</Text>}
            </View>)
    }

    renderMapView = (geoJSON) => {
        const { activePolygonIndex } = this.state
        let shouldRenderShap = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1
        return (<MapboxGL.MapView
            showUserLocation={true}
            style={styles.container}
            ref={(ref) => this._map = ref}
            onRegionWillChange={this.onChangeRegionStart}
            onRegionDidChange={this.onChangeRegionComplete}>
            {this.renderMarkers(geoJSON)}
            <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
            {shouldRenderShap && <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
                <MapboxGL.LineLayer id={'polyline'} style={polyline} />
            </MapboxGL.ShapeSource>}
            <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={this.onUpdateUserLocation} />
        </MapboxGL.MapView>)
    }

    renderMarkers = () => {
        const { geoJSON } = this.state;
        const markers = [];
        for (let i = 0; i < geoJSON.features.length; i++) {
            let onePolygon = geoJSON.features[i];
            let coordinatesLenghtShouldBe = onePolygon.properties.isPolygonComplete ? onePolygon.geometry.coordinates.length - 1 : onePolygon.geometry.coordinates.length
            for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
                let oneMarker = onePolygon.geometry.coordinates[j]
                markers.push(<MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker}>
                    <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
                        <Text style={styles.markerText}>{ALPHABETS[j]}</Text>
                    </ImageBackground>
                </MapboxGL.PointAnnotation>);
            }
        }
        return markers;
    }

    onPressCompletePolygon = async () => {
        const { navigation, inventoryID, setIsCompletePolygon } = this.props;
        const { geoJSON } = this.state;
        await this.addMarker(true)
        // 
        let data = { inventory_id: inventoryID, geoJSON: geoJSON };
        setIsCompletePolygon(true)
    }

    renderMyLocationIcon = (isShowCompletePolygonBtn) => {
        return <TouchableOpacity onPress={this.onPressMyLocationIcon} style={[styles.myLocationIcon]}>
            <View style={Platform.OS == 'ios' && styles.myLocationIconContainer}>
                <Ionicons name={'md-locate'} size={22} />
            </View>
        </TouchableOpacity>
    }

    onPressMyLocationIcon = () => {
        Geolocation.getCurrentPosition(position => {
            this.setState({ isInitial: false }, () => this.onUpdateUserLocation(position))
        }, (err) => alert(err.message));

    }

    renderAlrightyModal = () => {
        const { geoJSON, activePolygonIndex, isAlrightyModalShow } = this.state;
        const { inventoryID, updateActiveMarkerIndex, activeMarkerIndex } = this.props;

        let coordsLength = geoJSON.features[activePolygonIndex].geometry.coordinates.length
        const onPressContinue = () => this.setState({ isAlrightyModalShow: false })
        const onPressCompletePolygon = () => {
            polygonUpdate({ inventory_id: inventoryID }).then(() => {
                this.onPressCompletePolygon()
                onPressContinue()
                // this.props.navigation.navigate('InventoryOverview')
            })
        }
        const onPressClose = () => {
            updateActiveMarkerIndex(activeMarkerIndex - 1)
            this.setState({ isAlrightyModalShow: false })
        }

        let infoIndex = coordsLength <= 1 ? 0 : coordsLength <= 2 ? 1 : 2
        const { heading, subHeading } = infographicText[infoIndex]

        return (
            <Modal
                animationType={'slide'}
                visible={isAlrightyModalShow}>
                <View style={styles.mainContainer}>
                    <Alrighty coordsLength={coordsLength} onPressContinue={onPressContinue} onPressWhiteButton={onPressCompletePolygon} onPressClose={onPressClose} heading={heading} subHeading={subHeading} />
                </View>
            </Modal>
        )
    }

    onPressBack = () => {
        //  THIS IS MODIFICATION
        const { locateTree } = this.state;
        const { activeMarkerIndex, updateActiveMarkerIndex, navigation, toogleState2 } = this.props;
        navigation.navigate('TreeInventory')
        return;
        if (locateTree == 'off-site') {
            if (activeMarkerIndex > 0) {
                this.setState({ isAlrightyModalShow: true })
            } else {
                navigation.goBack()
            }
        } else {
            // on-site
            if (activeMarkerIndex > 0) {
                updateActiveMarkerIndex(activeMarkerIndex - 1)
                toogleState2()
            } else {
                navigation.goBack()
            }
        }
    }

    render() {
        const { activeMarkerIndex } = this.props


        const { geoJSON, loader, activePolygonIndex } = this.state;
        let isShowCompletePolygonBtn = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;
        let coordinatesLenghtShouldBe = (geoJSON.features[activePolygonIndex].properties.isPolygonComplete) ? geoJSON.features[activePolygonIndex].geometry.coordinates.length - 1 : geoJSON.features[activePolygonIndex].geometry.coordinates.length
        let location = ALPHABETS[activeMarkerIndex];
        return (
            <View style={styles.container} fourceInset={{ top: 'always' }}>
                <View style={styles.container}>
                    {this.renderMapView(geoJSON)}
                    {this.renderFakeMarker(location)}
                </View>
                <View>
                    {this.renderMyLocationIcon(isShowCompletePolygonBtn)}
                    <View style={styles.continueBtnCont}>
                        <PrimaryButton disabled={loader} onPress={() => this.addMarker()} btnText={'Select location & Continue'} style={styles.bottonBtnContainer} />
                    </View>
                </View>
                <LinearGradient style={styles.headerCont} colors={[Colors.WHITE, 'transparent']} >
                    <SafeAreaView />
                    <Header onBackPress={this.onPressBack} headingText={`Location ${location}`} closeIcon subHeadingText={'Please visit first corner of the plantation and select your location'} />
                </LinearGradient>
                <View>
                </View>
                {this.renderAlrightyModal()}
            </View>)
    }
}

export default function (props) {
    const navigation = useNavigation();
    const globalState = useContext(store);
    const { state } = globalState;
    return <MapMarking {...props} {...state} navigation={navigation} />;
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
    },
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    continueBtnCont: {
        flexDirection: 'row', position: 'absolute', bottom: 10, backgroundColor: 'transparent', width: '100%', justifyContent: 'center',
    },
    completePolygonBtnCont: {
        flexDirection: 'row', position: 'absolute', bottom: 80, backgroundColor: 'transparent', width: '100%', justifyContent: 'center',
    },
    bottonBtnContainer: {
        width: '90%',
    },
    headerCont: {
        paddingHorizontal: 25,
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0)',
        width: '100%'
    },
    fakeMarkerCont: {
        position: 'absolute', left: '50%', top: '50%', justifyContent: 'center', alignItems: 'center'
    },
    markerImage: {
        position: 'absolute',
        resizeMode: 'contain',
        bottom: 0
    },
    loader: {
        position: 'absolute', bottom: 67
    },
    activeMarkerLocation: {
        position: 'absolute', bottom: 67, color: Colors.WHITE, fontWeight: 'bold', fontSize: 16
    },
    myLocationIcon: {
        width: 45, height: 45, backgroundColor: Colors.WHITE, position: 'absolute', borderRadius: 100, right: 0, marginHorizontal: 25, justifyContent: 'center', alignItems: 'center', borderColor: Colors.TEXT_COLOR, bottom: 90
    },
    myLocationIconContainer: {
        top: 1.5, left: 0.8,
    },
    markerContainer: {
        width: 30, height: 43, paddingBottom: 85,
    },
    markerText: {
        width: 30, height: 43, color: Colors.WHITE, fontWeight: 'bold', fontSize: 16, textAlign: 'center', paddingTop: 4
    }
})

const polyline = { lineColor: 'red', lineWidth: 2, lineColor: Colors.BLACK }