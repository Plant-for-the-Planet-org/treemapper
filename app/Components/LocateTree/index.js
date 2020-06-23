import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { addLocateTree, updateLastScreen, addCoordinates } from '../../Actions'
import { store } from '../../Actions/store';
import JailMonkey from 'jail-monkey';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import Geolocation from '@react-native-community/geolocation';


const LocateTree = ({ navigation }) => {
    const isRooted = JailMonkey.isJailBroken()

    const { state } = useContext(store);

    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'LocateTree' }
        updateLastScreen(data)
    }, [])

    const [locateTree, setLocateTree] = useState('on-site');
    const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);

    const onPressItem = (value) => setLocateTree(value);

    const onPressContinue = () => {
        if (isAlrightyModalShow) {
            let data = { inventory_id: state.inventoryID, locate_tree: locateTree };
            addLocateTree(data).then(() => {
                navigation.navigate('CreatePolygon')
                setIsAlrightyModalShow(false)
            })
        } else {
            setIsAlrightyModalShow(true)
        }
    }

    const onPressClose = () => {
        setIsAlrightyModalShow(false)
    }

    const onPressSelectCoordinates = async () => {
        navigation.navigate('SelectCoordinates')
    }

    const renderAlrightyModal = () => {
        return (
            <Modal animationType={'slide'} visible={isAlrightyModalShow}>
                <View style={{ flex: 1 }}>
                    <Alrighty onPressContinue={onPressContinue} onPressWhiteButton={onPressClose} onPressClose={onPressClose} heading={'Alrighty'} subHeading={`lets go to the first location click the continue when ready`} />
                </View>
            </Modal>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <Header headingText={'Locate Trees'} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <LargeButton disabled={isRooted} onPress={() => onPressItem('on-site')} heading={'On Site (Preferred)'} subHeading={'Collects Polygon and Images for high accuracy and verifiability '} active={locateTree == 'on-site'} />
                    <LargeButton onPress={() => onPressItem('off-site')} heading={'Off Site'} subHeading={'Collects Polygon. Best to use when registering from office.'} active={locateTree == 'off-site'} />
                    <LargeButton onPress={onPressSelectCoordinates} heading={'Select Coordinates'} active={false} medium />
                </ScrollView>
                {isRooted && <Text style={styles.addSpecies}>Device is rooted</Text>}
                <PrimaryButton onPress={onPressContinue} btnText={'Continue'} />
            </View>
            {renderAlrightyModal()}
        </SafeAreaView>
    )
}
export default LocateTree;

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