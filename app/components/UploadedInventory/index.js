import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Header, InventoryList, PrimaryButton, AlertModal } from '../Common';
import { SafeAreaView } from 'react-native';
import { getInventoryByStatus, clearAllUploadedInventory } from '../../repositories/inventory';
import { Colors, Typography } from '_styles';
import { empty_inventory_banner } from '../../assets';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';

const UploadedInventory = ({ navigation }) => {
  const [allInventory, setAllInventory] = useState(null);
  const [isShowFreeUpSpaceAlert, setIsShowFreeUpSpaceAlert] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });

    return unsubscribe;
  }, [navigation]);

  const initialState = () => {
    getInventoryByStatus('complete').then((allInventory) => {
      setAllInventory(allInventory);
    });
  };

  const freeUpSpace = () => {
    clearAllUploadedInventory().then(() => {
      initialState();
      toogleIsShowFreeUpSpaceAlert();
    });
  };

  const toogleIsShowFreeUpSpaceAlert = () => {
    setIsShowFreeUpSpaceAlert(!isShowFreeUpSpaceAlert);
  };

  const renderInventory = () => {
    return (
      <View style={styles.cont}>
        {allInventory.length > 0 && (
          <>
            <TouchableOpacity
              onPress={toogleIsShowFreeUpSpaceAlert}
              accessible={true}
              accessibilityLabel={i18next.t('label.tree_inventory_free_up_space')}
              testID="free_up_space">
              <Text style={styles.freeUpSpace}>
                {i18next.t('label.tree_inventory_free_up_space')}
              </Text>
            </TouchableOpacity>
            <InventoryList
              accessibilityLabel={i18next.t('label.tree_inventory_upload_inventory_list')}
              inventoryList={allInventory}
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
          headingText={i18next.t('label.tree_inventory_upload_list_header')}
          style={{ marginHorizontal: 25 }}
        />
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  };

  const renderEmptyInventoryList = () => {
    return (
      <View style={styles.cont}>
        <Header
          headingText={i18next.t('label.tree_inventory_upload_list_header')}
          style={{ marginHorizontal: 25 }}
        />
        <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
        <View style={styles.parimaryBtnCont}>
          <PrimaryButton
            onPress={() => navigation.navigate('TreeInventory')}
            btnText={i18next.t('label.tree_inventory_upload_empty_btn_text')}
          />
        </View>
      </View>
    );
  };

  const renderInventoryListContainer = () => {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header headingText={i18next.t('label.tree_inventory_upload_list_header')} />
          {renderInventory()}
        </ScrollView>
        <SafeAreaView />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <SafeAreaView />
      {allInventory && allInventory.length > 0
        ? renderInventoryListContainer()
        : allInventory == null
          ? renderLoadingInventoryList()
          : renderEmptyInventoryList()}
      <AlertModal
        visible={isShowFreeUpSpaceAlert}
        heading={i18next.t('label.tree_inventory_alert_header')}
        message={i18next.t('label.tree_inventory_alert_sub_header')}
        primaryBtnText={i18next.t('label.tree_inventory_alert_primary_btn_text')}
        secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
        onPressPrimaryBtn={freeUpSpace}
        onPressSecondaryBtn={toogleIsShowFreeUpSpaceAlert}
      />
    </View>
  );
};
export default UploadedInventory;

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
  parimaryBtnCont: {
    position: 'absolute',
    width: '100%',
    justifyContent: 'center',
    bottom: 10,
    paddingHorizontal: 25,
  },
  freeUpSpace: {
    color: Colors.PRIMARY,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
    marginVertical: 10,
  },
});
