import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, Modal, Dimensions, Alert } from 'react-native';
import { PrimaryButton, LargeButton, Header, MainScreenHeader, Loader } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import { ProfileModal } from '../';
import { getAllInventory, auth0Login, isLogin, uploadInventory, auth0Logout } from '../../Actions';
import { map_texture, main_screen_banner } from '../../assets';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { SvgXml } from 'react-native-svg';
import i18next from '../../languages/languages';
import { store } from '../../Actions/store';
import { LoaderActions } from '../../Actions/Action';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // * FOR VIDEO MODAL
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const {state, dispatch} = useContext(store);

  useEffect(() => {
    checkIsLogin();
    getAllInventory().then((data) => {
      setNumberOfInventory(Object.values(data).length);
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      checkIsLogin();
    }, [])
  );

  let rightIcon = <Icon size={40} name={'play-circle'} color={Colors.GRAY_LIGHTEST} />;

  const onPressLargeButtons = (screenName) => navigation.navigate(screenName);

  const onPressLearn = () => setIsModalVisible(!isModalVisible);

  const onPressCloseProfileModal = () => setIsProfileModalVisible(!isProfileModalVisible);

  const onPressLogin = () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      dispatch(LoaderActions.setLoader(true));
      auth0Login(navigation).then((data) => {
        setIsUserLogin(data);
        dispatch(LoaderActions.setLoader(false));
      }).catch((err) => {
        Alert.alert(
          'Verify Your Email',
          err.toString(),
          [
            { text: 'OK', onPress: () => console.log('OK Pressed') }
          ],
          { cancelable: false }
        );
        console.log(typeof err);
        dispatch(LoaderActions.setLoader(false));
      });
    }
  };

  const checkIsLogin = () => {
    isLogin()
      .then((data) => {
        setIsUserLogin(data);
      })
      .catch((err) => {
        onPressCloseProfileModal();
        setIsUserLogin(false);
      });
  };

  const onPressLogout = () => {
    onPressCloseProfileModal();
    auth0Logout().then(() => {
      checkIsLogin();
    });
  };

  const renderVideoModal = () => {
    return (
      <Modal visible={isModalVisible} animationType={'slide'}>
        <View style={styles.modalContainer}>
          <Ionicons
            name={'md-close'}
            size={30}
            color={Colors.WHITE}
            onPress={onPressLearn}
            style={styles.closeIcon}
          />
          {isModalVisible && (
            <Video
              repeat={true}
              resizeMode={'contain'}
              posterResizeMode={'stretch'}
              source={require('./learn.mp4')}
              style={styles.videoPLayer}
            />
          )}
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaViewCont}>
      {state.isLoading ? <Loader isLoaderShow={true} /> :
        <View style={styles.container}>
          <ScrollView style={styles.safeAreaViewCont} showsVerticalScrollIndicator={false}>
            <MainScreenHeader
              onPressLogin={onPressLogin}
              isUserLogin={isUserLogin}
              testID={'btn_login'}
              accessibilityLabel={'Login / Sign Up'}
            />
            <View style={styles.bannerImgContainer}>
              <SvgXml xml={main_screen_banner} />
            </View>
            <Header
              headingText={i18next.t('label.tree_mapper')}
              hideBackIcon
              textAlignStyle={{ textAlign: 'center' }}
            />
            <ImageBackground id={'inventorybtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={() => onPressLargeButtons('TreeInventory')}
                notification
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.tree_inventory')}
                active={false}
                subHeading={i18next.t('label.tree_inventory_sub_header')}
                notification={numberOfInventory > 0 && numberOfInventory}
                testID="page_tree_inventory"
                accessibilityLabel="Tree Inventory"
              />
            </ImageBackground>
            <ImageBackground id={'downloadmapbtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={() => onPressLargeButtons('DownloadMap')}
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.download_maps')}
                active={false}
                subHeading={i18next.t('label.download_maps_sub_header')}
                testID="page_map"
                accessibilityLabel="Download Map"
              />
            </ImageBackground>
            <ImageBackground id={'learnbtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={onPressLearn}
                rightIcon={rightIcon}
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.learn')}
                active={false}
                subHeading={i18next.t('label.learn_sub_header')}
                accessibilityLabel="Learn"
                testID="page_learn"
              />
            </ImageBackground>
          </ScrollView>
          <PrimaryButton
            onPress={() => onPressLargeButtons('RegisterTree')}
            btnText={i18next.t('label.register_tree')}
            testID={'btn_register_trees'}
            accessibilityLabel={'Register Tree'}
          />
        </View>}
      {renderVideoModal()}
      <ProfileModal
        isUserLogin={isUserLogin}
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={onPressCloseProfileModal}
        onPressLogout={onPressLogout}
      />
    </SafeAreaView>
  );
};
export default MainScreen;

const styles = StyleSheet.create({
  safeAreaViewCont: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.BLACK,
    padding: 30,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    textAlign: 'center',
  },
  customStyleLargeBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginVertical: 0,
    borderWidth: 0.1,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '150%',
    overflow: 'hidden',
    marginVertical: 10,
    borderRadius: 5,
  },
  bannerImgContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 30,
  },
  bannerImage: {
    alignSelf: 'center',
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
    zIndex: 100,
  },
});
