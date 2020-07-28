import React from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { close, logo } from "../../assets";
import { Colors, Typography } from '_styles';
import { SvgXml } from 'react-native-svg';
import { PrimaryButton } from '../Common';


const ProfileModal = ({ onPressCloseProfileModal, isProfileModalVisible, onPressLogout }) => {

    return (
        <Modal visible={isProfileModalVisible} transparent>
            <View style={styles.container}>
                <View style={styles.subContainer}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={onPressCloseProfileModal}>
                            <Image source={close} />
                        </TouchableOpacity>
                        <SvgXml xml={logo} />
                        <View />
                    </View>
                    <View style={styles.profileSection}>
                        <SvgXml xml={logo} style={styles.avatar} />
                        <View style={styles.nameAndEmailContainer}>
                            <Text style={styles.userName}>Paulina Sanchez</Text>
                            <Text style={styles.userEmail}>paulina@startplanting.org</Text>
                        </View>
                    </View>
                    <View style={styles.bottomBtnsContainer}>
                        <PrimaryButton btnText={'Edit Profile'} halfWidth theme={'white'} style={styles.primaryBtnContainer} textStyle={styles.primaryBtnText} />
                        <PrimaryButton onPress={onPressLogout} btnText={'Logout'} theme={'white'} halfWidth style={styles.primaryBtnContainer} textStyle={styles.primaryBtnText} />
                    </View>
                    <View style={styles.horizontalBar} />
                    <Text style={styles.textAlignCenter}>Privacy Policy     •     Terms of Service</Text>
                </View>
            </View>
        </Modal >)
}

const styles = StyleSheet.create({
    container: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'
    },
    subContainer: {
        width: '90%', backgroundColor: Colors.WHITE, borderRadius: 20, padding: 20
    },
    headerContainer: {
        flexDirection: 'row', justifyContent: 'space-between'
    },
    profileSection: {
        flexDirection: 'row', marginVertical: 20, alignItems: 'center'
    },
    avatar: {
        marginHorizontal: 20
    },
    nameAndEmailContainer: {
        flex: 1, justifyContent: 'space-evenly', paddingVertical: 10
    },
    primaryBtnContainer: {
        borderColor: Colors.LIGHT_BORDER_COLOR,
        height: 50
    },
    primaryBtnText: {
        color: Colors.TEXT_COLOR,
        fontFamily: Typography.FONT_FAMILY_REGULAR
    },
    textAlignCenter: {
        color: Colors.TEXT_COLOR,
        fontSize: Typography.FONT_SIZE_12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        textAlign: 'center',
    },
    horizontalBar: {
        borderWidth: .5, borderColor: Colors.LIGHT_BORDER_COLOR, marginHorizontal: -20, marginVertical: 20
    },
    userName: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    },
    userEmail: {
        color: Colors.TEXT_COLOR,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_,
    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-between',
    },
})


export default ProfileModal;