import React, { useContext, useEffect, useState } from 'react';
import {
  ImageBackground,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Realm from 'realm';
import { Colors, Typography } from '_styles';
import { APIConfig } from '../../actions/Config';
import { updateCount } from '../../actions/inventory';
import { startLoading, stopLoading } from '../../actions/loader';
import { auth0Login, auth0Logout, clearUserDetails, setUserDetails } from '../../actions/user';
import { main_screen_banner, map_texture } from '../../assets';
import i18next from '../../languages/languages';
import { InventoryContext } from '../../reducers/inventory';
import { LoadingContext } from '../../reducers/loader';
import { UserContext } from '../../reducers/user';
import { getSchema } from '../../repositories/default';
import { clearAllUploadedInventory, getInventoryByStatus } from '../../repositories/inventory';
import { shouldSpeciesUpdate } from '../../repositories/species';
import { getUserDetails } from '../../repositories/user';
import {
  Header,
  LargeButton,
  Loader,
  MainScreenHeader,
  PrimaryButton,
  SpeciesSyncError,
  Sync,
} from '../Common';
import VerifyEmailAlert from '../Common/EmailAlert';
import ProfileModal from '../ProfileModal';
import { PENDING_DATA_UPLOAD, PENDING_IMAGE_UPLOAD } from '../../utils/inventoryConstants';

const { protocol, cdnUrl } = APIConfig;

const MainScreen = ({ navigation }) => {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const { state, dispatch } = useContext(InventoryContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const [userInfo, setUserInfo] = useState({});
  const [emailAlert, setEmailAlert] = useState(false);
  const [pendingInventory, setPendingInventory] = useState(0);
  // const netInfo = useNetInfo();
  // const isFocused = useIsFocused();
  useEffect(() => {
    let realm;
    // stores the listener to later unsubscribe when screen is unmounted
    const unsubscribe = navigation.addListener('focus', async () => {
      fetchInventory();
      fetchUserDetails();

      realm = await Realm.open(getSchema());
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

  const fetchInventory = () => {
    getInventoryByStatus('all').then((data) => {
      let count = 0;
      let pendingInventoryCount = 0;
      for (const inventory of data) {
        if (inventory.status === PENDING_DATA_UPLOAD || inventory.status === PENDING_IMAGE_UPLOAD) {
          count++;
        }
        if (inventory.status === PENDING_DATA_UPLOAD) {
          pendingInventoryCount++;
        }
      }
      updateCount({ type: PENDING_DATA_UPLOAD, count })(dispatch);
      setPendingInventory(pendingInventoryCount);
      setNumberOfInventory(data ? data.length : 0);
    });
  };

  const fetchUserDetails = () => {
    if (!loadingState.isLoading) {
      getUserDetails().then((userDetails) => {
        if (userDetails) {
          const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetails));
          if (stringifiedUserDetails) {
            setUserInfo(stringifiedUserDetails);
            setIsUserLogin(!!stringifiedUserDetails.accessToken);
          }
        }
      });
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [loadingState.isLoading]);

  // ! Need to changed when auto upload is implemented
  // useEffect(() => {
  //   if (pendingInventory !== 0 && isFocused && !loadingState.isLoading) {
  //     checkLoginAndSync({
  //       sync: true,
  //       dispatch,
  //       userDispatch,
  //       connected: netInfo.isConnected,
  //       internet: netInfo.isInternetReachable,
  //     });
  //   }
  // }, [pendingInventory, netInfo, isFocused]);

  // Define the collection notification listener
  function listener(userData, changes) {
    if (changes.deletions.length > 0) {
      setUserInfo({});
      setIsUserLogin(false);
      clearUserDetails()(userDispatch);
    }

    // Update UI in response to inserted objects
    changes.insertions.forEach((index) => {
      if (userData[index].id === 'id0001') {
        checkIsSignedInAndUpdate(userData[index]);
      }
    });

    // Update UI in response to modified objects
    changes.modifications.forEach((index) => {
      if (userData[index].id === 'id0001') {
        checkIsSignedInAndUpdate(userData[index]);
      }
    });
  }

  function inventoryListener(data, changes) {
    if (changes.deletions.length > 0) {
      fetchInventory();
    }
    if (changes.insertions.length > 0) {
      fetchInventory();
    }
  }

  // initializes the realm by adding listener to user object of realm to listen
  // the modifications and update the application state
  const initializeRealm = async (realm) => {
    try {
      // gets the user object from realm
      const userObject = realm.objects('User');
      const plantLocationObject = realm.objects('Inventory');
      // Observe collection notifications.
      userObject.addListener(listener);
      plantLocationObject.addListener(inventoryListener);
    } catch (err) {
      console.error('Error at /components/MainScreen/initializeRealm, ', err);
    }
  };

  const checkIsSignedInAndUpdate = (userDetail) => {
    const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetail));
    if (stringifiedUserDetails.isSignUpRequired) {
      navigation.navigate('SignUp');
    } else {
      // dispatch function sets the passed user details into the user state
      setUserDetails(stringifiedUserDetails)(userDispatch);
      setUserInfo(stringifiedUserDetails);
      setIsUserLogin(stringifiedUserDetails.accessToken ? true : false);
    }
  };

  // let rightIcon = <Icon size={40} name={'play-circle'} color={Colors.GRAY_LIGHTEST} />;

  const onPressLargeButtons = (screenName) => navigation.navigate(screenName);

  const onPressCloseProfileModal = () => setIsProfileModalVisible(!isProfileModalVisible);

  const onPressLogin = async () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      startLoading()(loadingDispatch);
      auth0Login(userDispatch)
        .then(() => {
          stopLoading()(loadingDispatch);
          fetchUserDetails();
        })
        .catch((err) => {
          if (err?.response?.status === 303) {
            navigation.navigate('SignUp');
          } else if (
            (err.error !== 'a0.session.user_cancelled' && err?.response?.status < 500) ||
            (err?.message == 401 && err?.name === 'unauthorized')
          ) {
            setEmailAlert(true);
          }
          stopLoading()(loadingDispatch);
        });
    }
  };

  const onPressLogout = () => {
    onPressCloseProfileModal();
    clearAllUploadedInventory();
    shouldSpeciesUpdate()
      .then((isSyncRequired) => {
        if (isSyncRequired) {
          navigation.navigate('LogoutWarning');
        } else {
          auth0Logout(userDispatch).then((result) => {
            if (result) {
              setUserInfo({});
            }
          });
        }
      })
      .catch((err) => console.error(err));
  };

  const onPressLegals = () => {
    navigation.navigate('Legals');
  };

  const onPressSupport = () => {
    Linking.openURL('mailto:support@plant-for-the-planet.org').catch(() =>
      // TODO:i18n - if this is used, please add translations
      alert('Can write mail to support@plant-for-the-planet.org'),
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
                setEmailAlert={setEmailAlert}
              />
              <MainScreenHeader
                onPressLogin={onPressLogin}
                isUserLogin={isUserLogin}
                testID={'btn_login'}
                accessibilityLabel={'Login/Sign Up'}
                photo={
                  cdnUrl && userInfo.image
                    ? `${protocol}://${cdnUrl}/media/cache/profile/avatar/${userInfo.image}`
                    : ''
                }
                name={userInfo ? userInfo.firstName : ''}
              />
            </View>
            <SpeciesSyncError />
            <View style={styles.bannerImgContainer}>
              <SvgXml xml={main_screen_banner} />
            </View>
            <Header
              headingText={i18next.t('label.tree_mapper')}
              hideBackIcon
              textAlignStyle={{ textAlign: 'center' }}
            />
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
            </View>
          </ScrollView>
          <PrimaryButton
            onPress={() => onPressLargeButtons('RegisterTree')}
            btnText={i18next.t('label.register_tree')}
            testID={'btn_register_trees'}
            accessibilityLabel={'Register Tree'}
          />
          {!isUserLogin ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                marginHorizontal: 50,
              }}>
              <Text onPress={onPressLegals} style={styles.textAlignCenter}>
                {i18next.t('label.legal_docs')}
              </Text>
              <Text>•</Text>
              <Text onPress={onPressSupport} style={styles.textAlignCenter}>
                {i18next.t('label.support')}
              </Text>
            </View>
          ) : (
            <View />
          )}
        </View>
      )}
      <ProfileModal
        isUserLogin={isUserLogin}
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={onPressCloseProfileModal}
        onPressLogout={onPressLogout}
        userInfo={userInfo}
      />
      <VerifyEmailAlert emailAlert={emailAlert} setEmailAlert={setEmailAlert} />
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
  textAlignCenter: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});
