import React, { useState, Suspense } from 'react';
import { View, StyleSheet, Text, Image, FlatList, Modal, TouchableOpacity, KeyboardAvoidingView, TextInput } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { placeholder_image, checkCircleFill } from '../../assets'
import { SvgXml } from 'react-native-svg';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const SelectSpecies = ({ visible, closeSelectSpeciesModal }) => {

    const [isShowTreeCountModal, setIsShowTreeCountModal] = useState(false);
    const [treeCount, setTreeCount] = useState('');

    const onPressSpecie = () => {
        setIsShowTreeCountModal(true)
    }

    const renderSpeciesCard = () => {
        return (
            <TouchableOpacity onPress={onPressSpecie} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <View>
                    <SvgXml xml={checkCircleFill} />
                </View>
                <Image source={placeholder_image} resizeMode={'contain'} style={{ flex: 1 }} />
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.speciesName}>Pseudotsuga menziesii</Text>
                    <Text style={styles.treeCount}>5,000 Trees</Text>
                </View>
            </TouchableOpacity>)
    }

    const renderTreeCountModal = () => {
        return (
            <Modal
                visible={isShowTreeCountModal}
                transparent={true}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: Colors.WHITE, marginVertical: 30, marginHorizontal: 20, borderRadius: 20, padding: 20 }}>
                        <Image source={placeholder_image} style={{ alignSelf: 'center', marginVertical: 20 }} />
                        <Header hideBackIcon subHeadingText={'How many Robina Pechumach did you plant?'} textAlignStyle={{ textAlign: 'center' }} />
                    </View>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS == "ios" ? "padding" : "height"}
                    style={styles.bgWhite}>
                    <View style={styles.externalInputContainer}>
                        <Text style={styles.labelModal}>{'Tree Count'}</Text>
                        <TextInput style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} onChangeText={(text) => setTreeCount(text)} keyboardType={'number-pad'} />
                        <MCIcon onPress={() => { setIsShowTreeCountModal(false) }} name={'arrow-right'} size={30} color={Colors.PRIMARY} />
                    </View>
                    <SafeAreaView />
                </KeyboardAvoidingView>
            </Modal>
        )
    }

    return (
        <Modal
            visible={visible}
            animationType={'slide'}>
            <View style={{ flex: 1 }}>
                <SafeAreaView style={styles.mainContainer}>
                    <View style={styles.container}>
                        <Header onBackPress={closeSelectSpeciesModal} closeIcon headingText={'Species'} subHeadingText={'Please select the species that has been planted'} />
                        <FlatList style={{ flex: 1 }} data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]} showsVerticalScrollIndicator={false} renderItem={renderSpeciesCard} />
                        <PrimaryButton btnText={'Save & Continue'} />
                    </View>
                </SafeAreaView>
            </View>
            {renderTreeCountModal()}
        </Modal>
    )
}
export default SelectSpecies;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    speciesName: {
        marginVertical: 10,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
    },
    treeCount: {
        color: Colors.PRIMARY,
        fontSize: Typography.FONT_SIZE_16,
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