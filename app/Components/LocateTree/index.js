import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native';
import { cloud_upload_gray } from '../../assets'
import { Colors, Typography } from '_styles';
import { addLocateTree, updateLastScreen } from '../../Actions'
import { store } from '../../Actions/store';
import JailMonkey from 'jail-monkey';
import { SvgXml } from 'react-native-svg';


const LocateTree = ({ navigation }) => {
    const isRooted = JailMonkey.isJailBroken()

    const { state } = useContext(store);

    useEffect(() => {
        let data = { inventory_id: state.inventoryID, last_screen: 'LocateTree' }
        updateLastScreen(data)
    }, [])

    const [locateTree, setLocateTree] = useState('on-site');
    const [isAlrightyModalShow, setIsAlrightyModalShow] = useState(false);
    const [isSelectCoordinates, setIsSelectCoordinates] = useState(false);

    const onPressItem = (value) => {
        setIsSelectCoordinates(false)
        setLocateTree(value);
    }

    const onPressContinue = () => {
        if (isAlrightyModalShow) {
            let data = { inventory_id: state.inventoryID, locate_tree: locateTree };
            if (isSelectCoordinates) {
                data.locate_tree = 'off-site';
                addLocateTree(data).then(() => {
                    navigation.navigate('SelectCoordinates')
                    setIsAlrightyModalShow(false)
                })
                return;
            }
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
        onPressItem('')
        setIsSelectCoordinates(true)
    }

    const renderAlrightyModal = () => {
        return (
            <Modal animationType={'slide'} visible={isAlrightyModalShow}>
                <View style={styles.cont}>
                    <Alrighty onPressContinue={onPressContinue} onPressWhiteButton={onPressClose} onPressClose={onPressClose} heading={'Alrighty'} subHeading={`lets go to the first location click the continue when ready`} />
                </View>
            </Modal>
        )
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header headingText={'Locate Trees'} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <LargeButton disabled={isRooted} onPress={() => onPressItem('on-site')} heading={'On Site (Preferred)'} subHeading={`Collects Polygon and Images for high accuracy and verifiability`} active={locateTree == 'on-site'} subHeadingStyle={{ fontStyle: 'italic' }} />
                    <LargeButton onPress={() => onPressItem('off-site')} heading={'Off Site – Polygon'} subHeading={'Collects Polygon. Best to use when registering from office.'} active={locateTree == 'off-site'} subHeadingStyle={{ fontStyle: 'italic' }} />
                    <LargeButton onPress={onPressSelectCoordinates} heading={'Off Site – Point'} subHeading={'Latitude & Longitude only'} active={isSelectCoordinates} subHeadingStyle={{ fontStyle: 'italic' }} />
                    <LargeButton onPress={onPressSelectCoordinates} heading={'Upload GeoJson'} subHeadingStyle={{ fontStyle: 'italic' }} rightIcon={<SvgXml xml={cloud_upload_gray} />} />
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
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    cont: {
        flex: 1,
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})