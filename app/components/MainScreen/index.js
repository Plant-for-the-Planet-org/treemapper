import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { Colors, Typography } from '_styles';
import { updateCount } from '../../actions/inventory';
import { startLoading, stopLoading } from '../../actions/loader';
import { main_screen_banner, map_texture } from '../../assets';
import i18next from '../../languages/languages';
import { InventoryContext } from '../../reducers/inventory';
import { LoadingContext } from '../../reducers/loader';
import { getInventoryByStatus } from '../../repositories/inventory';
import { getUserDetails } from '../../repositories/user';
import {
  auth0Logout,
  auth0Login,
  setUserDetails,
  clearUserDetails,
  getCdnUrls,
} from '../../actions/user';
import { Header, LargeButton, Loader, MainScreenHeader, PrimaryButton, Sync } from '../Common';
import ProfileModal from '../ProfileModal';
import { UserContext } from '../../reducers/user';
import Realm from 'realm';

const MainScreen = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // * FOR VIDEO MODAL
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const { state, dispatch } = useContext(InventoryContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const [userInfo, setUserInfo] = useState({});
  const [cdnUrls, setCdnUrls] = useState({});

  useEffect(() => {
    let realm;
    // stores the listener to later unsubscribe when screen is unmounted
    const unsubscribe = navigation.addListener('focus', async () => {
      getInventoryByStatus('all').then((data) => {
        let count = 0;
        for (const inventory of data) {
          if (inventory.status === 'pending' || inventory.status === 'uploading') {
            count++;
          }
        }
        updateCount({ type: 'pending', count })(dispatch);
        setNumberOfInventory(data ? Object.values(data).length : 0);
      });
      realm = await Realm.open();
      initializeRealm(realm);
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return () => {
      unsubscribe();
      if (realm) {
        // Unregister all realm listeners
        realm.removeAllListeners();
      }
    };
  }, [navigation]);

  useEffect(() => {
    getUserDetails().then((userDetails) => {
      if (userDetails) {
        setUserInfo(userDetails);
        setIsUserLogin(userDetails.accessToken ? true : false);
      }
    });
    getCdnUrls().then((cdnMedia) => {
      setCdnUrls(cdnMedia);
    });
  }, []);

  const initializeRealm = async (realm) => {
    const userObject = realm.objects('User');

    // Define the collection notification listener
    function listener(userObject, changes) {
      if (changes.deletions.length > 0) {
        setUserInfo({});
        setIsUserLogin(false);
        clearUserDetails()(userDispatch);
      }
      // Update UI in response to inserted objects
      changes.insertions.forEach((index) => {
        if (userObject[index].id === 'id0001') {
          checkIsSignedInAndUpdate(userObject[index]);
        }
      });
      // Update UI in response to modified objects
      changes.modifications.forEach((index) => {
        if (userObject[index].id === 'id0001') {
          checkIsSignedInAndUpdate(userObject[index]);
        }
      });
    }
    // Observe collection notifications.
    userObject.addListener(listener);
  };

  const checkIsSignedInAndUpdate = (userDetail) => {
    if (userDetail.isSignUpRequired) {
      navigation.navigate('SignUp');
    } else {
      // dispatch function sets the passed user details into the user state
      setUserDetails(userDetail)(userDispatch);
      setUserInfo(userDetail);
      setIsUserLogin(userDetail.accessToken ? true : false);
    }
  };

  let rightIcon = <Icon size={40} name={'play-circle'} color={Colors.GRAY_LIGHTEST} />;

  const onPressLargeButtons = (screenName) => navigation.navigate(screenName);

  const onPressLearn = () => setIsModalVisible(!isModalVisible);

  const onPressCloseProfileModal = () => setIsProfileModalVisible(!isProfileModalVisible);

  const onPressLogin = async () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      startLoading()(loadingDispatch);
      auth0Login(userDispatch)
        .then(() => {
          stopLoading()(loadingDispatch);
        })
        .catch((err) => {
          if (err?.response?.status === 303) {
            navigation.navigate('SignUp');
          } else if (err.error !== 'a0.session.user_cancelled') {
            Alert.alert(
              'Verify your Email',
              'Please verify your email before logging in.',
              [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
              { cancelable: false },
            );
          }
          stopLoading()(loadingDispatch);
        });
    }
  };

  const onPressLogout = () => {
    onPressCloseProfileModal();
    auth0Logout(userDispatch);
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
      {loadingState.isLoading ? (
        <Loader isLoaderShow={true} />
      ) : (
        <View style={styles.container}>
          <ScrollView style={styles.safeAreaViewCont} showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Sync
                uploadCount={state.uploadCount}
                pendingCount={state.pendingCount}
                isUploading={state.isUploading}
                isUserLogin={isUserLogin}
              />
              <MainScreenHeader
                onPressLogin={onPressLogin}
                isUserLogin={isUserLogin}
                testID={'btn_login'}
                accessibilityLabel={'Login/Sign Up'}
                photo={
                  cdnUrls && cdnUrls.cache && userInfo.image
                    ? `${cdnUrls.cache}/profile/avatar/${userInfo.image}`
                    : ''
                }
              />
            </View>
            {/* <View> */}
            <View style={styles.bannerImgContainer}>
              <SvgXml xml={main_screen_banner} />
            </View>
            <Header
              headingText={i18next.t('label.tree_mapper')}
              hideBackIcon
              textAlignStyle={{ textAlign: 'center' }}
            />
            {/* </View> */}
            <View>
              <ImageBackground id={'inventorybtn'} source={map_texture} style={styles.bgImage}>
                <LargeButton
                  onPress={() => onPressLargeButtons('TreeInventory')}
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
              {/* <ImageBackground id={'learnbtn'} source={map_texture} style={styles.bgImage}>
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
            </ImageBackground> */}
            </View>
          </ScrollView>
          <PrimaryButton
            onPress={() => onPressLargeButtons('RegisterTree')}
            btnText={i18next.t('label.register_tree')}
            testID={'btn_register_trees'}
            accessibilityLabel={'Register Tree'}
          />
        </View>
      )}
      {renderVideoModal()}
      <ProfileModal
        isUserLogin={isUserLogin}
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={onPressCloseProfileModal}
        onPressLogout={onPressLogout}
        userInfo={userInfo}
        cdnUrls={cdnUrls}
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
    paddingTop: 20,
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
    paddingVertical: 50,
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
