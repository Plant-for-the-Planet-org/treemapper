import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';


const MapMarking = () => {
    return (
        <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
            <View style={{ marginHorizontal: 25 }}>
                <Header headingText={'Location A'} subHeadingText={'Please visit first corner of the plantation and select your location'} />
            </View>
            <View style={{ flex: 1, backgroundColor: 'brown' }}>
                <View style={{ flex: 1 }} />
                <View style={{ marginHorizontal: 25 }}>
                    <PrimaryButton btnText={'Continue'} />
                </View>
            </View>
        </SafeAreaView>
    )
}
export default MapMarking;

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