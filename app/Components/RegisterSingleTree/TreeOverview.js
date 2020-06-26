import React, { useEffect, useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Modal, KeyboardAvoidingView, SafeAreaView, Platform, TextInput } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { Colors, Typography } from '_styles';
import { placeholder_image } from '../../assets'
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { updateLastScreen, getInventory, statusToPending, updateSpeceiName, updateSpeceiDiameter, updatePlantingDate } from '../../Actions'
import { store } from '../../Actions/store';
import DateTimePicker from '@react-native-community/datetimepicker';

const SingleTreeOverview = ({ navigation }) => {

    const { state } = useContext(store);
    const [inventory, setInventory] = useState(null)
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isSpeciesEnable, setIsSpeciesEnable] = useState(false)
    const [isShowDate, setIsShowDate] = useState(false)
    const [plantationDate, setPLantationDate] = useState(new Date())

    const [specieText, setSpecieText] = useState('')
    const [specieDiameter, setSpecieDiameter] = useState('10')


    useEffect(() => {
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

        let data = { inventory_id: state.inventoryID, last_screen: 'SingleTreeOverview' }
        updateLastScreen(data)
    }, [])


    const onSubmitInputFeild = (action) => {
        if (action === 'specieText') {
            updateSpeceiName({ inventory_id: state.inventoryID, specieText: specieText })
        } else {
            updateSpeceiDiameter({ inventory_id: state.inventoryID, speceisDiameter: Number(specieDiameter) })
        }
    }

    const onPressNextIcon = () => {
        setIsOpenModal(false)
        if (isSpeciesEnable) {
            onSubmitInputFeild('specieText')
        } else {
            onSubmitInputFeild('specieDiameter')
        }
    }

    const renderinputModal = () => {
        return (
            <Modal transparent={true} visible={isOpenModal}>
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1, }}>
                        <View style={{ flex: 1 }} />
                        <KeyboardAvoidingView
                            behavior={Platform.OS == "ios" ? "padding" : "height"}
                            style={{ backgroundColor: Colors.WHITE }}>
                            <View style={styles.externalInputContainer}>
                                <Text style={styles.labelModal}>{isSpeciesEnable ? 'Name of Specie' : 'Diameter'}</Text>
                                {isSpeciesEnable && <TextInput value={specieText} style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} onChangeText={(text) => setSpecieText(text)} onSubmitEditing={() => onSubmitInputFeild('specieText')} />}
                                {!isSpeciesEnable && <TextInput value={specieDiameter} style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} keyboardType={'number-pad'} onChangeText={(text) => setSpecieDiameter(text)} onSubmitEditing={() => onSubmitInputFeild('specieDiameter')} />}
                                <MCIcon onPress={onPressNextIcon} name={'arrow-right'} size={30} color={Colors.PRIMARY} />
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

    const renderDateModal = () => {

        const onChangeDate = (e, selectedDate) => {
            updatePlantingDate({ inventory_id: state.inventoryID, plantation_date: `${selectedDate.getTime()}` })
            setIsShowDate(false)
            setPLantationDate(selectedDate)
        }


        return isShowDate && <DateTimePicker
            testID="dateTimePicker1"
            timeZoneOffsetInMinutes={0}
            value={new Date(plantationDate)}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
        />
    }

    const renderDetails = ({ polygons }) => {
        let coords = polygons[0].coordinates[0];
        let shouldEdit = inventory.status !== 'pending'
        console.log(inventory, 'shouldEdit')

        return (
            <View style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 20 }}>
                <View>
                    <Text style={styles.detailHeader}>Planting Date</Text>
                    <TouchableOpacity disabled={!shouldEdit} onPress={() => setIsShowDate(true)}>
                        <Text style={styles.detailText}>{new Date(plantationDate).toLocaleDateString()} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
                    </TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.detailHeader}>LOCATION</Text>
                    <Text style={styles.detailText}>{`${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`} </Text>
                </View>
                <View style={{ marginVertical: 5 }}>
                    <Text style={styles.detailHeader}>SPECEIS</Text>
                    <TouchableOpacity disabled={!shouldEdit} onPress={() => onPressEditSpeceis('species')}>
                        <Text style={styles.detailText}>{specieText ? specieText : 'Unable to identify '} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginVertical: 5 }}>
                    <Text style={styles.detailHeader}>DIAMETER</Text>
                    <TouchableOpacity disabled={!shouldEdit} style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onPressEditSpeceis('diameter')}>
                        <FIcon name={'arrow-h'} style={styles.detailText} />
                        <Text style={styles.detailText}>{specieDiameter ? `${specieDiameter}cm` : 'Unable to identify '} {shouldEdit && <MIcon name={'edit'} size={20} />}</Text>
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
        <SafeAreaView style={styles.mainContainer}>
            {renderinputModal()}
            {renderDateModal()}
            <View style={styles.container}>
                <Header closeIcon headingText={'Tree Details'} />
                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    {inventory && <View style={styles.overViewContainer}>
                        <Image source={imageSource} style={styles.bgImage} />
                        <LinearGradient colors={['rgba(255,255,255,0)', '#707070']} style={styles.detailContainer}>
                            {renderDetails(inventory)}
                        </LinearGradient>
                    </View>}
                </ScrollView>
                <View style={styles.bottomBtnsContainer}>
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
    overViewContainer: {
        width: '100%', height: 350, borderWidth: 0, alignSelf: 'center', borderRadius: 15, overflow: 'hidden'
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    bgImage: {
        width: '100%', height: '100%'
    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-between'
    },
    detailContainer: {
        position: 'absolute', width: '100%', height: '100%'
    },
    scrollViewContainer: {
        flex: 1, justifyContent: 'center'
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