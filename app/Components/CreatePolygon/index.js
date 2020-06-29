import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';
import ImageCapturing from './ImageCapturing'
import MapMarking from './MapMarking';
import { store } from '../../Actions/store';
import { updateLastScreen, getInventory } from '../../Actions/';


const CreatePolygon = ({ route, navigation }) => {

    const { state } = useContext(store)

    const [locationText, setLocationText] = useState('')
    const [isMapMarkingState, setIsMapMarkingState] = useState(true)
    const [isCompletePolygon, setIsCompletePolygon] = useState(false)
    const [coordsLength, setCoordsLength] = useState(0)
    const [activeMarkerIndex, setActiveMarkerIndex] = useState(null)

    useEffect(() => {
        checkIsEdit()
        let data = { inventory_id: state.inventoryID, last_screen: 'CreatePolygon' }
        updateLastScreen(data)
    }, [])

    const checkIsEdit = () => {
        if (route.params?.isEdit) {
            getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
                console.log(Object.keys(inventory.polygons[0].coordinates).length)
                setIsMapMarkingState(false)
                setActiveMarkerIndex(Object.keys(inventory.polygons[0].coordinates).length-1)
            })

        }
    }

    const toggleState = (locationText, coordsLength) => {
        setLocationText(locationText)
        setCoordsLength(coordsLength)
        setIsMapMarkingState(!isMapMarkingState)
    }

    const updateActiveMarkerIndex = (index) => {
        setActiveMarkerIndex(index)
    }

    const toogleState2 = () => {
        setIsMapMarkingState(!isMapMarkingState)
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'red', }} fourceInset={{ bottom: 'never', top: 'never' }}>
            <View style={styles.container}>
                {isMapMarkingState ?
                    <MapMarking toggleState={toggleState}
                        isCompletePolygon={isCompletePolygon}
                        setIsCompletePolygon={setIsCompletePolygon}
                        activeMarkerIndex={activeMarkerIndex}
                        updateActiveMarkerIndex={updateActiveMarkerIndex}
                        toogleState2={toogleState2}
                    /> :
                    <ImageCapturing toggleState={toggleState}
                        updateActiveMarkerIndex={updateActiveMarkerIndex}
                        activeMarkerIndex={activeMarkerIndex}
                        coordsLength={coordsLength}
                        isCompletePolygon={isCompletePolygon}
                        setIsCompletePolygon={setIsCompletePolygon}
                        locationText={locationText}
                    />}
            </View>
        </View>
    )
}
export default CreatePolygon;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})