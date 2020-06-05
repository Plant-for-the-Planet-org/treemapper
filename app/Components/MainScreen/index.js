import React from 'react';
import { View, StyleSheet, ScrollView, Image, Text, ImageBackground } from 'react-native';
import { PrimaryButton, LargeButton } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { MainScreenHeader } from '../Common/'
import { main_screen_banner, map_texture } from '../../assets'
import Icon from 'react-native-vector-icons/FontAwesome';

const LocateTree = ({ }) => {

    let rightIcon = <Icon size={40} name={'play-circle'} color={'#707070'} />

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }}>
                    <MainScreenHeader />
                    <View style={styles.bannerImgContainer}>
                        <Image source={main_screen_banner} style={styles.bannerImage} />
                    </View>
                    <Text style={styles.headerText}>Tree Mapper</Text>
                    <ImageBackground source={map_texture} style={styles.bgImage}>
                        <LargeButton notification style={styles.customStyleLargeBtn} heading={'Tree Inventory'} active={false} subHeading={'of draft and pending registrations'} />
                    </ImageBackground>
                    <ImageBackground source={map_texture} style={styles.bgImage}>
                        <LargeButton style={styles.customStyleLargeBtn} heading={'Download Maps'} active={false} subHeading={'for offline use'} />
                    </ImageBackground>
                    <ImageBackground source={map_texture} style={styles.bgImage}>
                        <LargeButton rightIcon={rightIcon} style={styles.customStyleLargeBtn} heading={'Learn'} active={false} subHeading={'how to use Tree Mapper'} />
                    </ImageBackground>
                </ScrollView>
                <PrimaryButton btnText={'Continue'} />
            </View>
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
    },
    headerText: {
        fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
        fontSize: Typography.FONT_SIZE_30,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        textAlign: 'center',
        marginVertical: 20
    },
    customStyleLargeBtn: {
        backgroundColor: 'transparent', paddingVertical: 10, marginVertical: 0, borderWidth: .1,
    },
    bgImage: {
        flex: 1, width: '100%', height: '150%', overflow: 'hidden', marginVertical: 10, borderRadius: 5
    },
    bannerImgContainer: {
        flex: 1, justifyContent: 'center', paddingVertical: 30
    },
    bannerImage: {
        alignSelf: 'center'
    }
}
)
