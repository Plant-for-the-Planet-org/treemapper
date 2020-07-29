import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Header, PrimaryButton } from '../../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { alrighty_banner } from '../../../assets'
import { SvgXml } from "react-native-svg";

const Alrighty = ({ heading, subHeading, onPressClose, onPressContinue, coordsLength, onPressWhiteButton, whiteBtnText, bannerImage, closeIcon }) => {

    const isShowBottomWhiteBtn = whiteBtnText || coordsLength >= 2
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header onBackPress={onPressClose} closeIcon={closeIcon}/>
                <View style={{ flex: 1 }}>
                    <View style={styles.bannerContainer}>
                        <SvgXml xml={bannerImage ? bannerImage : alrighty_banner} />
                        <Header hideBackIcon headingText={heading} subHeadingText={subHeading} textAlignStyle={styles.headercustomStyle} subHeadingStyle={styles.subHeadingStyle} />
                    </View>
                </View>
                <View style={styles.bottomBtnsContainer}>
                    {isShowBottomWhiteBtn && <PrimaryButton onPress={onPressWhiteButton} btnText={coordsLength >= 2 ? 'Complete' : whiteBtnText} halfWidth theme={'white'} />}
                    <PrimaryButton onPress={onPressContinue} btnText={'Continue'} halfWidth={isShowBottomWhiteBtn} />
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
        textAlign: 'center',

    },
    bottomBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-between'
    },
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    subHeadingStyle: {
        lineHeight: Typography.LINE_HEIGHT_24
    }
})