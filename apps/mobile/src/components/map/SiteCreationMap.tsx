import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


interface Props {
    setGeometry: (d: any) => void
    close: () => void
    projectBounds: any
}

const SiteCreationMap = (props: Props) => {
    const { setGeometry, close, projectBounds } = props
    const [loadingSite, setLoadingSite] = useState(true)
    const [lineError, setLineError] = useState(false)
    const [coordinates, setCoordinates] = useState([])
    const [polygonComplete, setPolygonComplete] = useState(false)
    const currentUserLocation = useSelector(
        (state: RootState) => state.gpsState.user_location,
    )
    const toast = useToast();

    const cameraRef = useRef<MapLibreGL.Camera>(null)
    const mapRef = useRef<MapLibreGL.MapView>(null)

    const mainMapView = useSelector(
        (state: RootState) => state.displayMapState.mainMapView
    )


    useEffect(() => {
        handleCameraViewChange()
    }, [projectBounds])


    useEffect(() => {
        handleCamera()
    }, [currentUserLocation])

    const handleCameraViewChange = () => {
        if (projectBounds.length === 0) {
            return
        }
        if (cameraRef?.current) {
            cameraRef.current.fitBounds(
                [projectBounds[0], projectBounds[1]],
                [projectBounds[2], projectBounds[3]],
                50,
                1000,
            )
        }
    }

    const handleCamera = () => {
        if (cameraRef?.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [...currentUserLocation],
                zoomLevel: 20,
                animationDuration: 1000,
            })
        }
    }

    const handlePreviousPoint = () => {
        const updatedCoordinates = [...coordinates];
        updatedCoordinates.pop()
        setCoordinates(updatedCoordinates)
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
            setCoordinates([...coordinates, centerCoordinates])
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
            <MapLibreGL.MapView
                style={styles.mapSite}
                ref={mapRef}
                logoEnabled={false}
                onDidFinishLoadingMap={handleCameraViewChange}
                onRegionDidChange={onRegionDidChange}
                onRegionIsChanging={() => {
                    setLoadingSite(true)
                }}
                attributionEnabled={false}
                styleURL={JSON.stringify(mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle)}>
                <MapLibreGL.Camera ref={cameraRef} />
                <MapLibreGL.UserLocation
                    showsUserHeadingIndicator
                    androidRenderMode="gps"
                    minDisplacement={1}
                />
                <LineMarker coordinates={coordinates} />
                <AlphabetMarkers coordinates={coordinates} />
            </MapLibreGL.MapView>
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
