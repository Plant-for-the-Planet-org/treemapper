import { StackActions } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Colors } from '_styles';
import { empty_inventory_banner } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { clearAllIncompleteInventory, getInventoryByStatus } from '../../repositories/inventory';
import { uploadInventoryData } from '../../utils/uploadInventory';
import { Header, InventoryList, PrimaryButton, SmallHeader, AlertModal } from '../Common';
import { INCOMPLETE, INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import { UserContext } from '../../reducers/user';

const IS_ANDROID = Platform.OS === 'android';

const TreeInventory = ({ navigation }) => {
  const { dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);

  const [allInventory, setAllInventory] = useState(null);
  const [isPermissionBlockedAlertShow, setIsPermissionBlockedAlertShow] = useState(false);
  useEffect(() => {
    // BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });

    return () => {
      unsubscribe();
      // BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [navigation]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, []);

  const handleBackPress = () => {
    navigation.dispatch(StackActions.popToTop());
  };

  const initialState = () => {
    getInventoryByStatus('all').then((allInventory) => {
      setAllInventory(allInventory);
    });
  };

  const onPressClearAll = () => {
    clearAllIncompleteInventory().then(() => {
      getInventoryByStatus('all').then((allInventory) => {
        setAllInventory(allInventory);
      });
    });
  };

  let pendingInventory = [];
  let inCompleteInventory = [];
  let uploadedInventory = [];
  if (allInventory) {
    pendingInventory = allInventory.filter((x) => x.status == 'pending' || x.status == 'uploading');
    inCompleteInventory = allInventory.filter(
      (x) => x.status === INCOMPLETE || x.status === INCOMPLETE_SAMPLE_TREE,
    );
    uploadedInventory = allInventory.filter((x) => x.status == 'complete');
  }

  const onPressUploadNow = () => {
    uploadInventoryData(dispatch, userDispatch)
      .then(() => {
        navigation.navigate('MainScreen');
      })
      .catch((err) => {
        if (err?.response?.status === 303) {
          navigation.navigate('SignUp');
          navigation.navigate('MainScreen');
        } else if (err === 'blocked') {
          setIsPermissionBlockedAlertShow(true);
        } else if (err.error !== 'a0.session.user_cancelled') {
          // TODO:i18n - if this is used, please add translations
          Alert.alert(
            'Verify your Email',
            'Please verify your email before logging in.',
            [{ text: 'OK' }],
            { cancelable: false },
          );
          navigation.navigate('MainScreen');
        }
      });
  };

  const renderInventory = () => {
    return (
      <View style={styles.cont}>
        {pendingInventory.length > 0 && (
          <>
            <SmallHeader
              onPressRight={onPressUploadNow}
              leftText={i18next.t('label.tree_inventory_left_text')}
              rightText={i18next.t('label.tree_inventory_right_text')}
              icon={'cloud-upload'}
              style={{ marginVertical: 15 }}
            />
            <InventoryList
              accessibilityLabel={i18next.t('label.tree_inventory_inventory_list')}
              inventoryList={pendingInventory}
            />
          </>
        )}
        {uploadedInventory.length > 0 && (
          <PrimaryButton
            onPress={() => navigation.navigate('UploadedInventory')}
            btnText={i18next.t('label.tree_inventory_view_upload')}
            theme={'white'}
            style={{ marginVertical: 20 }}
          />
        )}
        {inCompleteInventory.length > 0 && (
          <>
            <SmallHeader
              onPressRight={onPressClearAll}
              leftText={i18next.t('label.tree_inventory_incomplete_registrations')}
              rightText={i18next.t('label.tree_inventory_clear_all')}
              rightTheme={'red'}
              style={{ marginVertical: 15 }}
            />
            <InventoryList
              accessibilityLabel={i18next.t('label.tree_inventory_inventory_list')}
              inventoryList={inCompleteInventory}
            />
          </>
        )}
      </View>
    );
  };

  const renderLoadingInventoryList = () => {
    return (
      <View style={styles.cont}>
        <Header
          headingText={i18next.t('label.tree_inventory_list_header')}
          subHeadingText={i18next.t('label.tree_inventory_list_sub_header')}
          style={{ marginHorizontal: 25 }}
          onBackPress={handleBackPress}
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
            onPress={() => navigation.navigate('RegisterTree')}
            btnText={i18next.t('label.register_tree')}
          />
        </View>
      </View>
    );
  };

  const renderInventoryListContainer = () => {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header
            headingText={i18next.t('label.tree_inventory_list_header')}
            subHeadingText={i18next.t('label.tree_inventory_list_container_sub_header')}
            onBackPress={handleBackPress}
          />
          {renderInventory()}
        </ScrollView>
        <PrimaryButton
          onPress={() => navigation.navigate('RegisterTree')}
          btnText={i18next.t('label.register_tree')}
        />
        <SafeAreaView />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <SafeAreaView />
      {pendingInventory.length > 0 || inCompleteInventory.length > 0 || uploadedInventory.length > 0
        ? renderInventoryListContainer()
        : allInventory == null
        ? renderLoadingInventoryList()
        : renderEmptyInventoryList()}
      <PermissionBlockedAlert
        isPermissionBlockedAlertShow={isPermissionBlockedAlertShow}
        setIsPermissionBlockedAlertShow={setIsPermissionBlockedAlertShow}
        handleBackPress={handleBackPress}
      />
    </View>
  );
};
export default TreeInventory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
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
    position: 'absolute',
    width: '100%',
    justifyContent: 'center',
    bottom: 10,
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

const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
  handleBackPress,
}) => {
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={i18next.t('label.permission_blocked_message')}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.cancel')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        if (IS_ANDROID) {
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
