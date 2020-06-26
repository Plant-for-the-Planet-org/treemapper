import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Colors, Typography } from '_styles';
import MapMarking from './MapMarking';
import ImageCapturing from './ImageCapturing';
import { store } from '../../Actions/store';
import { updateLastScreen } from '../../Actions';

const RegisterSingleTree = ({ navigation }) => {
    const { state } = useContext(store);

    useEffect(() => {
        navigation.addListener('focus', () => {
            let data = { inventory_id: state.inventoryID, last_screen: 'RegisterSingleTree' }
            updateLastScreen(data)
        })
    }, [])

    const [screenState, setSCreenState] = useState('MapMarking');

    const updateScreenState = (state) => setSCreenState(state)
    return (
        <View style={styles.container}>
            {screenState == 'MapMarking' && <MapMarking
                updateScreenState={updateScreenState} />}
            {screenState == 'ImageCapturing' && <ImageCapturing
                updateScreenState={updateScreenState} />}
        </View>
    )
}
export default RegisterSingleTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    }
})