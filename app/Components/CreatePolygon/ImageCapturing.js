import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { Colors, Typography } from '_styles';
import { close, camera } from '../../assets'
import ImagePicker from 'react-native-image-crop-picker';
import { insertImageAtLastCoordinate, removeLastCoord } from '../../Actions'
import { store } from '../../Actions/store';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'


const ImageCapturing = ({ toggleState, isCompletePolygon, locationText }) => {
    const navigation = useNavigation()
    const { state } = useContext(store);
    const [imagePath, setImagePath] = useState('')

    const onPressCamera = () => {
        ImagePicker.openCamera({
            mediaType: 'photo',
        }).then(image => {
            setImagePath(image.path)
            console.log(image);
        });
    }

    const onPessContinue = () => {
        // Save Image in local
        let data = { inventory_id: state.inventoryID, imageUrl: imagePath };
        insertImageAtLastCoordinate(data).then(() => {
            if (isCompletePolygon) {
                navigation.navigate('InventoryOverview')
            } else {
                toggleState()
            }
        })
    }

    const onBackPress = () => {
        removeLastCoord({ inventory_id: state.inventoryID, }).then(() => {
            toggleState()
        })
    }

    return (
        <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
            <View style={{ marginHorizontal: 25 }}>
                <Header onBackPress={onBackPress} closeIcon headingText={`Location ${locationText}`} subHeadingText={'Please take a picture facing planted trees.'} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: '#ccc' }}>
                    {imagePath ? <Image source={{ uri: imagePath }} style={{ flex: 1 }} /> : null}
                </View>
                <TouchableOpacity onPress={onPressCamera} style={styles.cameraIconCont}>
                    <Ionicons name={'md-camera'} size={25} />
                </TouchableOpacity>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <Text style={styles.message}>{`For verification purposes, your location is \nrecorded when you take a picture.`}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: 25, justifyContent: 'space-between' }}>
                <PrimaryButton btnText={'Back'} halfWidth theme={'white'} />
                <PrimaryButton onPress={onPessContinue} btnText={'Continue'} halfWidth />
            </View>
        </SafeAreaView>
    )
}
export default ImageCapturing;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE

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