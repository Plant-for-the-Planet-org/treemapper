import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import MapboxGL from "@react-native-mapbox-gl/maps";
import { camera, marker, marker_png, active_marker } from '../../assets/index'

MapboxGL.setAccessToken('pk.eyJ1IjoiaGFpZGVyYWxpc2hhaCIsImEiOiJjazlqa3FrM28wM3VhM2RwaXdjdzg0a2s4In0.0xQfxFEfdvAqghrNgO8o9g');

let l = console.log
class MapMarking extends React.Component {
    state = {
        centerCoordinates: [0, 0],
        activePolygonIndex: 0,
        loader: false,
        polygon: {
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

    addMarker = () => {
        let polygon = this.state.polygon;
        polygon.features[this.state.activePolygonIndex].geometry.coordinates.push(this.state.centerCoordinates);
        this.setState({ polygon })
    }

    onChangeRegiionStart = () => this.setState({ loader: true })

    onChangeRegiionComplete = async () => {
        const center = await this._map.getCenter();
        this.setState({ centerCoordinates: center, loader: false })
    }

    renderFakeMarker = () => {
        return (<View style={styles.fakeMarkerCont} >
            <Image
                source={active_marker}
                style={styles.markerImage} />
            {this.state.loader && <ActivityIndicator color={'#fff'} style={{ position: 'absolute', bottom: 67 }} />}
        </View>)
    }

    renderMapView = (polygon) => {
        return (<MapboxGL.MapView
            style={styles.container}
            ref={(ref) => this._map = ref}
            onRegionWillChange={this.onChangeRegiionStart}
            onRegionDidChange={this.onChangeRegiionComplete}>
            <MapboxGL.Camera ref={(ref) => (this._camera = ref)} />
            <MapboxGL.ShapeSource id={'polygon'} shape={polygon}>
                <MapboxGL.LineLayer id={'polyline'} style={polyline} />
            </MapboxGL.ShapeSource>
            <MapboxGL.UserLocation onUpdate={this.onUpdateUserLocation} />
            {this.renderMarkers(polygon)}
        </MapboxGL.MapView>)
    }

    renderMarkers = () => {
        const { polygon } = this.state;
        const markers = [];

        for (let i = 0; i < polygon.features.length; i++) {
            let onePolygon = polygon.features[i];
            for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
                let oneMarker = onePolygon.geometry.coordinates[j]
                markers.push(<MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker} />);
            }
        }
        return markers;
    }

    onPressCompletePolygon = async () => {
        await this.addMarker()

    }

    render() {
        // console.log(this.state.polygon.features[this.state.activePolygonIndex].geometry.coordinates)
        const { polygon, loader, activePolygonIndex } = this.state;
        let isShowCompletePolygonBtn = polygon.features[activePolygonIndex].geometry.coordinates.length > 3
        return (
            <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
                <View style={styles.headerCont}>
                    <Header headingText={'Location A'} subHeadingText={'Please visit first corner of the plantation and select your location'} />
                </View>
                <View style={styles.container}>
                    {this.renderMapView(polygon)}
                    {this.renderFakeMarker()}
                </View>
                {isShowCompletePolygonBtn && <View style={styles.completePolygonBtnCont}>
                    <PrimaryButton theme={'white'} onPress={this.onPressCompletePolygon} btnText={'Select & Complete Polygon'} style={{ width: '90%', }} />
                </View>}
                <View style={styles.continueBtnCont}>
                    <PrimaryButton disabled={loader} onPress={this.addMarker} btnText={'Select location & Continue'} style={{ width: '90%', }} />
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
    }

})

const polyline = { lineColor: 'red', lineWidth: 2, lineColor: '#000' }