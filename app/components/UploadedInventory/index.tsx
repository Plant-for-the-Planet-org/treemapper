import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { Header, InventoryList, PrimaryButton, AlertModal } from '../Common';
import { SafeAreaView } from 'react-native';
import {
  clearAllUploadedInventory,
  getInventoryByStatus,
  removeImageUrl,
} from '../../repositories/inventory';
import { Colors, Typography } from '../../styles';
import { empty_inventory_banner } from '../../assets';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import { deleteFromFS } from '../../utils/FSInteration';
import { SYNCED } from '../../utils/inventoryConstants';
import { useNavigation } from '@react-navigation/core';

const UploadedInventory = () => {
  const [allInventory, setAllInventory] = useState<any>(null);
  const [isShowFreeUpSpaceAlert, setIsShowFreeUpSpaceAlert] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });

    return unsubscribe;
  }, [navigation]);

  const initialState = () => {
    getInventoryByStatus([SYNCED]).then(allInventory => {
      setAllInventory(allInventory);
    });
  };

  const freeUpSpace = () => {
    toggleIsShowFreeUpSpaceAlert();

    getInventoryByStatus([SYNCED]).then(allInventory => {
      for (let inventory of allInventory) {
        for (let index = 0; index < inventory.polygons[0].coordinates.length; index++) {
          if (inventory.polygons[0].coordinates[index].imageUrl) {
            deleteFromFS(inventory.polygons[0].coordinates[index].imageUrl, inventory, index).then(
              data => {
                removeImageUrl({
                  inventoryId: data.inventory.inventory_id,
                  coordinateIndex: data.index,
                });
              },
            );
          }
        }
        if (inventory.sampleTrees) {
          for (let i = 0; i < inventory.sampleTrees.length; i++) {
            if (inventory.sampleTrees[i].imageUrl) {
              deleteFromFS(inventory.sampleTrees[i].imageUrl, inventory, i).then(data => {
                removeImageUrl({
                  inventoryId: inventory.inventory_id,
                  sampleTreeId: inventory.sampleTrees[i].locationId,
                  sampleTreeIndex: data.index,
                });
              });
            }
          }
        }
      }
    });
    clearAllUploadedInventory();
  };

  const toggleIsShowFreeUpSpaceAlert = () => {
    setIsShowFreeUpSpaceAlert(!isShowFreeUpSpaceAlert);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <Header
          containerStyle={{
            paddingHorizontal: 25,
          }}
          headingText={i18next.t('label.tree_inventory_upload_list_header')}
        />
        {allInventory == null ? (
          renderLoadingInventoryList()
        ) : (
          <InventoryList
            itemStyle={{
              paddingHorizontal: 25,
            }}
            accessibilityLabel={i18next.t('label.tree_inventory_upload_inventory_list')}
            inventoryList={allInventory}
            ListHeaderComponent={() => {
              return (
                <>
                  {allInventory && allInventory.length > 0 && (
                    <TouchableOpacity
                      onPress={toggleIsShowFreeUpSpaceAlert}
                      accessible={true}
                      accessibilityLabel={i18next.t('label.tree_inventory_free_up_space')}
                      testID="free_up_space">
                      <Text style={styles.freeUpSpace}>
                        {i18next.t('label.tree_inventory_free_up_space')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.cont}>
                <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
                <View style={styles.parimaryBtnCont}>
                  <PrimaryButton
                    onPress={() => navigation.navigate('TreeInventory')}
                    btnText={i18next.t('label.tree_inventory_upload_empty_btn_text')}
                    style={{ width: '90%', alignSelf: 'center' }}
                  />
                </View>
              </View>
            )}
          />
        )}
        <AlertModal
          visible={isShowFreeUpSpaceAlert}
          heading={i18next.t('label.tree_inventory_alert_header')}
          message={i18next.t('label.tree_inventory_alert_sub_header2')}
          primaryBtnText={i18next.t('label.tree_review_delete')}
          secondaryBtnText={i18next.t('label.alright_modal_white_btn')}
          onPressPrimaryBtn={freeUpSpace}
          onPressSecondaryBtn={toggleIsShowFreeUpSpaceAlert}
          showSecondaryButton={true}
        />
      </View>
    </SafeAreaView>
  );
};
export default UploadedInventory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
  },
  emptyInventoryBanner: {
    width: '109%',
    height: '100%',
    marginHorizontal: -5,
    bottom: -10,
  },
  parimaryBtnCont: {
    position: 'absolute',
    width: '100%',
    height: '45%',
    justifyContent: 'center',
    bottom: 0,
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
