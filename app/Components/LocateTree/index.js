import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { addLocateTree, updateLastScreen } from '../../Actions'
import { store } from '../../Actions/store'
const LocateTree = ({ navigation }) => {

    const { state } = useContext(store);

    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'LocateTree' }
        updateLastScreen(data)
    }, [])

    const [locateTree, setLocateTree] = useState('on-site');

    const onPressItem = (value) => setLocateTree(value);

    const onPressContinue = () => {
        let data = { inventory_id: state.inventoryID, locate_tree: locateTree };
        addLocateTree(data).then(() => {
            navigation.navigate('CreatePolygon')
        })
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Locate Trees'} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LargeButton onPress={() => onPressItem('on-site')} heading={'On Site (Preferred)'} subHeading={'Collects Polygon and Images for high accuracy and verifiability '} active={locateTree == 'on-site'} />
                <LargeButton onPress={() => onPressItem('off-site')} heading={'Off Site'} subHeading={'Collects Polygon. Best to use when registering from office.'} active={locateTree == 'off-site'} />
                <LargeButton heading={'Select Coordinates'} active={false} medium />
            </ScrollView>
            <PrimaryButton onPress={onPressContinue} btnText={'Continue'} />
        </SafeAreaView>
    )
}
export default LocateTree;

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
    }
})