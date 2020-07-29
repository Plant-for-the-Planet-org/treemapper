import React, { useEffect, useContext, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Modal, KeyboardAvoidingView, SafeAreaView, Platform, TextInput } from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { Colors, Typography } from '_styles';
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { updateLastScreen, getInventory, statusToPending, updateSpeceiName, updateSpeceiDiameter, updatePlantingDate, initiateInventory } from '../../Actions'
import { store } from '../../Actions/store';
import { LocalInventoryActions } from '../../Actions/Action';
import DateTimePicker from '@react-native-community/datetimepicker';

const SingleTreeOverview = ({ navigation }) => {

    const specieDiameterRef = useRef()

    const { state, dispatch } = useContext(store);
    const [inventory, setInventory] = useState(null)
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isSpeciesEnable, setIsSpeciesEnable] = useState(false)
    const [isShowDate, setIsShowDate] = useState(false)
    const [plantationDate, setPLantationDate] = useState(new Date())

    const [specieText, setSpecieText] = useState('')
    const [specieDiameter, setSpecieDiameter] = useState('10')


    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'SingleTreeOverview' }
        updateLastScreen(data)
        const unsubscribe = navigation.addListener('focus', () => {
            getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
                inventory.species = Object.values(inventory.species);
                inventory.polygons = Object.values(inventory.polygons);
                setInventory(inventory)
                setSpecieText(inventory.specei_name)
                setSpecieDiameter(inventory.specei_diameter)
                setPLantationDate(new Date(Number(inventory.plantation_date)).toLocaleDateString())
            })
        });

    }, [])


    const onSubmitInputFeild = (action) => {
        if (action === 'specieText') {
            updateSpeceiName({ inventory_id: state.inventoryID, specieText: specieText })
        } else {
            updateSpeceiDiameter({ inventory_id: state.inventoryID, speceisDiameter: Number(specieDiameter) })
        }
    }

    const onPressNextIcon = () => {
        if (isSpeciesEnable) {
            onSubmitInputFeild('specieText')
            setTimeout(() => {
                setIsSpeciesEnable(false)
                setTimeout(() => {
                    specieDiameterRef.current.focus()
                }, 0);
            }, 0)
        } else {
            setIsOpenModal(false)
            onSubmitInputFeild('specieDiameter')
        }
    }

    const renderinputModal = () => {
        return (
            <Modal transparent={true} visible={isOpenModal}>
                <View style={styles.cont}>
                    <View style={styles.cont}>
                        <View style={styles.cont} />
                        <KeyboardAvoidingView
                            behavior={Platform.OS == "ios" ? "padding" : "height"}
                            style={styles.bgWhite}>
                            <View style={styles.externalInputContainer}>
                                <Text style={styles.labelModal}>{isSpeciesEnable ? 'Name of Specie' : 'Diameter'}</Text>
                                {isSpeciesEnable ? <TextInput value={specieText} style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} onChangeText={(text) => setSpecieText(text)} onSubmitEditing={() => onSubmitInputFeild('specieText')} keyboardType={'email-address'} />
                                    : <TextInput ref={specieDiameterRef} value={specieDiameter} style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} keyboardType={'number-pad'} onChangeText={(text) => setSpecieDiameter(text)} onSubmitEditing={() => onSubmitInputFeild('specieDiameter')} />}
                                <MCIcon onPress={onPressNextIcon} name={'arrow-right'} size={30} color={Colors.PRIMARY} />
                            </View>
                            <SafeAreaView />
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        )
    }

    const onPressEditSpecies = (action) => {
        setIsOpenModal(true)
        if (action == 'species') {
            setTimeout(() => setIsSpeciesEnable(true), 0)
        } else {
            setTimeout(() => setIsSpeciesEnable(false), 0)
        }
    }

    const renderDateModal = () => {

        const onChangeDate = (e, selectedDate) => {
            updatePlantingDate({ inventory_id: state.inventoryID, plantation_date: `${selectedDate.getTime()}` })
            setIsShowDate(false)
            setPLantationDate(selectedDate)
        }

        return isShowDate && <DateTimePicker
            maximumDate={new Date()}
            testID="dateTimePicker1"
            timeZoneOffsetInMinutes={0}
            value={new Date(plantationDate)}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
        />
    }
    let filePath, imageSource
    if (inventory) {
        filePath = inventory.polygons[0]?.coordinates[0]?.imageUrl
        imageSource = filePath ? { uri: filePath } : false
    }
    const renderDetails = ({ polygons }) => {
        let coords;
        if (polygons[0]) {
            coords = polygons[0].coordinates[0];
        }
        let shouldEdit = inventory.status !== 'pending';
        let detailHeaderStyle = !imageSource ? [styles.detailHeader, styles.defaulFontColor] : [styles.detailHeader]
        let detailContainerStyle = imageSource ? [styles.detailSubContainer] : [{}]
        console.log('coords=', filePath, coords, filePath)

        return (
            <View style={detailContainerStyle}>
                <View>
                    <Text style={detailHeaderStyle}>LOCATION</Text>
                    <Text style={styles.detailText}>{`${coords.latitude.toFixed(5)}˚N,${coords.longitude.toFixed(5)}˚E`} </Text>
                </View>
                <View style={{ marginVertical: 5 }}>
                    <Text style={detailHeaderStyle}>SPECIES</Text>
                    <TouchableOpacity disabled={!shouldEdit} onPress={() => onPressEditSpecies('species')}>
                        <Text style={styles.detailText}>{specieText ? specieText : 'Unable to identify '} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginVertical: 5 }}>
                    <Text style={detailHeaderStyle}>DIAMETER</Text>
                    <TouchableOpacity disabled={!shouldEdit} style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onPressEditSpecies('diameter')}>
                        <FIcon name={'arrow-h'} style={styles.detailText} />
                        <Text style={styles.detailText}>{specieDiameter ? `${specieDiameter}cm` : 'Unable to identify '} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginVertical: 5 }}>
                    <View style={styles.flexRow}>
                        <View>
                            <Text style={detailHeaderStyle}>{'CAPTURED CO'}</Text>
                        </View>
                        <View style={styles.flexEnd}>
                            <Text style={styles.subScript}>{'2'}</Text>
                        </View>
                    </View>
                    <Text style={styles.detailText}>200 kg</Text>
                </View>
                {!imageSource && <View>
                    <Text style={detailHeaderStyle}>PLANTAION DATE</Text>
                    <TouchableOpacity disabled={!shouldEdit} onPress={() => setIsShowDate(true)}>
                        <Text style={styles.detailText}>{new Date(plantationDate).toLocaleDateString()} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
                    </TouchableOpacity>
                </View>}
            </View>)
    }

    const onPressSave = () => {
        let data = { inventory_id: state.inventoryID }
        statusToPending(data).then(() => {
            navigation.navigate('TreeInventory')
        })
    }

    const onPressContinue = () => {
        statusToPending({ inventory_id: state.inventoryID }).then(() => {
            initiateInventory({ treeType: 'single' }).then((inventoryID) => {
                dispatch(LocalInventoryActions.setInventoryId(inventoryID))
                navigation.push('RegisterSingleTree')
            })
        })
    }

    const onBackPress = () => {
        if (inventory.status !== 'pending') {
            navigation.navigate('RegisterSingleTree', { isEdit: true })
        } else {
            navigation.goBack()
        }
    }

    const goBack = () => {
        navigation.goBack()
    }

    console.log('imageSource=', imageSource)
    return (
        <SafeAreaView style={styles.mainContainer}>
            {renderinputModal()}
            {renderDateModal()}
            <View style={styles.container}>
                <Header closeIcon onBackPress={onBackPress} headingText={'Tree Details'} />
                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    {inventory && <View style={styles.overViewContainer}>
                        {imageSource && <Image source={imageSource} style={styles.bgImage} />}
                        <LinearGradient colors={['rgba(255,255,255,0)', imageSource ? Colors.GRAY_LIGHTEST : 'rgba(255,255,255,0)']} style={styles.detailContainer}>
                            {renderDetails(inventory)}
                        </LinearGradient>
                    </View>}
                </ScrollView>
                <View style={styles.bottomBtnsContainer}>
                    <PrimaryButton onPress={goBack} btnText={'Back'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressSave} btnText={'Next Tree'} halfWidth />
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
    cont: {
        flex: 1
    },
    subScript: {
        fontSize: 10, color: Colors.WHITE
    },
    overViewContainer: {
        flex: 1, width: '100%', alignSelf: 'center', borderRadius: 15, overflow: 'hidden', marginVertical: 10
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    bgWhite: {
        backgroundColor: Colors.WHITE
    },
    bgImage: {
        width: '100%', height: '100%'
    },
    flexRow: {
        flexDirection: 'row'
    },
    flexEnd: {
        justifyContent: 'flex-end'
    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-between'
    },
    detailContainer: {
        position: 'absolute', width: '100%', height: '100%'
    },
    scrollViewContainer: {
        flex: 1, marginTop: 20,
    },
    detailHeader: {
        fontSize: Typography.FONT_SIZE_14,
        color: Colors.WHITE,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        marginVertical: 5
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
    defaulFontColor: {
        color: Colors.TEXT_COLOR
    },
    detailSubContainer: {
        position: 'absolute', bottom: 0, right: 0, left: 0, padding: 20,
    }
})