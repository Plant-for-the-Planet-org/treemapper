import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Map, Camera, CameraRef, MapRef, UserLocation } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import LineMarker from './LineMarker'
import AlphabetMarkers from './AlphabetMarkers'
import { Colors, Typography } from 'src/utils/constants'
import distanceCalculator from 'src/utils/helpers/turfHelpers'
import { useToast } from 'react-native-toast-notifications'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import SatelliteIconWrapper from './SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import UserlocationMarker from './UserlocationMarker'
import Icon from '@expo/vector-icons/FontAwesome5';
import CloseIcon from 'assets/images/svg/CloseIconFill.svg'
import i18next from 'i18next'
import useMapDraft from 'src/hooks/realm/useMapDraft'
import bbox from '@turf/bbox'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

// Draft owner for a site drawn before a project was picked.
const UNASSIGNED_OWNER = 'unassigned-site'


interface Props {
    setGeometry: (d: any) => void
    close: () => void
    projectBounds: any
    // Owner of the draft boundary. A site is drawn per project, so the points
    // are kept apart per project and survive leaving the screen or a crash.
    projectId: string
}

const SiteCreationMap = (props: Props) => {
    const { setGeometry, close, projectBounds, projectId } = props
    const [loadingSite, setLoadingSite] = useState(true)
    const [lineError, setLineError] = useState(false)
    const [coordinates, setCoordinates] = useState<[number, number][]>([])
    const [polygonComplete, setPolygonComplete] = useState(false)
    const currentUserLocation = useSelector(
        (state: RootState) => state.gpsState.user_location,
    )
    const toast = useToast();
    const { saveDraft, readDraft, clearDraft } = useMapDraft()

    const cameraRef = useRef<CameraRef>(null)
    const mapRef = useRef<MapRef>(null)
    const restoredCoordsRef = useRef<[number, number][]>([])
    // Which project the points on screen are saved under. A site can be drawn
    // before a project is picked, so the drawing starts life unassigned and
    // moves to the project as soon as one is chosen.
    const draftOwnerRef = useRef(projectId || UNASSIGNED_OWNER)

    const mainMapView = useSelector(
        (state: RootState) => state.displayMapState.mainMapView
    )


    // Points from a previous visit or a killed session. Site areas are walked
    // on foot like intervention boundaries, so the same recovery applies.
    // Drafts belong to a project, so switching the project switches the drawing.
    useEffect(() => {
        const owner = projectId || UNASSIGNED_OWNER
        if (owner === draftOwnerRef.current && coordinates.length > 0) {
            return
        }
        // Picking a project for a drawing that had none keeps the points and
        // just re-files them, rather than wiping work the user can see.
        if (projectId && draftOwnerRef.current === UNASSIGNED_OWNER && coordinates.length > 0) {
            draftOwnerRef.current = owner
            saveDraft('SITE', owner, coordinates)
            clearDraft('SITE', UNASSIGNED_OWNER)
            return
        }
        draftOwnerRef.current = owner
        let savedPoints = readDraft('SITE', owner)
        // A drawing started before a project was picked is adopted by the first
        // project that has none of its own, so closing the map and choosing a
        // project afterwards does not strand it.
        if (savedPoints.length === 0 && owner !== UNASSIGNED_OWNER) {
            const orphaned = readDraft('SITE', UNASSIGNED_OWNER)
            if (orphaned.length > 0) {
                savedPoints = orphaned
                saveDraft('SITE', owner, orphaned)
                clearDraft('SITE', UNASSIGNED_OWNER)
            }
        }
        restoredCoordsRef.current = savedPoints
        setCoordinates(savedPoints)
        setPolygonComplete(savedPoints.length >= 3)
        if (savedPoints.length > 0) {
            toast.show(`Restored ${savedPoints.length} marked ${savedPoints.length === 1 ? 'point' : 'points'}`, { placement: 'top' })
            frameRestoredPoints()
        }
    }, [projectId])

    useEffect(() => {
        handleCameraViewChange()
    }, [projectBounds])


    useEffect(() => {
        handleCamera()
    }, [currentUserLocation])

    const handleCameraViewChange = () => {
        // Restored points win over the project bounds: the user needs to see
        // the corners they already walked, not the project as a whole.
        if (restoredCoordsRef.current.length > 0) {
            frameRestoredPoints()
            return
        }
        if (projectBounds.length === 0) {
            return
        }
        if (cameraRef?.current) {
            cameraRef.current.fitBounds(
                [projectBounds[0], projectBounds[1], projectBounds[2], projectBounds[3]],
                { padding: { top: 50, right: 50, bottom: 50, left: 50 }, duration: 1000 },
            )
        }
    }

    const frameRestoredPoints = () => {
        if (!cameraRef?.current || restoredCoordsRef.current.length === 0) {
            return
        }
        try {
            if (restoredCoordsRef.current.length < 2) {
                cameraRef.current.easeTo({ center: restoredCoordsRef.current[0], zoom: 17, duration: 1000 })
                return
            }
            const bounds = bbox({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: restoredCoordsRef.current },
            } as any)
            cameraRef.current.fitBounds(
                [bounds[0], bounds[1], bounds[2], bounds[3]],
                { padding: { top: 60, right: 60, bottom: 60, left: 60 }, duration: 1000 },
            )
        } catch (error) {
            handleCamera()
        }
    }

    const handleCamera = () => {
        // Recentring would undo the framing of a restored boundary, so hold the
        // view until the user marks or undoes a point.
        if (restoredCoordsRef.current.length > 0) {
            return
        }
        if (cameraRef?.current) {
            cameraRef.current.easeTo({
                center: [...currentUserLocation],
                zoom: 15,
                duration: 1000,
            })
        }
    }

    const handlePreviousPoint = () => {
        const updatedCoordinates = [...coordinates];
        updatedCoordinates.pop()
        setCoordinates(updatedCoordinates)
        restoredCoordsRef.current = []
        saveDraft('SITE', draftOwnerRef.current, updatedCoordinates)
        if (updatedCoordinates.length <= 2) {
            setPolygonComplete(false)
        }
    }

    const onSelectLocation = async () => {
        const centerCoordinates = await mapRef.current.getCenter()
        if (centerCoordinates.length !== 0) {
            const checkValidDistance = await checkIsValidMarker(centerCoordinates, [...coordinates])
            setLineError(!checkValidDistance)
            if (!checkValidDistance) {
                errorHaptic()
                return
            }
            const updatedCoordinates = [...coordinates, centerCoordinates]
            setCoordinates(updatedCoordinates)
            restoredCoordsRef.current = []
            saveDraft('SITE', draftOwnerRef.current, updatedCoordinates)
            if (coordinates.length >= 2) {
                setPolygonComplete(true)
            }
        }
    }


    const checkIsValidMarker = async (centerCoordinates: number[], coords: any) => {
        try {
            let isValidMarkers = true;

            for (const oneMarker of coords) {
                const distanceInMeters = distanceCalculator(
                    [centerCoordinates[1], centerCoordinates[0]],
                    [oneMarker[1], oneMarker[0]],
                    'meters',
                );
                if (distanceInMeters < 0.1) {
                    errorHaptic()
                    toast.show("Marker is close to previous point.", {
                        type: "normal",
                        placement: "bottom",
                        duration: 2000,
                        animationType: "slide-in",
                    })
                    isValidMarkers = false;
                }
            }
            return isValidMarkers;
        } catch (error) {
            return true
        }

    };

    const makeComplete = async () => {
        const finalCoordinates = [...coordinates, coordinates[0]];
        const data = makeInterventionGeoJson('Polygon', finalCoordinates, '')
        setGeometry(data.geoJSON)
    }



    const onRegionDidChange = async () => {
        setLoadingSite(false)
        setLineError(false)
    }


    return (
        <View style={styles.containerSite}>
            <TouchableOpacity style={styles.closeWrapperSite} onPress={close}>
                <CloseIcon fill={mainMapView === 'SATELLITE' ? Colors.WHITE : Colors.TEXT_COLOR} stroke={mainMapView === 'SATELLITE' ? Colors.WHITE : Colors.TEXT_COLOR} />
            </TouchableOpacity>
            {coordinates.length > 0 && <TouchableOpacity style={styles.undoButtonSite} onPress={handlePreviousPoint}>
                <Text style={styles.undoLabelSite}>Previous Point</Text>
                <Icon
                    name="undo-alt"
                    size={16}
                    color={Colors.GRAY_DARK}
                />
            </TouchableOpacity>}
            <Map
                style={styles.mapSite}
                ref={mapRef}
                logo={false}
                onDidFinishLoadingMap={handleCameraViewChange}
                onRegionDidChange={onRegionDidChange}
                onRegionIsChanging={() => {
                    setLoadingSite(true)
                }}
                attribution={false}
                mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
                <Camera ref={cameraRef} />
                <UserLocation heading minDisplacement={1} />
                <LineMarker coordinates={coordinates} />
                <AlphabetMarkers coordinates={coordinates} />
            </Map>
            <SatelliteIconWrapper />
            {polygonComplete && (
                <View style={styles.btnFooterSite}>
                    <CustomButton
                        label="Complete"
                        containerStyle={styles.btnWrapperSite}
                        pressHandler={makeComplete}
                        wrapperStyle={styles.borderWrapperSite}
                        labelStyle={styles.highlightLabelSite}
                    />
                    <CustomButton
                        label="Continue"
                        containerStyle={styles.btnWrapperSite}
                        pressHandler={onSelectLocation}
                        wrapperStyle={styles.opaqueWrapperSite}
                        labelStyle={styles.normalLabelSite}
                    />
                </View>
            )}
            {!polygonComplete && (
                <CustomButton
                    label={`${i18next.t('label.select_location_continue')}`}
                    containerStyle={styles.btnContainerSite}
                    pressHandler={onSelectLocation}
                    disable={loadingSite || lineError}
                    loading={loadingSite}
                />
            )}
            <ActiveMarkerIcon />
            <UserlocationMarker stopAutoFocus />
        </View>
    )
}

