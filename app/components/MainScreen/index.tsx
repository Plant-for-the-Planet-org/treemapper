import {
  View,
  Text,
  Platform,
  FlatList,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import { Modalize } from 'react-native-modalize';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/core';
import { useFocusEffect } from '@react-navigation/native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import React, { useContext, useEffect, useState, useRef } from 'react';

import {
  auth0Login,
  auth0Logout,
  getAllProjects,
  setUserDetails,
  clearUserDetails,
} from '../../actions/user';
import {
  getInventoryCount,
  updateMissingDataStatus,
  clearAllUploadedInventory,
} from '../../repositories/inventory';
import MainMap from './MainMap';
import BottomBar from './BottomBar';
import LoginButton from './LoginButton';
import ProfileModal from '../ProfileModal';
import { UserContext } from '../../reducers/user';
import { Colors, Typography } from '../../styles';
import RotatingView from '../Common/RotatingView';
import { AlertModal, Switch, Sync } from '../Common';
import { InventoryType } from '../../types/inventory';
import { getSchema } from '../../repositories/default';
import { LoadingContext } from '../../reducers/loader';
import ProjectAndSiteSelector from './ProjectAndSiteSelector';
import { InventoryTypeSelector } from './InventoryTypeSelector';
import { startLoading, stopLoading } from '../../actions/loader';
import { shouldSpeciesUpdate } from '../../repositories/species';
import CustomDropDownPicker from '../Common/Dropdown/CustomDropDownPicker';
import { getUserDetails, modifyUserDetails } from '../../repositories/user';
import { PlantLocationHistoryContext } from '../../reducers/plantLocationHistory';
import { InventoryContext, inventoryFetchConstant } from '../../reducers/inventory';
import { setFetchNecessaryInventoryFlag, updateCount } from '../../actions/inventory';
import { PENDING_DATA_UPLOAD, PENDING_UPLOAD_COUNT } from '../../utils/inventoryConstants';

const { width, height } = Dimensions.get('screen');
const IS_ANDROID = Platform.OS === 'android';
const topValue = Platform.OS === 'ios' ? 50 : 25;
const FETCH_PLANT_LOCATION_ZINDEX = { zIndex: IS_ANDROID ? 0 : -1 };
const MODEL_TYPE = { ZOOM_TO_SITE: 'zoomToSite', FILTERS: 'filters' };

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

  const [selectedSite, setSelectedSite] = React.useState(null);

  // sets the bound to focus the selected site
  const [siteBounds, setSiteBounds] = useState<any>([]);

  // used to store and focus on the center of the bounding box of the selected site
  const [siteCenterCoordinate, setSiteCenterCoordinate] = useState<any>([]);

  // dropdown states
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  const [modalType, setModalType] = useState<string>('');

  const { state, dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);
  const { getPendingPlantLocationHistory } = useContext(PlantLocationHistoryContext);

  const netInfo = useNetInfo();
  const navigation = useNavigation();

  const modalizeRef = useRef<Modalize>(null);

  const _onOpen = modalType => () => {
    setModalType(modalType);
    modalizeRef.current?.open();
  };

  const onClose = () => {
    setModalType('');
    modalizeRef.current?.close();
  };

  useFocusEffect(
    React.useCallback(() => {
      if (projects.length > 0) {
        setValue(projects[0]?.properties?.id);
        setProjectSites(projects[0]?.properties?.sites || []);
      }
    }, [projects]),
  );

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
    // directly api call instead retrieving from db .. have to change in future
    const allProjects = await getAllProjects();
    if (allProjects && allProjects.length > 0) {
      setProjects(allProjects);
      const dropdownArr = allProjects.map(project => {
        return { value: project.properties.id, label: project.properties.name };
      });
      setItems(dropdownArr);
    }
  };

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
            setUserInfo(stringifiedUserDetails);
            setIsUserLogin(!!stringifiedUserDetails.accessToken);
          }
        }
      });
    }
  };

  const fetchInventoryCount = () => {
    getInventoryCount(PENDING_UPLOAD_COUNT).then(count => {
      updateCount({ type: PENDING_DATA_UPLOAD, count })(dispatch);
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

  const _onSelectSite = item => () => {
    setSelectedSite(item);
    setSiteBounds(bbox(item?.geometry));
    const centerCoordinate = turfCenter(item?.geometry)?.geometry?.coordinates;
    setSiteCenterCoordinate(centerCoordinate);
    onClose();
  };

  const renderSiteList = ({ item, index }) => (
    <TouchableOpacity onPress={_onSelectSite(item)} activeOpacity={0.7} style={styles.listItem}>
      <View style={styles.listItemCon}>
        <Text
          style={
            selectedSite?.id !== item?.id
              ? styles.listItemTitle
              : { ...styles.listItemTitle, fontFamily: Typography.FONT_FAMILY_BOLD }
          }>
          {item?.name}
        </Text>
        {selectedSite?.id === item?.id ? (
          <Entypo size={16} name="check" color={Colors.PRIMARY} />
        ) : (
          []
        )}
      </View>
      {projectSites.length - 1 !== index && <View style={styles.divider} />}
    </TouchableOpacity>
  );

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

  const onSelectProject = val => {
    const selectedProjectSites = projects.filter(item => item?.properties?.id === val)[0]
      ?.properties?.sites;
    setProjectSites(selectedProjectSites);
  };

  const onPressCloseProfileModal = () => closeProfileModal();
  const onPressPrimaryBtn = () => {
    setOfflineModal(false);
    closeProfileModal();
  };

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
          {/* <View style={[styles.mainMapHeaderContainer, { top: topValue }]}>
            <View style={styles.mainMapHeader}>
              <View style={{ display: 'flex', width: '45%' }}>
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
              <View style={[styles.fetchPlantLocationContainer, FETCH_PLANT_LOCATION_ZINDEX]}>
                <View style={styles.syncIconContainer}>
                  <RotatingView isClockwise={true}>
                    <FA5Icon size={16} name="sync-alt" color={Colors.PRIMARY} />
                  </RotatingView>
                </View>
                <View style={styles.syncTextContainer}>
                  <Text style={styles.text}>
                    {i18next.t('label.plant_location_fetch_in_progress')}
                  </Text>
                </View>
              </View>
            ) : (
              []
            )}
          </View> */}
          <View style={[styles.mainMapHeaderContainer, styles.extraHeaderStyle]}>
            <View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.openDrawer()}
                style={[styles.headerLeftBtn, styles.boxShadow]}>
                <IonIcons name={'menu'} size={24} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={_onOpen('zoomToSite')}
                activeOpacity={0.7}
                style={[styles.headerBtn, styles.boxShadow]}>
                <IonIcons name={'location'} size={24} color={Colors.WHITE} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={_onOpen('filters')}
                activeOpacity={0.7}
                style={[styles.headerBtn, styles.boxShadow]}>
                <IonIcons name={'options'} size={24} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        []
      )}

      <Modalize adjustToContentHeight withReactModal ref={modalizeRef}>
        <View style={styles.filterModalHeader}>
          <View style={styles.filterModalHeaderInfo}>
            <IonIcons
              name={modalType === MODEL_TYPE.FILTERS ? 'options' : 'location'}
              size={24}
              color={Colors.PRIMARY}
            />
            <Text style={styles.filterModalHeaderTitle}>
              {modalType === MODEL_TYPE.FILTERS ? 'Filters' : 'Zoom to site'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <IonIcons name={'close'} size={24} color={Colors.BLACK} />
          </TouchableOpacity>
        </View>
        {modalType === MODEL_TYPE.FILTERS && (
          <View style={styles.filter}>
            <View style={styles.filterItem}>
              <Text style={styles.filterItemLabel}>Interventions</Text>
              <Switch value={true} onValueChange={val => {}} />
            </View>
            <View style={[styles.filterItem, { backgroundColor: '#E0E0E066' }]}>
              <Text style={styles.filterItemLabel}>Monitoring Plots</Text>
              <Switch value={false} onValueChange={val => {}} />
            </View>
            <View style={[styles.filterItem, { backgroundColor: '#E0E0E066' }]}>
              <Text style={styles.filterItemLabel}>Only interventions that need remeasurement</Text>
              <Switch value={false} onValueChange={val => {}} />
            </View>
          </View>
        )}
        {modalType === MODEL_TYPE.ZOOM_TO_SITE && (
          <View style={styles.filter}>
            <View style={styles.dropdownContainer}>
              <Text style={[styles.zoomToSiteTitle]}>Select Project</Text>
              <CustomDropDownPicker
                open={open}
                items={items}
                value={value}
                setOpen={setOpen}
                setValue={setValue}
                onChangeValue={onSelectProject}
                style={{ borderRadius: 5 }}
                placeholder={'Select Project'}
              />
            </View>
            <Text
              style={[styles.zoomToSiteTitle, { marginBottom: 16, marginTop: 37, marginLeft: 9 }]}>
              Select Site
            </Text>
            <FlatList
              data={projectSites}
              renderItem={renderSiteList}
              style={{ borderRadius: 12, height: 176 }}
              keyExtractor={item => `SITE_ARR${item?.id}`}
            />
          </View>
        )}
      </Modalize>
      <ProfileModal
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={onPressCloseProfileModal}
        onPressLogout={onPressLogout}
        userInfo={userInfo}
      />
      <AlertModal
        visible={offlineModal}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={onPressPrimaryBtn}
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
  mainMapHeaderContainer: {
    position: 'absolute',
    left: 25,
    right: 25,
  },
  mainMapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  syncIconContainer: {
    marginRight: 16,
  },
  syncTextContainer: {
    flex: 1,
  },
  headerLeftBtn: {
    padding: 8,
    width: 40,
    height: 40,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: Colors.PRIMARY,
  },
  headerBtn: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY,
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
    marginRight: 12,
  },
  boxShadow: {
    // shadow
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.62,
    elevation: 5,
  },
  extraHeaderStyle: {
    width,
    left: 0,
    top: topValue,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterModalHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterModalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterModalHeaderTitle: {
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    marginLeft: 12,
  },
  filter: {
    padding: 10,
    marginBottom: 20,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.PRIMARY + '10',
    borderRadius: 8,
    minHeight: 54,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterItemLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.DARK_TEXT_COLOR,
    marginLeft: 12,
    width: width / 2,
  },
  zoomToSiteTitle: {
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    marginBottom: 21,
  },
  dropdownContainer: {
    paddingHorizontal: 9,
    zIndex: 2000,
  },
  listItem: {
    backgroundColor: '#E0E0E050',
  },
  listItemCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  listItemTitle: {
    paddingVertical: 12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_13,
    color: Colors.TEXT_COLOR,
  },
  divider: {
    height: 1,
    width: '93%',
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
  },
});
