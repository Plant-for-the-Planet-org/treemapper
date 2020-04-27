import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import { close, camera } from '../../assets'

const ImageCapturing = () => {
    return (
        <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
            <View style={{ marginHorizontal: 25 }}>
                <Header closeIcon headingText={'Location A'} subHeadingText={'Please take a picture facing planted trees.'} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: '#ccc' }}>
                </View>
                <TouchableOpacity style={styles.cameraIconCont}>
                    <Image source={camera} />
                </TouchableOpacity>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <Text style={styles.message}>{`For verification purposes, your location is \nrecorded when you take a picture.`}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: 25, justifyContent: 'space-between' }}>
                <PrimaryButton btnText={'Continue'} halfWidth theme={'white'} />
                <PrimaryButton btnText={'Continue'} halfWidth />
            </View>
        </SafeAreaView>
    )
}
export default ImageCapturing;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    },
    message: {
        color: Colors.TEXT_COLOR,
        fontSize: Typography.FONT_SIZE_16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    },
    cameraIconCont: {
        width: 55,
        height: 55,
        borderColor: Colors.LIGHT_BORDER_COLOR,
        borderWidth: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: -25,
        right: '45%',
        left: '45%'
    }
})