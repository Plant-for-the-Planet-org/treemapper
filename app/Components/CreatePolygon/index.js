import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import ImageCapturing from './ImageCapturing'
import MapMarking from './MapMarking';
import { store } from '../../Actions/store';
import { updateLastScreen } from '../../Actions/';
import Test from './Test'

const CreatePolygon = () => {

    const { state } = useContext(store)

    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'CreatePolygon' }
        updateLastScreen(data)
    }, [])


    const [locationText, setLocationText] = useState('')
    const [isMapMarkingState, setIsMapMarkingState] = useState(true)
    const [isCompletePolygon, setIsCompletePolygon] = useState(false)

    const toggleState = (locationText) => {
        setLocationText(locationText)
        setIsMapMarkingState(!isMapMarkingState)
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'red', }} fourceInset={{ bottom: 'never', top: 'never' }}>

            <View style={styles.container}>
                {isMapMarkingState ?
                    <MapMarking toggleState={toggleState}
                        isCompletePolygon={isCompletePolygon}
                        setIsCompletePolygon={setIsCompletePolygon} /> :
                    <ImageCapturing toggleState={toggleState}
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