import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  Modal,
  Text,
} from 'react-native';
import { Header, SmallHeader, InventoryCard, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native';
import {
  getAllInventory,
  clearAllIncompleteInventory,
  uploadInventory,
  isLogin,
  auth0Login,
} from '../../Actions';
import { store } from '../../Actions/store';
import { Colors } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action';
import { empty_inventory_banner } from '../../assets';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
// import { createSpecies } from '../../Actions/UploadInventory';

const TreeInventory = ({ navigation }) => {
  const { dispatch } = useContext(store);

  const [allInventory, setAllInventory] = useState(null);
  const [isLoaderShow, setIsLoaderShow] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initialState();
    });

    return unsubscribe;
  }, [navigation]);

  const onPressInventory = (item) => {
    setTimeout(() => {
      dispatch(LocalInventoryActions.setInventoryId(item.inventory_id));
      navigation.navigate(item.last_screen);
    }, 0);
  };

  const initialState = () => {
    getAllInventory().then((allInventory) => {
      setAllInventory(Object.values(allInventory));
    });
  };

  const renderInventoryList = (inventoryList) => {
    return (
      <FlatList
        showsVerticalScrollIndicator={false}
        data={inventoryList}
        renderItem={({ item }) => {
          let imageURL;
          let isOffSitePoint = false;
          if (
            item.polygons[0] &&
            item.polygons[0].coordinates &&
            Object.values(item.polygons[0].coordinates).length
          ) {
            imageURL = item.polygons[0].coordinates[0].imageUrl;
            isOffSitePoint = Object.values(item.polygons[0].coordinates).length == 1;
          }
          let locateTreeAndType = '';
          let title = '';
          if (item.locate_tree === 'off-site') {
            locateTreeAndType = i18next.t('label.tree_inventory_off_site');
          } else {
            locateTreeAndType = i18next.t('label.tree_inventory_on_site');
          }
          if (item.tree_type == 'single') {
            title = `1 ${item.specei_name ? `${item.specei_name} ` : ''}` + i18next.t('label.tree_inventory_tree');
            locateTreeAndType += ' - ' + i18next.t('label.tree_inventory_point');
          } else {
            let totalTreeCount = 0;
            let species = Object.values(item.species);

            for (let i = 0; i < species.length; i++) {
              const oneSpecies = species[i];
              totalTreeCount += Number(oneSpecies.treeCount);
            }
            title = `${totalTreeCount} ` + i18next.t('label.tree_inventory_trees');
            locateTreeAndType += ` - ${isOffSitePoint ? i18next.t('label.tree_inventory_point') : i18next.t('label.tree_inventory_polygon')}`;
          }
          let data = {
            title: title,
            subHeading: locateTreeAndType,
            date: i18next.t('label.tree_inventory_overview_date', {
              date: new Date(Number(item.plantation_date)),
            }),
            imageURL: imageURL,
          };
          return (
            <TouchableOpacity
              onPress={() => onPressInventory(item)}
              accessibilityLabel={i18next.t('label.tree_inventory_inventory_list')}
              accessible={true}
              testID="inventory_list">
              <InventoryCard icon={'cloud-outline'} data={data} />
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  const onPressClearAll = () => {
    clearAllIncompleteInventory().then(() => {
      getAllInventory().then((allInventory) => {
        setAllInventory(Object.values(allInventory));
      });
    });
  };

  let pendingInventory = [];
  let inCompleteInventory = [];
  let uploadedInventory = [];
  if (allInventory) {
    pendingInventory = allInventory.filter((x) => x.status == 'pending');
    inCompleteInventory = allInventory.filter((x) => x.status == 'incomplete');
    uploadedInventory = allInventory.filter((x) => x.status == 'complete');
  }

  const checkIsUserLogin = () => {
    return new Promise((resolve, reject) => {
      isLogin().then((isUserLogin) => {
        if (!isUserLogin) {
          auth0Login()
            .then((isUserLogin) => {
              isUserLogin ? resolve() : reject();
            })
            .catch((err) => {
              alert(err.error_description);
            });
        } else {
          resolve();
        }
      });
    });
  };

  const onPressUploadNow = () => {
    checkIsUserLogin().then(() => {
      setIsLoaderShow(true);
      uploadInventory()
      // createSpecies()
        .then((data) => {
          initialState();
          setIsLoaderShow(false);
        })
        .catch((err) => {
          setIsLoaderShow(false);
        });
    });
  };

  const renderLoaderModal = () => {
    return (
      <Modal transparent visible={isLoaderShow}>
        <View style={styles.dowloadModalContainer}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ padding: 30, backgroundColor: '#fff', borderRadius: 10 }}>
              Uploading..........
            </Text>
          </View>
        </View>
      </Modal>
    );
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
            {renderInventoryList(pendingInventory)}
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
            {renderInventoryList(inCompleteInventory)}
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
        />
        <ActivityIndicator size={25} color={Colors.PRIMARY} />
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
        />
        <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
        <View style={styles.parimaryBtnCont}>
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
      {allInventory && allInventory.length > 0
        ? renderInventoryListContainer()
        : allInventory == null
        ? renderLoadingInventoryList()
        : renderEmptyInventoryList()}
      {renderLoaderModal()}
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
  parimaryBtnCont: {
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
