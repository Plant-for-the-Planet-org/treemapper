import {useNetInfo} from '@react-native-community/netinfo';
import {useNavigation} from '@react-navigation/core';
import i18next from 'i18next';
import React, {useContext, useEffect, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import {setFetchNecessaryInventoryFlag, updateCount} from '../../actions/inventory';
import {startLoading, stopLoading} from '../../actions/loader';
import {auth0Login, auth0Logout, clearUserDetails, setUserDetails} from '../../actions/user';
import {InventoryContext, inventoryFetchConstant} from '../../reducers/inventory';
import {LoadingContext} from '../../reducers/loader';
import {PlantLocationHistoryContext} from '../../reducers/plantLocationHistory';
import {UserContext} from '../../reducers/user';
import {getSchema} from '../../repositories/default';
import {
  clearAllUploadedInventory,
  getInventoryCount,
  updateMissingDataStatus,
} from '../../repositories/inventory';
import {getAllProjects} from '../../repositories/projects';
import {shouldSpeciesUpdate} from '../../repositories/species';
import {getUserDetails, modifyUserDetails} from '../../repositories/user';
import {Colors, Typography} from '../../styles';
import {PENDING_DATA_UPLOAD, PENDING_UPLOAD_COUNT} from '../../utils/inventoryConstants';
import {AlertModal, Sync} from '../Common';
import RotatingView from '../Common/RotatingView';
import ProfileModal from '../ProfileModal';
import BottomBar from './BottomBar';
import LoginButton from './LoginButton';
import MainMap from './MainMap';
import ProjectAndSiteSelector from './ProjectAndSiteSelector';
import {InventoryTypeSelector} from './InventoryTypeSelector';
import {InventoryType} from '../../types/inventory';

const IS_ANDROID = Platform.OS === 'android';

export default function MainScreen() {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [userInfo, setUserInfo] = useState<any>({});
  const [emailAlert, setEmailAlert] = useState(false);
  const [offlineModal, setOfflineModal] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [showProjectSiteOptions, setShowProjectSiteOptions] = useState(false);

  // If true then hides bottom bar, pending and login buttons and shows the selected polygon
  const [showClickedGeoJSON, setShowClickedGeoJSON] = useState(false);

  // used to store all the projects
  const [projects, setProjects] = useState<any>([]);
  // used to set all the project sites of selected project
  const [projectSites, setProjectSites] = React.useState([]);

  // sets the bound to focus the selected site
  const [siteBounds, setSiteBounds] = useState<any>([]);

  // used to store and focus on the center of the bounding box of the selected site
  const [siteCenterCoordinate, setSiteCenterCoordinate] = useState<any>([]);

  const {state, dispatch} = useContext(InventoryContext);
  const {dispatch: userDispatch} = useContext(UserContext);
  const {state: loadingState, dispatch: loadingDispatch} = useContext(LoadingContext);
  const {getPendingPlantLocationHistory} = useContext(PlantLocationHistoryContext);

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

  // added projects to the state
  useEffect(() => {
    fetchAndSaveProjects();
    updateMissingDataStatus();
  }, []);

  useEffect(() => {
    if (showClickedGeoJSON) {
      setOfflineModal(false);
      setIsProfileModalVisible(false);
    }
  }, [showClickedGeoJSON]);

  // hides project site option if project options is shown
  useEffect(() => {
    if (showProjectOptions) {
      setShowProjectSiteOptions(false);
    }
  }, [showProjectOptions]);

  const fetchAndSaveProjects = async () => {
    const allProjects = await getAllProjects();
    if (allProjects && allProjects.length > 0) {
      setProjects(allProjects);
    }
  };

  const checkIsSignedInAndUpdate = (userDetail: any) => {
    const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetail));
    if (stringifiedUserDetails.isSignUpRequired) {
      navigation.navigate('SignUp');
    } else {
      // dispatch function sets the passed user details into the user state
      setUserDetails(stringifiedUserDetails)(userDispatch);
      console.log('11');

      setUserInfo(stringifiedUserDetails);
      setIsUserLogin(!!stringifiedUserDetails.accessToken);
    }
  };

  // Define the collection notification listener
  function listener(userData: Realm.Collection<any>, changes: Realm.CollectionChangeSet) {
    if (changes.deletions.length > 0) {
      console.log('22');
      setUserInfo({});
      setIsUserLogin(false);
      clearUserDetails()(userDispatch);
    }

    // Update UI in response to inserted objects
    changes.insertions.forEach(index => {
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
    if (changes.deletions.length > 0 || changes.insertions.length > 0) {
      fetchInventoryCount();
    }
  }

  function projectListener(_: Realm.Collection<any>, changes: Realm.CollectionChangeSet) {
    if (
      changes.deletions.length > 0 ||
      changes.insertions.length > 0 ||
      changes.newModifications.length > 0
    ) {
      fetchAndSaveProjects();
    }
  }

  function plantLocationHistoryListener(
    _: Realm.Collection<any>,
    changes: Realm.CollectionChangeSet,
  ) {
    if (
      changes.deletions.length > 0 ||
      changes.insertions.length > 0 ||
      changes.newModifications.length > 0
    ) {
      getPendingPlantLocationHistory();
    }
  }

  // initializes the realm by adding listener to user object of realm to listen
  // the modifications and update the application state
  const initializeRealm = async (realm: Realm) => {
    try {
      // gets the user object from realm
      const userObject = realm.objects('User');
      const plantLocationObject = realm.objects('Inventory');
      const projectsObject = realm.objects('Projects');
      const plantLocationHistoryObject = realm.objects('PlantLocationHistory');
      // Observe collection notifications.
      userObject.addListener(listener);
      plantLocationObject.addListener(inventoryListener);
      projectsObject.addListener(projectListener);
      plantLocationHistoryObject.addListener(plantLocationHistoryListener);
    } catch (err) {
      console.error('Error at /components/MainScreen/initializeRealm, ', err);
    }
  };

  const closeProfileModal = () => setIsProfileModalVisible(false);

  const fetchUserDetails = () => {
    if (!loadingState.isLoading) {
      getUserDetails().then(userDetails => {
        if (userDetails) {
          const stringifiedUserDetails = JSON.parse(JSON.stringify(userDetails));
          if (stringifiedUserDetails) {
            console.log('33');
            setUserInfo(stringifiedUserDetails);
            setIsUserLogin(!!stringifiedUserDetails.accessToken);
          }
        }
      });
    }
  };

  const fetchInventoryCount = () => {
    getInventoryCount(PENDING_UPLOAD_COUNT).then(count => {
      updateCount({type: PENDING_DATA_UPLOAD, count})(dispatch);
    });
    getInventoryCount().then(count => {
      setNumberOfInventory(count);
    });
  };

  const onPressLogin = async () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      startLoading()(loadingDispatch);
      auth0Login(userDispatch, dispatch)
        .then(() => {
          stopLoading()(loadingDispatch);
          fetchUserDetails();
          fetchInventoryCount();
        })
        .catch(err => {
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
        .then(isSyncRequired => {
          if (isSyncRequired) {
            navigation.navigate('LogoutWarning');
          } else {
            auth0Logout(userDispatch).then(async result => {
              if (result) {
                console.log('55');
                setUserInfo({});
                await modifyUserDetails({
                  fetchNecessaryInventoryFlag: InventoryType.NecessaryItems,
                });
                setFetchNecessaryInventoryFlag(InventoryType.NecessaryItems)(dispatch);
              }
            });
          }
        })
        .catch(err => console.error(err));
    } else {
      setOfflineModal(true);
    }
  };

  const topValue = Platform.OS === 'ios' ? 50 : 25;

  // console.log(isUserLogin, userInfo, 'userInfo?.type');

  return (
    <>
      <MainMap
        showClickedGeoJSON={showClickedGeoJSON}
        setShowClickedGeoJSON={setShowClickedGeoJSON}
        userInfo={userInfo}
        siteCenterCoordinate={siteCenterCoordinate}
        siteBounds={siteBounds}
        projectSites={projectSites}
      />

      {!showClickedGeoJSON ? (
        <>
          <View style={{position: 'absolute', top: topValue, left: 25, right: 25}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
              <View style={{display: 'flex', width: '45%'}}>
                <Sync
                  uploadCount={state.uploadCount}
                  pendingCount={state.pendingCount}
                  isUploading={state.isUploading}
                  isUserLogin={isUserLogin}
                  setEmailAlert={setEmailAlert}
                />

                {isUserLogin && <InventoryTypeSelector />}
              </View>

              {isUserLogin ? (
                userInfo?.type === 'tpo' &&
                projects.length > 0 && (
                  <ProjectAndSiteSelector
                    projects={projects}
                    showProjectOptions={showProjectOptions}
                    setShowProjectOptions={setShowProjectOptions}
                    showProjectSiteOptions={showProjectSiteOptions}
                    setShowProjectSiteOptions={setShowProjectSiteOptions}
                    setSiteCenterCoordinate={setSiteCenterCoordinate}
                    setSiteBounds={setSiteBounds}
                    projectSites={projectSites}
                    setProjectSites={setProjectSites}
                    IS_ANDROID={IS_ANDROID}
                  />
                )
              ) : (
                <LoginButton onPressLogin={onPressLogin} isUserLogin={isUserLogin} />
              )}
            </View>
            {state.inventoryFetchProgress === inventoryFetchConstant.IN_PROGRESS ? (
              <View style={[styles.fetchPlantLocationContainer, {zIndex: IS_ANDROID ? 0 : -1}]}>
                <View style={{marginRight: 16}}>
                  <RotatingView isClockwise={true}>
                    <FA5Icon size={16} name="sync-alt" color={Colors.PRIMARY} />
                  </RotatingView>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.text}>
                    {i18next.t('label.plant_location_fetch_in_progress')}
                  </Text>
                </View>
              </View>
            ) : (
              []
            )}
          </View>
          <SafeAreaView>
            <BottomBar
              onMenuPress={() => setIsProfileModalVisible(true)}
              onTreeInventoryPress={() => navigation.navigate('TreeInventory')}
              numberOfInventory={numberOfInventory}
            />
          </SafeAreaView>
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

const styles = StyleSheet.create({
  fetchPlantLocationContainer: {
    marginTop: 20,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
