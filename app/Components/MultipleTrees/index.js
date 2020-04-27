import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';


const MultipleTrees = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
            <Input value={'June 28. 19'} label={'Planting Date'} />
            <Accordian />
            <Text style={styles.addSpecies}>+ Add Species</Text>
            <View style={{ flex: 1 }} />
            <PrimaryButton btnText={'Save & Continue'} />
        </SafeAreaView>
    )
}
export default MultipleTrees;

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