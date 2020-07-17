import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Header, PrimaryButton } from '../../Common';
import { SafeAreaView } from 'react-native'
import { Colors } from '_styles';
import { alrighty_banner } from '../../../assets'
import { SvgXml } from "react-native-svg";

const Alrighty = ({ heading, subHeading, onPressClose, onPressContinue, coordsLength, onPressWhiteButton, }) => {
    console.log('coordsLength', coordsLength)
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header closeIcon onBackPress={onPressClose} />
                <View style={{ flex: 1 }}>
                    <View style={styles.bannerContainer}>
                        <SvgXml xml={alrighty_banner} />
                        {/* <Image source={alrighty_banner} /> */}
                        <Header hideBackIcon headingText={heading} subHeadingText={subHeading} textAlignStyle={styles.headercustomStyle} />
                    </View>
                </View>
                <View style={styles.bottomBtnsContainer}>
                    <PrimaryButton onPress={onPressWhiteButton} btnText={coordsLength > 2 ? 'Complete' : 'Back'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressContinue} btnText={'Continue'} halfWidth />
                </View>
            </View>
        </SafeAreaView>
    )
}
export default Alrighty;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    bannerContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    headercustomStyle: {
        textAlign: 'center'
    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-between'
    },
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    }
})