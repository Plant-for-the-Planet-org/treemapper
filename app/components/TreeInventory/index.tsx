import { useNetInfo } from '@react-native-community/netinfo';
import { StackActions, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { setInventoryId } from '../../actions/inventory';
import { empty_inventory_banner } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { PlantLocationHistoryContext } from '../../reducers/plantLocationHistory';
import { UserContext } from '../../reducers/user';
import { clearAllIncompleteInventory, getInventoryByStatus } from '../../repositories/inventory';
import { getUserDetails } from '../../repositories/user';
import { Colors, Typography } from '../../styles';
import {
  DATA_UPLOAD_START,
  FIX_NEEDED,
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  OFF_SITE,
  PENDING_DATA_UPDATE,
  PENDING_DATA_UPLOAD,
  PENDING_IMAGE_UPLOAD,
  PENDING_SAMPLE_TREES_UPLOAD,
  SINGLE,
  SYNCED,
} from '../../utils/inventoryConstants';
import { uploadInventoryData } from '../../utils/uploadInventory';
import { AlertModal, Header, InventoryCard, PrimaryButton, SmallHeader, Sync } from '../Common';
import VerifyEmailAlert from '../Common/EmailAlert';
import RemeasurementItem from '../Remeasurements/RemeasurementItem';

const isAndroid = Platform.OS === 'android';

const TreeInventory = () => {
  const { state, dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);

  const [allInventory, setAllInventory] = useState(null);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);
  const [emailAlert, setEmailAlert] = useState(false);
  const [pendingInventory, setPendingInventory] = useState([]);
  const [uploadingInventory, setUploadingInventory] = useState([]);
  const [inCompleteInventory, setInCompleteInventory] = useState([]);
  const [uploadedInventory, setUploadedInventory] = useState([]);
  const [fixNeededInventory, setFixNeededInventory] = useState([]);
  const [countryCode, setCountryCode] = useState('');
  const [offlineModal, setOfflineModal] = useState(false);
  const [showDeleteIncompleteAlert, setShowDeleteIncompleteAlert] = useState(false);

  const {
    pendingPlantLocationHistoryUpload,
    uploadRemeasurements,
    pendingPlantLocationHistoryUploadCount,
    isUploading: isRemeasurementUploading,
  } = useContext(PlantLocationHistoryContext);

  const netInfo = useNetInfo();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    if (state.isUploading) {
      filteredInventories();
    }
  }, [state.uploadCount, state.isUploading, state.pendingCount, state.progressCount]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, []);

  const handleBackPress = () => {
    navigation.dispatch(StackActions.popToTop());
    return true;
  };

  const onPressInventory = (item: any) => {
    setInventoryId(item.inventory_id)(dispatch);
    if (item.status !== INCOMPLETE && item.status !== INCOMPLETE_SAMPLE_TREE) {
      if (item.treeType === SINGLE) {
        navigation.navigate('SingleTreeOverview');
      } else {
        navigation.navigate('InventoryOverview');
      }
    } else {
      navigation.navigate(item.lastScreen);
    }
  };

  const initialState = () => {
    getInventoryByStatus([]).then(allInventory => {
      setAllInventory(allInventory);
      filteredInventories();
    });
    getUserDetails().then(userDetails => {
      setCountryCode(userDetails?.country || '');
    });
  };

  const onPressClearAll = () => {
    clearAllIncompleteInventory().then(() => {
      setShowDeleteIncompleteAlert(false);
      getInventoryByStatus([]).then(allInventory => {
        setAllInventory(allInventory);
      });
    });
  };

  const filteredInventories = () => {
    getInventoryByStatus([INCOMPLETE, INCOMPLETE_SAMPLE_TREE]).then(inventoryList => {
      setInCompleteInventory(inventoryList);
    });
    getInventoryByStatus([PENDING_DATA_UPLOAD, PENDING_DATA_UPDATE]).then(inventoryList => {
      setPendingInventory(inventoryList);
    });
    getInventoryByStatus([
      PENDING_IMAGE_UPLOAD,
      PENDING_SAMPLE_TREES_UPLOAD,
      DATA_UPLOAD_START,
    ]).then(inventoryList => {
      setUploadingInventory(inventoryList);
    });
    getInventoryByStatus([SYNCED]).then(inventoryList => {
      setUploadedInventory(inventoryList);
    });
    getInventoryByStatus([FIX_NEEDED]).then(inventoryList => {
      setFixNeededInventory(inventoryList);
    });
  };

  const onPressUploadNow = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      uploadInventoryData(dispatch, userDispatch)
        .then(() => {
          // handleBackPress();
        })
        .catch(err => {
          if (err?.response?.status === 303) {
            navigation.navigate('SignUp');
          } else if (err?.message === 'blocked') {
            setIsPermissionBlockedAlertShow(true);
          } else if (err?.error !== 'a0.session.user_cancelled') {
            setEmailAlert(true);
          }
        });
      navigation.goBack();
    } else {
      setOfflineModal(true);
    }
  };

  const onPressUploadRemeasurement = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      uploadRemeasurements();
    } else {
      setOfflineModal(true);
    }
  };

  const renderLoadingInventoryList = () => {
    return (
      <View style={styles.cont}>
        <Header
          headingText={i18next.t('label.tree_inventory_list_header')}
          subHeadingText={i18next.t('label.tree_inventory_list_sub_header')}
          style={{ marginHorizontal: 25 }}
          onBackPress={handleBackPress}
          TopRightComponent={uploadButton}
        />
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  };

  const renderEmptyInventoryList = () => {
    return (
      <View style={styles.cont}>
        <Header
          headingText={i18next.t('label.tree_inventory_empty_list_header')}
          subHeadingText={i18next.t('label.tree_inventory_list_sub_header')}
          style={{ marginHorizontal: 25 }}
          onBackPress={handleBackPress}
        />
        <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
        <View style={styles.primaryBtnCont}>
          {uploadedInventory.length > 0 && (
            <PrimaryButton
              onPress={() => navigation.navigate('UploadedInventory')}
              btnText={i18next.t('label.tree_inventory_view_upload')}
              theme={'white'}
              style={{ marginVertical: 20 }}
            />
          )}
          <PrimaryButton
            onPress={() => navigation.navigate('TreeTypeSelection')}
            btnText={i18next.t('label.register_tree')}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    );
  };

  const uploadButton = () => {
    return (
      <Sync
        uploadCount={state.uploadCount}
        pendingCount={state.pendingCount}
        isUploading={state.isUploading}
        isUserLogin={true}
        borderLess={true}
      />
    );
  };
  console.log(
    'pendingPlantLocationHistoryUpload :>> ',
    JSON.stringify(pendingPlantLocationHistoryUpload),
    '>>',
  );
  const allData = [
    {
      title: i18next.t('label.tree_inventory_left_text_uploading'),
      data: uploadingInventory,
      type: 'uploading',
    },
    {
      title: i18next.t('label.tree_inventory_left_text'),
      data: pendingInventory,
      type: 'pending',
    },
    {
      title: i18next.t('label.pending_remeasurement_upload'),
      data: pendingPlantLocationHistoryUpload,
      type: 'pending_remeasurement',
    },
    {
      title: i18next.t('label.tree_inventory_incomplete_registrations'),
      data: inCompleteInventory,
      type: 'incomplete',
    },
    {
      title: i18next.t('label.missing_data_found_registration'),
      data: fixNeededInventory,
      type: 'fix_needed',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {pendingInventory.length > 0 ||
      inCompleteInventory.length > 0 ||
      uploadedInventory.length > 0 ||
      fixNeededInventory.length > 0 ||
      uploadingInventory.length > 0 ||
      pendingPlantLocationHistoryUpload.length > 0 ? (
        <SectionList
          sections={allData}
          style={{ paddingHorizontal: 25 }}
          keyExtractor={(_, index) => `list-${index}`}
          ListHeaderComponent={() => (
            <>
              <Header
                headingText={i18next.t('label.tree_inventory_list_header')}
                subHeadingText={i18next.t('label.tree_inventory_list_container_sub_header')}
                onBackPress={handleBackPress}
                TopRightComponent={uploadButton}
              />
              {uploadedInventory.length > 0 && (
                <PrimaryButton
                  onPress={() => navigation.navigate('UploadedInventory')}
                  btnText={i18next.t('label.tree_inventory_view_upload')}
                  theme={'white'}
                  style={{ marginVertical: 20 }}
                />
              )}
            </>
          )}
          renderItem={({ item, index, section }) => {
            if (section.type === 'pending_remeasurement') {
              console.log('&&&&&&&&', index);
              return <RemeasurementItem item={item} />;
            }
            return (
              <Item
                item={item}
                accessibilityLabel={`inventory-${index}`}
                onPressInventory={onPressInventory}
                itemStyle={
                  section.type === 'fix_needed'
                    ? {
                        backgroundColor: '#E86F5620',
                        paddingHorizontal: 12,
                        margin: 0,
                        borderBottomLeftRadius: index === section.data.length - 1 ? 16 : 0,
                        borderBottomRightRadius: index === section.data.length - 1 ? 16 : 0,
                      }
                    : {}
                }
                containerStyle={
                  section.type === 'fix_needed' ? { padding: 12, borderRadius: 12 } : {}
                }
              />
            );
          }}
          renderSectionHeader={({ section: { title, type, data } }) => {
            if (data.length > 0) {
              switch (type) {
                case 'uploading':
                  return (
                    <SmallHeader
                      leftText={title}
                      rightText={state.isUploading ? i18next.t('label.uploading') : ''}
                      sync={state.isUploading}
                      style={{ marginVertical: 15 }}
                    />
                  );
                case 'pending':
                  return (
                    <SmallHeader
                      onPressRight={onPressUploadNow}
                      leftText={title}
                      style={{ marginVertical: 15 }}
                    />
                  );
                case 'pending_remeasurement':
                  return (
                    <SmallHeader
                      rightText={i18next.t('label.upload_pending', {
                        count: pendingPlantLocationHistoryUploadCount,
                      })}
                      icon={'cloud-upload'}
                      iconType={'MCIcon'}
                      sync={isRemeasurementUploading}
                      iconColor={Colors.PRIMARY}
                      onPressRight={onPressUploadRemeasurement}
                      leftText={title}
                      style={{ marginVertical: 15 }}
                    />
                  );
                case 'incomplete':
                  return (
                    <SmallHeader
                      onPressRight={onPressClearAll}
                      leftText={title}
                      iconColor={Colors.ALERT}
                      rightTextStyle={{ color: Colors.ALERT }}
                      icon={'trash'}
                      iconType={'FAIcon'}
                      style={{ marginVertical: 15 }}
                    />
                  );
                case 'fix_needed':
                  return (
                    <SmallHeader
                      leftText={title}
                      leftTextStyle={{
                        color: Colors.PLANET_RED,
                        fontFamily: Typography.FONT_FAMILY_REGULAR,
                        fontWeight: '600',
                        fontSize: Typography.FONT_SIZE_16,
                      }}
                      style={{
                        marginTop: 15,
                        marginBottom: 0,
                        padding: 15,
                        backgroundColor: '#E86F5620',
                        borderTopRightRadius: 16,
                        borderTopLeftRadius: 16,
                      }}
                    />
                  );
                default:
                  return <></>;
              }
            } else {
              return <></>;
            }
          }}
        />
      ) : allInventory == null ? (
        renderLoadingInventoryList()
      ) : (
        renderEmptyInventoryList()
      )}
      <View style={styles.primaryBtnCont}>
        <PrimaryButton
          onPress={() => navigation.navigate('TreeTypeSelection')}
          btnText={i18next.t('label.register_tree')}
          style={{ marginTop: 10 }}
        />
      </View>
      <PermissionBlockedAlert
        isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
        setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
      />
      <AlertModal
        visible={offlineModal}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
          setOfflineModal(false);
        }}
      />
      <AlertModal
        visible={showDeleteIncompleteAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={i18next.t('label.delete_incomplete_registrations_warning')}
        primaryBtnText={i18next.t('label.tree_review_delete')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={onPressClearAll}
        onPressSecondaryBtn={() => setShowDeleteIncompleteAlert(false)}
        showSecondaryButton={true}
      />
      <VerifyEmailAlert emailAlert={emailAlert} setEmailAlert={setEmailAlert} />
    </SafeAreaView>
  );
};
export default TreeInventory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
  },
  emptyInventoryBanner: {
    width: '109%',
    height: '80%',
    marginHorizontal: -5,
    bottom: -10,
  },
  primaryBtnCont: {
    paddingHorizontal: 25,
  },
  dowloadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  loader: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    marginVertical: 20,
  },
});

