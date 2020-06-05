import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Image } from 'react-native';
import { Header, PrimaryButton } from '../../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { alrighty_banner } from '../../../assets'


const Alrighty = ({ }) => {

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <Header closeIcon />
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={alrighty_banner} />
                        <Header hideBackIcon headingText={'Alrighty1'} subHeadingText={`Now, please walk to the next corner\nand tap continue when ready`} textAlignStyle={{ textAlign: 'center' }} />
                    </View>
                </View>
                <PrimaryButton btnText={'Continue'} />
            </View>
        </SafeAreaView>
    )
}
export default Alrighty;

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