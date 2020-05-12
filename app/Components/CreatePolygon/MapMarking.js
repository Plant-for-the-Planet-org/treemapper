import React, { useContext } from 'react';
import { View, StyleSheet, Text, Platform, ScrollView, SafeAreaView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import MapboxGL from "@react-native-mapbox-gl/maps";
import { camera, marker, marker_png, active_marker } from '../../assets/index'
import { addCoordinates, getInventory } from "../../Actions";
import { useNavigation } from '@react-navigation/native';
import { store } from '../../Actions/store';


MapboxGL.setAccessToken('pk.eyJ1IjoiaGFpZGVyYWxpc2hhaCIsImEiOiJjazlqa3FrM28wM3VhM2RwaXdjdzg0a2s4In0.0xQfxFEfdvAqghrNgO8o9g');

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const IS_ANDROID = Platform.OS == 'android';

class MapMarking extends React.Component {
    state = {
        centerCoordinates: [0, 0],
        activePolygonIndex: 0,
        loader: false,
        locateTree: '',
        geoJSON: {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "isPolygonComplete": false
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": []
                    }
                }
            ]
        }
    }


    async  UNSAFE_componentWillMount() {
        await MapboxGL.requestAndroidLocationPermissions().then(() => {

        });
    }

    componentDidMount() {
        MapboxGL.setTelemetryEnabled(false);
        this.initialState()
    }

    initialState = () => {
        const { inventoryID } = this.props;
        getInventory({ inventoryID: inventoryID }).then((inventory) => {
            inventory.species = Object.values(inventory.species);
            inventory.polygons = Object.values(inventory.polygons);
            console.log(inventory, 'INVENRTO')
            if (inventory.polygons.length > 0) {
                let featureList = inventory.polygons.map((onePolygon) => {
                    return {
                        "type": "Feature",
                        "properties": {
                            "isPolygonComplete": onePolygon.isPolygonComplete
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": Object.values(onePolygon.coordinates).map(oneCoordinate => ([Number(oneCoordinate.latitude), Number(oneCoordinate.longitude)]))
                        }
                    }
                })
                let geoJSON = {
                    "type": "FeatureCollection",
                    "features": featureList
                }
                this.setState({ geoJSON: geoJSON, locateTree: inventory.locate_tree })
            } else {
                this.setState({ locateTree: inventory.locate_tree })
            }
        })
    }

    onUpdateUserLocation = (location) => {
        if (!this.state.isInitial) {
            const currentCoords = [location.coords.longitude, location.coords.latitude]
            this.setState({ centerCoordinates: currentCoords, isInitial: true }, () => {
                // this.addMarker()
            })
            this._camera.setCamera({
                centerCoordinate: currentCoords,
                zoomLevel: 18,
                animationDuration: 2000,
            })
        }
    }

    addMarker = (complete) => {
        let { geoJSON, activePolygonIndex, centerCoordinates, locateTree } = this.state;
        geoJSON.features[activePolygonIndex].geometry.coordinates.push(centerCoordinates);
        if (complete) {
            geoJSON.features[activePolygonIndex].properties.isPolygonComplete = true;
            geoJSON.features[activePolygonIndex].geometry.coordinates.push(geoJSON.features[activePolygonIndex].geometry.coordinates[0])
        }
        this.setState({ geoJSON }, () => {
            // change the state
            const { inventoryID } = this.props;
            const { geoJSON } = this.state;
            let data = { inventory_id: inventoryID, geoJSON: geoJSON };
            addCoordinates(data).then(() => {
                if (locateTree == 'on-site') {
                    this.props.toggleState()
                } else {
                    // For off site
                    if (complete) {
                        this.props.navigation.navigate('InventoryOverview')
                    }
                }
            })
        })
    }

    onChangeRegionStart = () => this.setState({ loader: true })

    onChangeRegionComplete = async () => {
        const center = await this._map.getCenter();
        this.setState({ centerCoordinates: center, loader: false })
    }

    renderFakeMarker = (location) => {
        return (<View style={styles.fakeMarkerCont} >
            <Image
                source={active_marker}
                style={styles.markerImage} />
            {this.state.loader ? <ActivityIndicator color={'#fff'} style={styles.loader} /> : <Text style={styles.activeMarkerLocation}>{location}</Text>}
        </View>)
    }

    renderMapView = (geoJSON) => {
        return (<MapboxGL.MapView
            style={styles.container}
            ref={(ref) => this._map = ref}
            onRegionWillChange={this.onChangeRegionStart}
            onRegionDidChange={this.onChangeRegionComplete}>
            <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
            <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
                <MapboxGL.LineLayer id={'polyline'} style={polyline} />
            </MapboxGL.ShapeSource>
            <MapboxGL.UserLocation onUpdate={this.onUpdateUserLocation} />
            {this.renderMarkers(geoJSON)}
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
                markers.push(<MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker} />);
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

    render() {
        const { geoJSON, loader, activePolygonIndex } = this.state;
        let isShowCompletePolygonBtn = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;
        let coordinatesLenghtShouldBe = (geoJSON.features[activePolygonIndex].properties.isPolygonComplete) ? geoJSON.features[activePolygonIndex].geometry.coordinates.length - 1 : geoJSON.features[activePolygonIndex].geometry.coordinates.length
        let location = ALPHABETS[geoJSON.features[activePolygonIndex].geometry.coordinates.length]
        console.log(geoJSON.features[activePolygonIndex].properties.isPolygonComplete, 'geoJSON.features[activePolygonIndex].properties.isPolygonComplete')
        return (
            <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
                <View style={styles.headerCont}>
                    <Header headingText={`Location ${location}`} subHeadingText={'Please visit first corner of the plantation and select your location'} />
                </View>
                <View style={styles.container}>
                    {this.renderMapView(geoJSON)}
                    {this.renderFakeMarker(location)}
                </View>
                {isShowCompletePolygonBtn && <View style={styles.completePolygonBtnCont}>
                    <PrimaryButton theme={'white'} onPress={this.onPressCompletePolygon} btnText={'Select & Complete Polygon'} style={{ width: '90%', }} />
                </View>}
                <View style={styles.continueBtnCont}>
                    <PrimaryButton disabled={loader} onPress={() => this.addMarker()} btnText={'Select location & Continue'} style={{ width: '90%', }} />
                </View>

            </SafeAreaView>)
    }
}

export default function (props) {
    const navigation = useNavigation();
    const globalState = useContext(store);
    const { state } = globalState;
    return <MapMarking {...props} {...state} navigation={navigation} />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    continueBtnCont: {
        flexDirection: 'row', position: 'absolute', bottom: 10, backgroundColor: 'transparent', width: '100%', justifyContent: 'center',
    },
    completePolygonBtnCont: {
        flexDirection: 'row', position: 'absolute', bottom: 80, backgroundColor: 'transparent', width: '100%', justifyContent: 'center',
    },
    headerCont: {
        marginHorizontal: 25
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
    }

})

const polyline = { lineColor: 'red', lineWidth: 2, lineColor: '#000' }