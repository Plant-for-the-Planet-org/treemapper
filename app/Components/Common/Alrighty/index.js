import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Header, PrimaryButton } from '../../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { alrighty_banner } from '../../../assets'


const Alrighty = ({ heading, subHeading, onPressClose, onPressContinue, coordsLength, onPressWhiteButton, }) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header closeIcon onBackPress={onPressClose} />
                <View style={{ flex: 1 }}>
                    <View style={styles.bannerContainer}>
                        <Image source={alrighty_banner} />
                        <Header hideBackIcon headingText={heading} subHeadingText={subHeading} textAlignStyle={styles.headercustomStyle} />
                    </View>
                </View>
                <View style={styles.bottomBtnsContainer}>
                    <PrimaryButton onPress={onPressWhiteButton} btnText={coordsLength > 1 ? 'Complete' : 'Back'} halfWidth theme={'white'} />
                    <PrimaryButton onPress={onPressContinue} btnText={'Continue'} halfWidth />
                </View>
            </View>
        </SafeAreaView>
    )
}
export default Alrighty;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, backgroundColor: '#fff'
    },
    bannerContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center'
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