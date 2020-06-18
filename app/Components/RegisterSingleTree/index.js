import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Colors, Typography } from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from './ImageCapturing';
import TreeOverview from './TreeOverview';
import { store } from '../../Actions/store';
import { updateLastScreen } from '../../Actions';

const RegisterSingleTree = ({ navigation }) => {
    const { state } = useContext(store);

    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'RegisterSingleTree' }
        updateLastScreen(data)
    }, [])

    const [screenState, setSCreenState] = useState('MapMarking');

    const updateScreenState = (state) => setSCreenState(state)
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {screenState == 'MapMarking' && <MapMarking
                updateScreenState={updateScreenState} />}
            {screenState == 'ImageCapturing' && <ImageCapturing
                updateScreenState={updateScreenState} />}
            {screenState == 'TreeOverview' && <TreeOverview />}
        </View>
    )
}
export default RegisterSingleTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})