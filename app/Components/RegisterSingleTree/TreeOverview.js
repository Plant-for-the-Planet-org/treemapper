import React, { useEffect, useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Modal, KeyboardAvoidingView, SafeAreaView, Platform, TextInput } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { Colors, Typography } from '_styles';
import { placeholder_image } from '../../assets'
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { updateLastScreen, getInventory, statusToPending } from '../../Actions'
import { store } from '../../Actions/store';

const SingleTreeOverview = ({ navigation }) => {

    const { state } = useContext(store);
    const [inventory, setInventory] = useState(null)
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isSpeciesEnable, setIsSpeciesEnable] = useState(false)

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
                // console.log('inventory===', inventory)
                inventory.species = Object.values(inventory.species);
                inventory.polygons = Object.values(inventory.polygons);
                setInventory(inventory)
            })

        });

        let data = { inventory_id: state.inventoryID, last_screen: 'SingleTreeOverview' }
        updateLastScreen(data)
    }, [])

    const renderinputModal = () => {
        console.log(isOpenModal, 'isOpenModal')
        return (
            <Modal transparent={true} visible={isOpenModal}>
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1, }}>
                        <View style={{ flex: 1 }} />
                        <KeyboardAvoidingView
                            behavior={Platform.OS == "ios" ? "padding" : "height"}
                            style={{ backgroundColor: '#fff' }}>
                            <View style={styles.externalInputContainer}>
                                <Text style={styles.labelModal}>{isSpeciesEnable ? 'Name of Specie' : 'Diameter'}</Text>
                                {isSpeciesEnable && <TextInput style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} />}
                                {!isSpeciesEnable && <TextInput style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} />}
                                <MCIcon onPress={() => { setIsOpenModal(false) }} name={'arrow-right'} size={30} color={Colors.PRIMARY} />
                            </View>
                            <SafeAreaView />
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        )
    }

    const onPressEditSpeceis = (action) => {
        setIsOpenModal(true)
        if (action == 'species') {
            setTimeout(() => setIsSpeciesEnable(true), 0)
        } else {
            setTimeout(() => setIsSpeciesEnable(false), 0)
        }
    }

    const renderDetails = ({ polygons }) => {
        let coords = polygons[0].coordinates[0]
        return (<View style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 20 }}>
            <View>
                <Text style={styles.detailHeader}>LOCATION</Text>
                <Text style={styles.detailText}>{`${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`}</Text>
            </View>
            <View style={{ marginVertical: 5 }}>
                <Text style={styles.detailHeader}>SPECEIS</Text>
                <TouchableOpacity onPress={() => onPressEditSpeceis('species')}>
                    <Text style={styles.detailText}>Unable to identify <MIcon name={'edit'} size={20} /></Text>
                </TouchableOpacity>
            </View>
            <View style={{ marginVertical: 5 }}>
                <Text style={styles.detailHeader}>DIAMETER</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onPressEditSpeceis('diameter')}>
                    <FIcon name={'arrow-h'} style={styles.detailText} />
                    <Text style={styles.detailText}>unable to identify  <MIcon name={'edit'} size={20} /></Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.detailHeader, {}]}>{'CAPTURED CO'}</Text>
                    </View>
                    <View style={{ justifyContent: 'flex-start' }}>
                        <Text style={{ fontSize: 10, color: Colors.WHITE }}>{'2'}</Text>
                    </View>
                </View>
                <Text style={[styles.detailText, { color: Colors.PRIMARY }]}>200 kg</Text>
            </View>
        </View>)
    }

    const onPressContinue = () => {
        let data = { inventory_id: state.inventoryID }
        statusToPending(data).then(() => {
            navigation.navigate('TreeInventory')
        })
    }
    let filePath, imageSource
    if (inventory) {
        filePath = inventory.polygons[0].coordinates[0].imageUrl
        imageSource = filePath ? { uri: filePath } : placeholder_image
    }
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {renderinputModal()}
            <View style={styles.container}>
                <Header headingText={'Tree Details'} />
                <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
                    {inventory && <View style={{ width: '100%', height: 350, borderWidth: 0, alignSelf: 'center', borderRadius: 15, overflow: 'hidden' }}>
                        <Image source={imageSource} style={{ width: '100%', height: '100%' }} />
                        <LinearGradient colors={['rgba(255,255,255,0)', '#707070']} style={{  position: 'absolute', width: '100%', height: '100%' }}>
                            {renderDetails(inventory)}
                        </LinearGradient>
                    </View>}
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PrimaryButton btnText={'Continue'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressContinue} btnText={'Save'} halfWidth />
                </View>
            </View>

        </SafeAreaView >
    )
}
export default SingleTreeOverview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    detailHeader: {
        fontSize: Typography.FONT_SIZE_14,
        color: Colors.WHITE,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
    },
    detailText: {
        fontSize: Typography.FONT_SIZE_18,
        color: Colors.PRIMARY,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        lineHeight: Typography.LINE_HEIGHT_30,
    },
    externalInputContainer: {
        flexDirection: 'row',
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 25,
        borderTopWidth: .5,
        borderColor: Colors.TEXT_COLOR
    },
    value: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM,
        flex: 1,
        paddingVertical: 10,
    },
    labelModal: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        color: Colors.TEXT_COLOR,
        marginRight: 10
    },
})