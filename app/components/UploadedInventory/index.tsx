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
import { getInventoryByStatus, removeImageUrl } from '../../repositories/inventory';
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
    toogleIsShowFreeUpSpaceAlert();

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
  };

  const toogleIsShowFreeUpSpaceAlert = () => {
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
        {allInventory == null ? (
          renderLoadingInventoryList()
        ) : (
          <InventoryList
            accessibilityLabel={i18next.t('label.tree_inventory_upload_inventory_list')}
            inventoryList={allInventory}
            ListHeaderComponent={() => {
              return (
                <>
                  <Header headingText={i18next.t('label.tree_inventory_upload_list_header')} />
                  {allInventory && allInventory.length > 0 && (
                    <TouchableOpacity
                      onPress={toogleIsShowFreeUpSpaceAlert}
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
          onPressSecondaryBtn={toogleIsShowFreeUpSpaceAlert}
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
