import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { APIConfig } from '../../actions/Config';
import { updateCount } from '../../actions/inventory';
import { startLoading, stopLoading } from '../../actions/loader';
import { auth0Login, auth0Logout, clearUserDetails, setUserDetails } from '../../actions/user';
import { InventoryContext } from '../../reducers/inventory';
import { LoadingContext } from '../../reducers/loader';
import { UserContext } from '../../reducers/user';
import { getSchema } from '../../repositories/default';
import { clearAllUploadedInventory, getInventoryCount } from '../../repositories/inventory';
import { shouldSpeciesUpdate } from '../../repositories/species';
import { getUserDetails } from '../../repositories/user';
import { PENDING_DATA_UPLOAD, PENDING_UPLOAD_COUNT } from '../../utils/inventoryConstants';
import { AlertModal, Sync } from '../Common';
import ProfileModal from '../ProfileModal';
import BottomBar from './BottomBar';
import LoginButton from './LoginButton';
import MainMap from './MainMap';

const { protocol, cdnUrl } = APIConfig;

export default function MainScreen() {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [userInfo, setUserInfo] = useState<any>({});
  const [emailAlert, setEmailAlert] = useState(false);
  const [offlineModal, setOfflineModal] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);

  // If true then hides bottom bar, pending and login buttons and shows the selected polygon
  const [showClickedGeoJSON, setShowClickedGeoJSON] = useState(false);

  const { state, dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);

  const netInfo = useNetInfo();
  const navigation = useNavigation();

  useEffect(() => {
    let realm: Realm;
    // stores the listener to later unsubscribe when screen is unmounted
    const unsubscribe = navigation.addListener('focus', async () => {
      fetchUserDetails();
      fetchInventoryCount();

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

  useEffect(() => {
    if (showClickedGeoJSON) {
      setOfflineModal(false);
      setIsProfileModalVisible(false);
    }
  }, [showClickedGeoJSON]);

  const checkIsSignedInAndUpdate = (userDetail: any) => {
    const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetail));
    if (stringifiedUserDetails.isSignUpRequired) {
      navigation.navigate('SignUp');
    } else {
      // dispatch function sets the passed user details into the user state
      setUserDetails(stringifiedUserDetails)(userDispatch);
      setUserInfo(stringifiedUserDetails);
      setIsUserLogin(!!stringifiedUserDetails.accessToken);
    }
  };

  // Define the collection notification listener
  function listener(userData: Realm.Collection<any>, changes: Realm.CollectionChangeSet) {
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

    // TODO: change this to newModifications or oldModifications
    // Update UI in response to modified objects
    // changes.modifications.forEach((index) => {
    //   if (userData[index].id === 'id0001') {
    //     checkIsSignedInAndUpdate(userData[index]);
    //   }
    // });
  }

  function inventoryListener(_: Realm.Collection<any>, changes: Realm.CollectionChangeSet) {
    if (changes.deletions.length > 0) {
      fetchInventoryCount();
    }
    if (changes.insertions.length > 0) {
      fetchInventoryCount();
    }
  }

  // initializes the realm by adding listener to user object of realm to listen
  // the modifications and update the application state
  const initializeRealm = async (realm: Realm) => {
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

  const closeProfileModal = () => setIsProfileModalVisible(false);

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

  const fetchInventoryCount = () => {
    getInventoryCount(PENDING_UPLOAD_COUNT).then((count) => {
      updateCount({ type: PENDING_DATA_UPLOAD, count })(dispatch);
    });
    getInventoryCount().then((count) => {
      setNumberOfInventory(count);
    });
  };

  const onPressLogin = async () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      startLoading()(loadingDispatch);
      auth0Login(userDispatch)
        .then(() => {
          stopLoading()(loadingDispatch);
          fetchUserDetails();
          fetchInventoryCount();
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
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      closeProfileModal();
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
    } else {
      setOfflineModal(true);
    }
  };

  return (
    <>
      <MainMap
        showClickedGeoJSON={showClickedGeoJSON}
        setShowClickedGeoJSON={setShowClickedGeoJSON}
      />

      {!showClickedGeoJSON ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'absolute',
              top: 25,
              left: 25,
              right: 25,
            }}>
            <Sync
              uploadCount={state.uploadCount}
              pendingCount={state.pendingCount}
              isUploading={state.isUploading}
              isUserLogin={isUserLogin}
              setEmailAlert={setEmailAlert}
            />
            <LoginButton onPressLogin={onPressLogin} isUserLogin={isUserLogin} />
          </View>
          <BottomBar
            onMenuPress={() => setIsProfileModalVisible(true)}
            onTreeInventoryPress={() => navigation.navigate('TreeInventory')}
            numberOfInventory={numberOfInventory}
          />
        </>
      ) : (
        []
      )}

      <ProfileModal
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={() => closeProfileModal()}
        onPressLogout={onPressLogout}
        userInfo={userInfo}
      />
      <AlertModal
        visible={offlineModal}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
          setOfflineModal(false);
          closeProfileModal();
        }}
      />
    </>
  );
}
