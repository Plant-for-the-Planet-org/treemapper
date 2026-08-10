import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, CameraRef, UserLocation } from '@maplibre/maplibre-react-native';
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
    const cameraRef = useRef<CameraRef>(null)
    const [plotCoordinates, setPlotCoordinates] = useState<Array<number[]>>([])
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    useEffect(() => {
        setupMap()
    }, [props.data])

    const setupMap = () => {
        const coords = JSON.parse(props.data.location.coordinates)
        if (coords?.length) {
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
        if (cameraRef?.current) {
            cameraRef.current.fitBounds(
                [bounds[0], bounds[1], bounds[2], bounds[3]],
                { padding: { top: 20, right: 20, bottom: 20, left: 20 }, duration: 1000 },
            )
        }
    }

    if (plotCoordinates.length === 0) {
        return null
    }

    const onMarkerPress = (id: string) => {
        navigation.navigate('AddRemeasurement', { id: props.data.plot_id, plantID: id })

    }

    return (
        <View style={styles.page}>
            <Map
                style={styles.map}
                logo={false}
                attribution={false}
                onDidFinishLoadingMap={setupMap}
                mapStyle={MapStyle}>
                <Camera ref={cameraRef} />
                <UserLocation heading minDisplacement={1} />
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
            </Map>
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


