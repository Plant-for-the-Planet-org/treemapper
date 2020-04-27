import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';


const LocateTree = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Locate Trees'} />
            <ScrollView>
                <LargeButton heading={'On Site (Preferred)'} subHeading={'Collects Polygon and Images for high accuracy and verifiability '} active={false} />
                <LargeButton heading={'Off Site'} subHeading={'Collects Polygon. Best to use when registering from office.'} active={false} />
                <LargeButton heading={'Select Coordinates'} active={false} medium />
            </ScrollView>
            <PrimaryButton btnText={'Continue'} />
        </SafeAreaView>
    )
}
export default LocateTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})