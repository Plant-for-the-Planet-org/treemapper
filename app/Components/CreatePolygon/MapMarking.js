import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import MapboxGL from "@react-native-mapbox-gl/maps";
import { camera, marker, marker_png, active_marker } from '../../assets/index'

MapboxGL.setAccessToken('pk.eyJ1IjoiaGFpZGVyYWxpc2hhaCIsImEiOiJjazlqa3FrM28wM3VhM2RwaXdjdzg0a2s4In0.0xQfxFEfdvAqghrNgO8o9g');

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
class MapMarking extends React.Component {
    state = {
        centerCoordinates: [0, 0],
        activePolygonIndex: 0,
        loader: false,
        geoJSON: {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": []
                    }
                }
            ]
        }
    }
    componentDidMount() {
        MapboxGL.setTelemetryEnabled(false);
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
        let { geoJSON } = this.state;
        geoJSON.features[this.state.activePolygonIndex].geometry.coordinates.push(this.state.centerCoordinates);
        console.log(complete, 'complete')
        if (complete) {
             geoJSON.features[this.state.activePolygonIndex].geometry.coordinates.push(geoJSON.features[this.state.activePolygonIndex].geometry.coordinates[0])
        }
        this.setState({ geoJSON })
    }

    onChangeRegiionStart = () => this.setState({ loader: true })

    onChangeRegiionComplete = async () => {
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
            onRegionWillChange={this.onChangeRegiionStart}
            onRegionDidChange={this.onChangeRegiionComplete}>
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
            for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
                let oneMarker = onePolygon.geometry.coordinates[j]
                markers.push(<MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker} />);
            }
        }
        return markers;
    }

    onPressCompletePolygon = async () => {
        await this.addMarker(true)
    }

    render() {
        const { geoJSON, loader, activePolygonIndex } = this.state;
        let isShowCompletePolygonBtn = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 2;
        let location = ALPHABETS[geoJSON.features[activePolygonIndex].geometry.coordinates.length]
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

export default MapMarking;

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