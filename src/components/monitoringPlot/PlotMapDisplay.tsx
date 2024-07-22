import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { MonitoringPlot } from 'src/types/interface/slice.interface';
import bbox from '@turf/bbox'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper';
import PlotMarker from '../map/PlotMarker';
import PlotShapeSource from '../map/PlotShapeSource';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
    data: MonitoringPlot
}

const PlotMapDisplay = (props: Props) => {
    const cameraRef = useRef<MapLibreGL.Camera>(null)
    const [plotCoordinates, setPlotCoordinates] = useState<Array<number[]>>([])
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    useEffect(() => {
        setupMap()
    }, [props.data])

    const setupMap = () => {
        const coords = JSON.parse(props.data.location.coordinates)
        if (coords && coords.length) {
            setPlotCoordinates(coords)
        }
    }

    useEffect(() => {
        if (plotCoordinates.length !== 0) {
            setBounds()
        }
    }, [plotCoordinates])


    const setBounds = () => {
        //@ts-expect-error:error
        const { geoJSON } = makeInterventionGeoJson('Polygon', plotCoordinates[0], '');
        const bounds = bbox(geoJSON)
        if (cameraRef && cameraRef.current) {
            cameraRef.current.fitBounds(
                [bounds[0], bounds[1]],
                [bounds[2], bounds[3]],
                20,
                1000,
            )
        }
    }

    if (plotCoordinates.length === 0) {
        return null
    }

    const onMarkerPress = (id: string) => {
        navigation.navigate('AddRemeasurment', { id: props.data.plot_id, plantID: id })

    }

    return (
        <View style={styles.page}>
            <MapLibreGL.MapView
                style={styles.map}
                logoEnabled={false}
                attributionEnabled={false}
                onDidFinishLoadingMap={setupMap}
                styleURL={JSON.stringify(MapStyle)}>
                <MapLibreGL.Camera ref={cameraRef} />
                {plotCoordinates.length > 0 && <PlotShapeSource geoJSON={{
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {},
                            "geometry": {
                                "coordinates": plotCoordinates,
                                "type": "Polygon"
                            }
                        }
                    ]
                }} isEdit={false} />}
                {props.data.plot_plants.length > 0 && <PlotMarker sampleTreeData={props.data.plot_plants} onMarkerPress={onMarkerPress} />}
            </MapLibreGL.MapView>
        </View>
    );
}

export default PlotMapDisplay

const styles = StyleSheet.create({
    page: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    map: {
        flex: 1,
        alignSelf: 'stretch',
    },
});


