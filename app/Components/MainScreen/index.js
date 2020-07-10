import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, Modal, Dimensions } from 'react-native';
import { PrimaryButton, LargeButton, Header } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { MainScreenHeader } from '../Common/';
import { getAllInventory, auth0Login, isLogin } from '../../Actions'
import { map_texture, main_screen_banner } from '../../assets'
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { SvgXml } from 'react-native-svg';

const { width, height } = Dimensions.get('window')
const MainScreen = ({ navigation }) => {

    const [isModalVisible, setIsModalVisible] = useState(false)
    const [numberOfInventory, setNumberOfInventory] = useState(0);
    const [isUserLogin, setIsUserLogin] = useState(false)

    useEffect(() => {
        checkIsLogin()
        getAllInventory().then((data) => {
            setNumberOfInventory(Object.values(data).length)
        })
    }, [])


    let rightIcon = <Icon size={40} name={'play-circle'} color={Colors.GRAY_LIGHTEST} />

    const onPressLargeButtons = (screenName) => navigation.navigate(screenName)

    const onPressLearn = () => setIsModalVisible(!isModalVisible)

    const onPressLogin = () => {
        auth0Login().then((data)=>{
            setIsUserLogin(data)
        })
    }

    const checkIsLogin = () => {
        isLogin().then((data) => {
            setIsUserLogin(data)
        }).catch((err) => {
            console.log(err)
        })
    }

    const renderVideoModal = () => {
        return (
            <Modal visible={isModalVisible} animationType={'slide'}>
                <View style={styles.modalContainer}>
                    <Ionicons name={'md-close'} size={30} color={Colors.WHITE} onPress={onPressLearn} style={styles.closeIcon} />
                    {isModalVisible && <Video
                        repeat={true}
                        resizeMode={'contain'}
                        posterResizeMode={'stretch'}
                        source={require('./learn.mp4')}
                        style={styles.videoPLayer} />}
                </View>
            </Modal >
        )
    }

     return (
        <SafeAreaView style={styles.safeAreaViewCont}>
            <View style={styles.container}>
                <ScrollView style={styles.safeAreaViewCont} showsVerticalScrollIndicator={false}>
                    <MainScreenHeader onPressLogin={onPressLogin} isUserLogin={isUserLogin}/>
                    <View style={styles.bannerImgContainer}>
                        <SvgXml xml={main_screen_banner} />
                    </View>
                    <Header headingText={'Tree Mapper'} hideBackIcon textAlignStyle={{ textAlign :'center'}}/>
                    <ImageBackground id={'inventorybtn'} source={map_texture} style={styles.bgImage}>
                        <LargeButton onPress={() => onPressLargeButtons('TreeInventory')} notification style={styles.customStyleLargeBtn} heading={'Tree Inventory'} active={false} subHeading={'of draft and pending registrations'} notification={numberOfInventory > 0 && numberOfInventory} />
                    </ImageBackground>
                    {/* <ImageBackground id={'manageuserbtn'} source={map_texture} style={styles.bgImage}>
                        <LargeButton onPress={() => onPressLargeButtons('ManageUsers')} style={styles.customStyleLargeBtn} heading={'Manage Users '} active={false} subHeading={'invite and authorize users'} />
                    </ImageBackground> */}
                    <ImageBackground id={'downloadmapbtn'} source={map_texture} style={styles.bgImage}>
                        <LargeButton onPress={() => onPressLargeButtons('DownloadMap')} style={styles.customStyleLargeBtn} heading={'Download Maps'} active={false} subHeading={'for offline use'} />
                    </ImageBackground>
                    <ImageBackground id={'learnbtn'} source={map_texture} style={styles.bgImage}>
                        <LargeButton onPress={onPressLearn} rightIcon={rightIcon} style={styles.customStyleLargeBtn} heading={'Learn'} active={false} subHeading={'how to use Tree Mapper'} />
                    </ImageBackground>
                </ScrollView>
                <PrimaryButton onPress={() => onPressLargeButtons('RegisterTree')} btnText={'Register Tree'} />
            </View>
            {renderVideoModal()}
        </SafeAreaView>
    )
}
export default MainScreen;

const styles = StyleSheet.create({
    safeAreaViewCont: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    modalContainer: {
        flex: 1, backgroundColor: Colors.BLACK, padding: 30
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
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
    },
    videoPLayer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    closeIcon: {
        zIndex: 100
    }
}
)
