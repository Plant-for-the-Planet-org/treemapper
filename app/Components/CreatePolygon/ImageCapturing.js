import React, { useState, useContext, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Image, TouchableOpacity, Modal } from 'react-native';
import { Header, PrimaryButton, Alrighty } from '../Common';
import { Colors, Typography } from '_styles';
import { insertImageAtLastCoordinate, removeLastCoord } from '../../Actions';
import { store } from '../../Actions/store';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RNCamera } from 'react-native-camera';


const infographicText = [
    { heading: 'Alrighty!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'Now, please walk to the next corner and tap continue when ready' },
    { heading: 'Great!', subHeading: 'If the next corner is your starting point tap Complete. Otherwise please walk to the next corner.' },
]

const ImageCapturing = ({ toggleState, isCompletePolygon, locationText, coordsLength }) => {
    const camera = useRef()

    const navigation = useNavigation()
    const { state } = useContext(store);
    const [imagePath, setImagePath] = useState('')
    const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);

    const onPressCamera = async () => {
        if (imagePath) {
            setImagePath('')
            return
        }
        const options = { quality: 0.5, };
        const data = await camera.current.takePictureAsync(options)
        setImagePath(data.uri)
    }

    const onPressClose = () => {
        setIsAlrightyModalShow(false)
    }

    const onPressContinue = () => {
        if (isAlrightyModalShow) {
            // Save Image in local
            if (imagePath) {
                let data = { inventory_id: state.inventoryID, imageUrl: imagePath };
                insertImageAtLastCoordinate(data).then(() => {
                    if (isCompletePolygon) {
                        setIsAlrightyModalShow(false)
                        navigation.navigate('InventoryOverview')
                    } else {
                        toggleState()
                    }
                })
            } else {
                alert('Image is required')
            }
        } else {
            setIsAlrightyModalShow(true)
        }
    }

    const onBackPress = () => {
        removeLastCoord({ inventory_id: state.inventoryID, }).then(() => {
            toggleState()
        })
    }

    const renderAlrightyModal = () => {
        let infoIndex = coordsLength <= 1 ? 0 : coordsLength <= 2 ? 1 : 2
        const { heading, subHeading } = infographicText[infoIndex]
        return (
            <Modal
                animationType={'slide'}
                visible={isAlrightyModalShow}>
                <View style={{ flex: 1 }}>
                    <Alrighty coordsLength={coordsLength} onPressContinue={onPressContinue} onPressClose={onPressClose} heading={heading} subHeading={subHeading} />
                </View>
            </Modal>
        )
    }

    console.log(coordsLength, 'coordsLength')
    return (
        <SafeAreaView style={styles.container} fourceInset={{ bottom: 'always' }}>
            <View style={{ marginHorizontal: 25 }}>
                <Header onBackPress={onBackPress} closeIcon headingText={`Location ${locationText}`} subHeadingText={'Please take a picture facing planted trees.'} />
            </View>
            <View style={styles.container}>
                <View style={styles.container}>
                    {imagePath ? <Image source={{ uri: imagePath }} style={styles.container} /> :
                        <View style={styles.cameraContainer}>
                            <RNCamera
                                ratio={'1:1'}
                                ref={camera}
                                style={[styles.container]}
                                androidCameraPermissionOptions={{
                                    title: 'Permission to use camera',
                                    message: 'We need your permission to use your camera',
                                    buttonPositive: 'Ok',
                                    buttonNegative: 'Cancel',
                                }}
                            >
                            </RNCamera>
                        </View>
                    }
                </View>
                <TouchableOpacity onPress={onPressCamera} style={styles.cameraIconCont}>
                    <Ionicons name={imagePath ? 'md-reverse-camera' : 'md-camera'} size={25} />
                </TouchableOpacity>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <Text style={styles.message}>{`For verification purposes, your location is\nrecorded when you take a picture.`}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: 25, justifyContent: 'space-between' }}>
                <PrimaryButton btnText={'Back'} halfWidth theme={'white'} />
                <PrimaryButton disabled={imagePath ? false : true} onPress={onPressContinue} btnText={'Continue'} halfWidth />
            </View>
            {renderAlrightyModal()}
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
        bottom: '-7%',
        right: '45%',
        left: '45%',
    },
    cameraContainer: {
        flex: 1, backgroundColor: '#eee', overflow: 'hidden'
    }
})