export default SiteCreationMap

const styles = StyleSheet.create({
    containerSite: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.BACKDROP_COLOR,
        zIndex: 1
    },
    closeWrapperSite: {
        width: 20,
        height: 20,
        position: "absolute",
        left: 20,
        top: 30,
        zIndex: 10
    },
    mapSite: {
        flex: 1,
        alignSelf: 'stretch',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: 'hidden'
    },

    btnFooterSite: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    btnContainerSite: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        height: 70
    },
    btnWrapperSite: {
        flex: 1,
        height: '100%',
    },
    pointWrapperSite: {
        position: 'absolute',
        bottom: 90,
        width: '100%',
        height: 70
    },
    pointButtonSite: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '85%',
        height: '80%',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.PRIMARY_DARK,
    },
    borderWrapperSite: {
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
    opaqueWrapperSite: {
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
    highlightLabelSite: {
        fontSize: 16,
        color: Colors.PRIMARY_DARK,
        fontFamily: Typography.FONT_FAMILY_BOLD
    },
    normalLabelSite: {
        fontSize: 16,
        color: Colors.WHITE,
        textAlign: 'center',
        fontFamily: Typography.FONT_FAMILY_BOLD
    },
    undoButtonSite: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        position: 'absolute',
        right: 10,
        top: 30,
        zIndex: 10
    },
    undoLabelSite: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        marginRight: 5,
        color: Colors.TEXT_LIGHT,
        marginBottom: 5
    }
})
