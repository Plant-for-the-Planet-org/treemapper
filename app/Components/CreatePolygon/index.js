import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import ImageCapturing from './ImageCapturing'
import MapMarking from './MapMarking';
import Test from './Test'

const CreatePolygon = () => {

    const [isMapMarkingState, setIsMapMarkingState] = useState(true)

    const toggleState = () => setIsMapMarkingState(!isMapMarkingState)

    return (
        <SafeAreaView style={styles.container}>
            {isMapMarkingState ? <MapMarking toggleState={toggleState} /> : <ImageCapturing />}
        </SafeAreaView>
    )
}
export default CreatePolygon;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginHorizontal: 25
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})