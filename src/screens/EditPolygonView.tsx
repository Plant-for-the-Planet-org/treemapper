import { StyleSheet, View } from 'react-native'
import React, { useRef, useState } from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import CustomButton from 'src/components/common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import LineMarker from 'src/components/map/LineMarker'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'
import distanceCalculator, { isPointInPolygon } from 'src/utils/helpers/turfHelpers'
import { useToast } from 'react-native-toast-notifications'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { SafeAreaView } from 'react-native-safe-area-context'
import EditDisplayCurrentPolygonMarker from 'src/components/map/EditDisplayCurrentPolygonMarker'
import bbox from '@turf/bbox'
import DraggableMarkers from 'src/components/map/DraggableMarkers'
import { RealmSchema } from 'src/types/enum/db.enum'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import MapMarkersOverlay from 'src/components/map/MapMarkersOverlay'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


const EditPolygonMap = () => {
    const realm = useRealm()
    const route = useRoute<RouteProp<RootStackParamList, 'EditPolygon'>>()
    const interventionId = route.params?.id ?? '';
    const Intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionId);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [history, setHistory] = useState<Array<{
        coords: any,
        index: number
    }>>([])
    // const [_currentStep, setSteps] = useState(0)
    console.log("history", history)
    const { updateInterventionLocation } = useInterventionManagement()
    const cameraRef = useRef<MapLibreGL.Camera>(null)
    const mapRef = useRef<MapLibreGL.MapView>(null)
    const [coordinates, setCoordinates] = useState([])
    const toast = useToast();



    const setUpPolygon = () => {
        const interventionCoords = JSON.parse(Intervention.location.coordinates)
        handleCamera(interventionCoords, Intervention.location_type)
        setCoordinates(interventionCoords)
    }

    const handleCamera = (data: any, type: string) => {
        const { geoJSON } = makeInterventionGeoJson(type, data, '')
        const bounds = bbox(geoJSON)
        cameraRef.current.fitBounds(
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
            50,
            1000,
        )
    }

    const checkIsValidMarker = async (centerCoordinates: number[], coords: any, index: number) => {
        let isValidMarkers = true;
        coords.splice(index, 1);
        coords.pop()
        for (const oneMarker of coords) {
            const distanceInMeters = distanceCalculator(
                [centerCoordinates[1], centerCoordinates[0]],
                [oneMarker[1], oneMarker[0]],
                'meters',
            );
            // if the current marker position is less than one meter to already present markers nearby,
            // then makes the current marker position invalid
            if (distanceInMeters < 1) {
                toast.show("Marker is close to previous point.", {
                    type: "normal",
                    placement: "bottom",
                    duration: 2000,
                    animationType: "slide-in",
                })
                isValidMarkers = false;
            }
            if (distanceInMeters > 100) {
                toast.show("Marker is too far from previous point.", {
                    type: "normal",
                    placement: "bottom",
                    duration: 2000,
                    animationType: "slide-in",
                })
                isValidMarkers = false;
            }
        }
        return isValidMarkers;
    };

    const checkForWithinPolygon = async (geoJSON) => {
        for (const el of Intervention.sample_trees) {
            const validMarker = isPointInPolygon([el.longitude, el.latitude], geoJSON);
            if (!validMarker) {
                return false;
            }
        }
        return true;
    };

    const saveUpdate = async () => {
        if (Intervention.location_type === 'Point') {
            const Data = makeInterventionGeoJson('Point', coordinates, '')
            await updateInterventionLocation(Intervention.intervention_id, { type: Intervention.location.type, coordinates: Data.coordinates }, false, true)
            navigation.goBack()
            return
        }
        const finalCoordinates = [...coordinates, coordinates[0]];
        const Data = makeInterventionGeoJson('Polygon', finalCoordinates, '')
        const allPointsWithinPolygon = await checkForWithinPolygon(Data.geoJSON);
        if (allPointsWithinPolygon) {
            await updateInterventionLocation(Intervention.intervention_id, { type: Intervention.location.type, coordinates: Data.coordinates }, false, true)
            navigation.goBack()
        } else {
            toast.show("Sample Trees are not within updated polygon.", {
                type: "normal",
                placement: "bottom",
                duration: 2000,
                animationType: "slide-in",
            })
        }
    }

    const reset = () => {
        const interventionCoords = JSON.parse(Intervention.location.coordinates)
        setCoordinates(interventionCoords)
        // setSteps(0)
        setHistory([])
    }

    const changeTheCoordinates = async (index: number, coords: any) => {
        const updatedCoordinates = [...coordinates]
        const checkValidDistance = await checkIsValidMarker(coords, [...updatedCoordinates], index)
        if (!checkValidDistance) {
            return
        }
        updatedCoordinates[index] = coords
        if (index === 0) {
            updatedCoordinates[updatedCoordinates.length - 1] = coords
        }
        setCoordinates(updatedCoordinates)
        // setSteps(history.length + 1)
        setHistory((prev) => {
            return [...prev, {
                coords: coords,
                index: index
            }]
        })
    }


    const goBack = () => {
        navigation.goBack()
    }

    return (
        <SafeAreaView style={styles.container}>
            <EditDisplayCurrentPolygonMarker
                goBack={goBack}
            />
            <MapLibreGL.MapView
                style={styles.map}
                ref={mapRef}
                logoEnabled={false}
                onDidFinishLoadingMap={setUpPolygon}
                attributionEnabled={false}
                styleURL={JSON.stringify(MapStyle)}>
                <MapLibreGL.Camera ref={cameraRef} />
                <MapLibreGL.UserLocation
                    showsUserHeadingIndicator
                    androidRenderMode="gps"
                    minDisplacement={1}
                />
                <LineMarker coordinates={coordinates} />
                <DraggableMarkers coordinates={coordinates} onDragEnd={changeTheCoordinates} isSinglePoint={Intervention.location_type === 'Point'} />
                {Intervention.has_sample_trees && <MapMarkersOverlay
                    hasSampleTree={Intervention.has_sample_trees}
                    sampleTreeData={Intervention.sample_trees} />}
            </MapLibreGL.MapView>


            <View style={styles.btnFooter}>
                <CustomButton
                    label="Reset"
                    containerStyle={styles.btnWrapper}
                    pressHandler={reset}
                    wrapperStyle={styles.borderWrapper}
                    labelStyle={styles.highlightLabel}
                />
                <CustomButton
                    label="Save"
                    containerStyle={styles.btnWrapper}
                    pressHandler={saveUpdate}
                    wrapperStyle={styles.opaqueWrapper}
                    labelStyle={styles.normalLabel}
                />
            </View>
        </SafeAreaView>
    )
}

export default EditPolygonMap

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE
    },
    map: {
        flex: 1,
        alignSelf: 'stretch',
    },

    btnFooter: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        height: scaleSize(70),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    btnContainer: {
        position: 'absolute',
        bottom: 30,
        width: '95%',
        height: scaleSize(70),
    },
    btnWrapper: {
        flex: 1,
        width: '90%',
    },
    borderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '70%',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.PRIMARY_DARK,
    },
    opaqueWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '70%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 12,
    },
    highlightLabel: {
        fontSize: scaleFont(16),
        color: Colors.PRIMARY_DARK,
        fontFamily: Typography.FONT_FAMILY_BOLD
    },
    normalLabel: {
        fontSize: scaleFont(16),
        color: Colors.WHITE,
        textAlign: 'center',
        fontFamily: Typography.FONT_FAMILY_BOLD
    },
    undoRedoContainer: {
        position: 'absolute',
        right: 20,
        bottom: 100,
        flexDirection: 'row',
        alignItems: 'center'
    },
    backIconContainer: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginHorizontal: 5
    },
})