interface IPermissionBlockedAlertShowProps {
  isPermissionBlockedAlertShow: boolean;
  setIsPermissionBlockedAlertShow: React.Dispatch<React.SetStateAction<boolean>>;
}

const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
}: IPermissionBlockedAlertShowProps) => {
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={i18next.t('label.permission_blocked_message')}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.cancel')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        if (isAndroid) {
          Linking.openSettings();
        } else {
          Linking.openURL('app-settings:');
        }
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
      }}
      showSecondaryButton={true}
    />
  );
};

const Item = ({
  item,
  countryCode,
  accessibilityLabel,
  onPressInventory,
  itemStyle = {},
  containerStyle = {},
}: any) => {
  let imageURL;
  let cdnImageUrl;
  let isOffSitePoint = false;
  if (item.polygons[0] && item.polygons[0].coordinates && item.polygons[0].coordinates.length) {
    imageURL = item.polygons[0].coordinates[0].imageUrl;
    cdnImageUrl = item.polygons[0].coordinates[0].cdnImageUrl;
    isOffSitePoint = item.polygons[0].coordinates.length === 1;
  }
  let locateTreeAndType = '';
  let title = '';
  if (item.locateTree === OFF_SITE) {
    locateTreeAndType = i18next.t('label.tree_inventory_off_site');
  } else {
    locateTreeAndType = i18next.t('label.tree_inventory_on_site');
  }
  if (item.treeType === SINGLE) {
    title =
      `1 ${item.species.length > 0 ? `${item.species[0].aliases} ` : ''}` +
      i18next.t('label.tree_inventory_tree');
    locateTreeAndType += ' - ' + i18next.t('label.tree_inventory_point');
  } else {
    let totalTreeCount = 0;
    let species = item.species;

    for (let i = 0; i < species.length; i++) {
      const oneSpecies = species[i];
      totalTreeCount += Number(oneSpecies.treeCount);
    }
    title = `${totalTreeCount} ` + i18next.t('label.tree_inventory_trees');
    locateTreeAndType += ` - ${
      isOffSitePoint
        ? i18next.t('label.tree_inventory_point')
        : i18next.t('label.tree_inventory_polygon')
    }`;
  }
  let data = {
    title: title,
    subHeading: locateTreeAndType,
    date: i18next.t('label.inventory_overview_date', {
      date: item.registrationDate,
    }),
    imageURL,
    cdnImageUrl,
    status: item.status,
    treeType: item.treeType,
    diameter: item.specieDiameter,
    height: item.specieHeight,
    tagId: item.tagId,
    countryCode,
  };
  return (
    <TouchableOpacity
      onPress={() => onPressInventory(item)}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      testID="upload_inventory_list"
      style={itemStyle}>
      <InventoryCard
        icon={
          item.status === INCOMPLETE || item.status === INCOMPLETE_SAMPLE_TREE
            ? null
            : item.status === SYNCED
            ? 'cloud-check'
            : 'cloud-outline'
        }
        data={data}
        containerStyle={containerStyle}
      />
    </TouchableOpacity>
  );
};
