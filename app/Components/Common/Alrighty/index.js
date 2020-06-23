import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, Switch } from 'react-native';
import { Header, PrimaryButton } from '../../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { alrighty_banner } from '../../../assets'


const Alrighty = ({ heading, subHeading, onPressClose, onPressContinue, coordsLength, onPressWhiteButton,  }) => {

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <Header closeIcon onBackPress={onPressClose} />
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={alrighty_banner} />
                        <Header hideBackIcon headingText={heading} subHeadingText={subHeading} textAlignStyle={{ textAlign: 'center' }} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PrimaryButton onPress={onPressWhiteButton} btnText={coordsLength > 2 ? 'Complete' : 'Back'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressContinue} btnText={'Continue'} halfWidth />
                </View>
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
    switchLabel: {
        color: Colors.BLACK,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})