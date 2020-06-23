import React, { useContext } from 'react';
import { View, StyleSheet, Text, Platform, SafeAreaView, Image, ActivityIndicator, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import { Header, PrimaryButton, Alrighty } from '../Common';
import { Colors } from '_styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { active_marker, marker_png } from '../../assets/index';
import { addCoordinateSingleRegisterTree, getInventory } from '../../Actions';
import { useNavigation } from '@react-navigation/native';
import { store } from '../../Actions/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { MAPBOXGL_ACCCESS_TOKEN } from 'react-native-dotenv';


MapboxGL.setAccessToken(MAPBOXGL_ACCCESS_TOKEN);

const infographicText = [
    { heading: 'Alrighty!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'If the next corner is your starting point tap Complete. Otherwise please walk to the next corner.' },
]
const IS_ANDROID = Platform.OS == 'android';

class SelectCoordinates extends React.Component {
    state = {
        isAlrightyModalShow: false,
        centerCoordinates: [0, 0],
        activePolygonIndex: 0,
        loader: false,
        markedCoords: null,
        locateTree: 'on-site',

    }


    async UNSAFE_componentWillMount() {
        if (IS_ANDROID) {
            MapboxGL.setTelemetryEnabled(false);
            await MapboxGL.requestAndroidLocationPermissions().then(() => {

            });
        }
    }

    renderFakeMarker = () => {
        return (
            <View style={styles.fakeMarkerCont} >
                <Image source={active_marker} style={styles.markerImage} />
                {this.state.loader ? <ActivityIndicator color={'#fff'} style={styles.loader} /> : <Text style={styles.activeMarkerLocation}>{'A'}</Text>}
            </View>)
    }

    onChangeRegionStart = () => this.setState({ loader: true })

    onChangeRegionComplete = async () => {
        const center = await this._map.getCenter();
        this.setState({ centerCoordinates: center, loader: false })
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

    addMarker = async () => {
        let { centerCoordinates } = this.state;
        // Check distance 
        try {
            Geolocation.getCurrentPosition(position => {
                let currentCoords = position.coords;
                let markerCoords = centerCoordinates;

                let distance = this.distanceCalculator(currentCoords.latitude, currentCoords.longitude, markerCoords[1], centerCoordinates[0], 'K');
                let distanceInMeters = distance * 1000;

                if (distanceInMeters < 100) {
                    this.pushMaker(currentCoords)
                    this.setState({ locateTree: 'on-site', })
                } else {
                    this.pushMaker(currentCoords)
                    this.setState({ locateTree: 'off-site', })
                }
            }, (err) => alert(err.message));
        } catch (err) {
            alert(JSON.stringify(err))
        }

    }

    pushMaker = (currentCoords) => {
        let { centerCoordinates } = this.state;
        this.setState({ markedCoords: centerCoordinates, isAlrightyModalShow: true }, () => {

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

    renderMarker = () => {
        const { markedCoords } = this.state;
        return (markedCoords && <MapboxGL.PointAnnotation key={`markerCoordskey`} id={`markerCoordsid`} coordinate={markedCoords}>
            <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
                <Text style={styles.markerText}>{'A'}</Text>
            </ImageBackground>
        </MapboxGL.PointAnnotation>)
    }

    renderMapView = () => {
        return (<MapboxGL.MapView
            showUserLocation={true}
            style={styles.container}
            ref={(ref) => this._map = ref}
            onRegionWillChange={this.onChangeRegionStart}
            onRegionDidChange={this.onChangeRegionComplete}>
            {this.renderMarker()}
            <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
            <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={this.onUpdateUserLocation} />
        </MapboxGL.MapView>)
    }


    renderMyLocationIcon = () => {
        return <TouchableOpacity onPress={this.onPressMyLocationIcon} style={[styles.myLocationIcon]}>
            <View style={Platform.OS == 'ios' && styles.myLocationIconContainer}>
                <Ionicons style={{}} name={'md-locate'} size={22} />
            </View>
        </TouchableOpacity>
    }

    onPressMyLocationIcon = () => {
        Geolocation.getCurrentPosition(position => {
            this.setState({ isInitial: false }, () => this.onUpdateUserLocation(position))
        }, (err) => alert(err.message));

    }

    onPressContinue = () => {
        this.setState({ isAlrightyModalShow: false }, () => {
            const { inventoryID, updateScreenState, navigation } = this.props;
            const { markedCoords, locateTree } = this.state;
            Geolocation.getCurrentPosition(position => {
                let currentCoords = position.coords;
                addCoordinateSingleRegisterTree({ inventory_id: inventoryID, markedCoords: markedCoords, currentCoords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude } }).then(() => {
                    navigation.navigate('InventoryOverview')
                })
            }, (err) => alert(err.message));

        })
    }


    renderAlrightyModal = () => {
        const { isAlrightyModalShow, locateTree, } = this.state
        const { updateScreenState } = this.props

        const onPressClose = () => this.setState({ isAlrightyModalShow: false })
        let subHeading = `Now, please tap continue to take picture of tree`;
        if (locateTree == 'off-site') {
            subHeading = `Now, please tap continue to see overview of tree`;
        }
        return (
            <Modal
                animationType={'slide'}
                visible={isAlrightyModalShow}>
                <View style={{ flex: 1 }}>
                    <Alrighty onPressClose={onPressClose} onPressWhiteButton={onPressClose} onPressContinue={this.onPressContinue} heading={'Alrighty!'} subHeading={subHeading} />
                </View>
            </Modal>
        )
    }

    onPressBack = () => {
        const { locateTree } = this.state;
        const { activeMarkerIndex, updateActiveMarkerIndex, navigation, toogleState2 } = this.props;
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
        const { loader } = this.state;
        return (
            <View style={styles.container} fourceInset={{ top: 'always' }}>
                <View style={styles.container}>
                    {this.renderMapView()}
                    {this.renderFakeMarker()}
                </View>
                <View>
                    {this.renderMyLocationIcon()}
                    <View style={styles.continueBtnCont}>
                        <PrimaryButton onPress={this.addMarker} disabled={loader} btnText={'Select location & Continue'} style={{ width: '90%', }} />
                    </View>
                </View>
                <LinearGradient style={styles.headerCont} colors={[Colors.WHITE, 'rgba(255, 255, 255, 0)']} >
                    <SafeAreaView />
                    <Header onBackPress={this.onPressBack} headingText={`Tree Location`} />
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
    return <SelectCoordinates {...props} {...state} navigation={navigation} />;
};

const styles = StyleSheet.create({
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
        position: 'absolute', bottom: 67, color: '#fff', fontWeight: 'bold', fontSize: 16
    },
    myLocationIcon: {
        width: 45, height: 45, backgroundColor: '#fff', position: 'absolute', borderRadius: 100, right: 0, marginHorizontal: 25, justifyContent: 'center', alignItems: 'center', borderColor: Colors.TEXT_COLOR, bottom: 90
    },
    myLocationIconContainer: {
        top: 1.5, left: 0.8,
    },
    markerContainer: {
        width: 30, height: 43, paddingBottom: 85,
    },
    markerText: {
        width: 30, height: 43, color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', paddingTop: 4
    }
})

const polyline = { lineColor: 'red', lineWidth: 2, lineColor: '#000' }