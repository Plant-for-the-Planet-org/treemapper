import {
  Text,
  View,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Realm from 'realm';
import i18next from 'i18next';
import { SvgXml } from 'react-native-svg';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';

import { ArrowBack, HeartGray, HeartPink, empty } from '../../assets';
import { SpecieCard } from './MySpecies';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { setSpecie } from '../../actions/species';
import { Colors, Typography } from '../../styles';
import IconSwitcher from '../Common/IconSwitcher';
import TreeCountModal from '../Common/TreeCountModal';
import { getSchema } from '../../repositories/default';
import { SpeciesContext } from '../../reducers/species';
import { getInventory } from '../../repositories/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { NavigationContext } from '../../reducers/navigation';
import { MULTI, SINGLE } from '../../utils/inventoryConstants';
import { AlertModal, FlatButton, GradientText, Header, SpeciesSyncError } from '../Common';
import { IScientificSpecies } from '../../utils/schemaInterfaces';
import { getUserSpecies, searchSpeciesFromLocal } from '../../repositories/species';
import { ScientificSpeciesType } from '../../utils/ScientificSpecies/ScientificSpeciesTypes';
import HeaderV2 from '../Common/Header/HeaderV2';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modalize } from 'react-native-modalize';

interface ManageSpeciesProps {
  onPressSpeciesSingle?: (item?: any) => void;
  onPressBack?: () => void;
  registrationType: any;
  addSpecieToInventory: any;
  editOnlySpecieName: any;
  isSampleTree: any;
  isSampleTreeCompleted?: any;
  screen?: any;
  retainNavigationStack?: any;
  deleteSpeciesAndSampleTrees?: any;
  deleteSpecie?: any;
}

const ManageSpecies: React.FC<ManageSpeciesProps> = ({
  onPressSpeciesSingle,
  onPressBack,
  registrationType,
  addSpecieToInventory,
  editOnlySpecieName,
  isSampleTree,
  isSampleTreeCompleted,
  screen,
  retainNavigationStack,
  deleteSpeciesAndSampleTrees,
  deleteSpecie,
}) => {
  const navigation = useNavigation();
  const [inventory, setInventory] = useState<any>();
  const [specieList, setSpecieList] = useState<ScientificSpeciesType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState<ScientificSpeciesType[]>([]);
  const [showSearchSpecies, setShowSearchSpecies] = useState(false);
  const [showTreeCountModal, setShowTreeCountModal] = useState(false);
  const [treeCount, setTreeCount] = useState('');
  const [activeSpecie, setActiveSpecie] = useState<any>();
  const [deleteSpecieAlert, setDeleteSpecieAlert] = useState(false);
  const [speciesIndexToDelete, setSpeciesIndexToDelete] = useState<number>();
  const [showSpeciesSyncAlert, setShowSpeciesSyncAlert] = useState(false);
  const [list, setList] = useState<ScientificSpeciesType[]>(specieList);
  const [removeFavSpecieModal, setRemoveFavSpecieModal] = useState(false);
  const [removeFavSpecieItem, setRemoveFavSpecieItem] = useState<ScientificSpeciesType>(null);
  const insects = useSafeAreaInsets();

  const netInfo = useNetInfo();
  const modalizeRef = useRef<Modalize>(null);

  const route = useRoute();

  const { dispatch } = useContext(SpeciesContext);
  const { state } = useContext(InventoryContext);
  const { showInitialNavigationStack, setInitialNavigationScreen, setUpdateSpeciesSync } =
    useContext(NavigationContext);

  useEffect(() => {
    // fetches all the species already added by user when component mount
    getUserSpecies().then((userSpecies: IScientificSpecies[]) => {
      if (registrationType) {
        let specieListWithUnknown: ScientificSpeciesType[] = [];
        if (userSpecies && userSpecies.length > 0) {
          specieListWithUnknown = [
            ...userSpecies,
            {
              guid: 'unknown',
              isUserSpecies: true,
              scientificName: i18next.t('label.select_species_unknown'),
              aliases: i18next.t('label.select_species_unknown'),
            },
          ];
        } else {
          specieListWithUnknown = [
            {
              guid: 'unknown',
              isUserSpecies: true,
              scientificName: i18next.t('label.select_species_unknown'),
              aliases: i18next.t('label.select_species_unknown'),
            },
          ];
        }
        setSpecieList(specieListWithUnknown);
      } else {
        setSpecieList(userSpecies);
      }
    });
  }, [registrationType, searchList]);

  useEffect(() => {
    if (searchText) {
      setShowSearchSpecies(true);
    } else {
      setShowSearchSpecies(false);
    }
  }, [searchText]);

  useEffect(() => {
    if (screen === 'SelectSpecies') {
      getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
        setInventory(inventoryData);
      });
    }
  }, []);

  useEffect(() => {
    if (showSearchSpecies && searchText && searchText.length > 2) {
      setList(searchList);
    } else {
      setList(specieList);
    }
    return () => {
      setList([]);
    };
  }, [searchText, showSearchSpecies, specieList, searchList]);

  // used to navigate to main screen
  const onPressHome = () => {
    navigation.navigate('MainScreen');
  };

  // This function adds or removes the specie from User Species
  // ! Do not move this function to repository as state change is happening here to increase the performance
  const toggleUserSpecies = (guid: string, addSpecie = false) => {
    return new Promise(resolve => {
      Realm.open(getSchema())
        .then(realm => {
          realm.write(() => {
            let specieToToggle: any = realm.objectForPrimaryKey('ScientificSpecies', guid);
            if (addSpecie) {
              specieToToggle.isUserSpecies = true;
            } else {
              specieToToggle.isUserSpecies = !specieToToggle.isUserSpecies;
            }
            // copies the current search list in variable currentSearchList
            const currentSearchList = [...searchList];

            // sets the changes done by realm into the state
            setSearchList(currentSearchList);

            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.MANAGE_SPECIES,
              message: `Specie with guid ${guid} ${
                specieToToggle.isUserSpecies ? 'added' : 'removed'
              }`,
            });
          });
          resolve(true);
        })
        .catch(err => {
          console.error(`Error at /components/ManageSpecies/index, ${JSON.stringify(err)}`);
          // logging the error in to the db
          dbLog.error({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Error while adding or removing specie from user specie for specie id: ${guid}`,
            logStack: JSON.stringify(err),
          });
        });
    });
  };

  //This function handles search whenever any search text is entered
  const handleSpeciesSearch = (text: string) => {
    setSearchText(text);
    if (text && text.length > 2) {
      setShowSearchSpecies(true);
      searchSpeciesFromLocal(text).then(data => {
        setSearchList([...data]);
      });
    } else if (!text) {
      setShowSearchSpecies(false);
      setSearchList([]);
    }
  };

  const handleSpeciePress = (specie: any) => {
    if (registrationType === MULTI && isSampleTreeCompleted) {
      setActiveSpecie(specie);
      setShowTreeCountModal(true);
    } else {
      addSpecieToInventory(JSON.stringify(specie), inventory);
    }
  };

  const handleTreeCountNextButton = () => {
    let specie: any = activeSpecie;
    specie.treeCount = Number(treeCount);

    if ((!treeCount || Number(treeCount) === 0) && inventory.sampleTrees.length > 0) {
      let sampleTrees = [...inventory.sampleTrees];
      sampleTrees.every((sampleTree, index: number) => {
        if (sampleTree.specieId === specie.guid) {
          setSpeciesToDelete(specie, setSpeciesIndexToDelete);
          setDeleteSpecieAlert(true);
          return false;
        } else if (index === sampleTrees.length - 1) {
          setSpeciesToDelete(specie, deleteSpecie);
          navigateAfterTreeCount();
        } else {
          return true;
        }
      });
    } else {
      addSpecieToInventory(JSON.stringify(specie));
      navigateAfterTreeCount();
    }
  };

  const setSpeciesToDelete = (specie: any, callback: any) => {
    for (const index in inventory?.species) {
      if (inventory?.species[index].id === specie.guid) {
        callback(Number(index));
        break;
      }
    }
  };

  const navigateAfterTreeCount = () => {
    setActiveSpecie(null);
    setTreeCount('');
    setShowTreeCountModal(false);
    if (retainNavigationStack && onPressBack) {
      onPressBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [{ name: 'NavDrawer' }, { name: 'TreeInventory' }, { name: 'TotalTreesSpecies' }],
        }),
      );
    }
  };

  const navigateToSpecieInfo = (specie: ScientificSpeciesType) => {
    setSpecie(specie)(dispatch);
    navigation.navigate('SpecieInfo', {
      screen,
    });
  };

  const handleZeroSpeciesDelete = () => {
    deleteSpeciesAndSampleTrees(speciesIndexToDelete);
    navigateAfterTreeCount();
  };

  const handleSpeciesSyncPress = () => {
    setShowSpeciesSyncAlert(false);
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      setUpdateSpeciesSync(true);
      setInitialNavigationScreen('SpeciesLoading');
      showInitialNavigationStack();
    } else {
      setTimeout(
        () =>
          Snackbar.show({
            text: i18next.t('label.no_internet_connection'),
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: '#e74c3c',
          }),
        1000,
      );
    }
  };

  const renderSearchSpecieCard = ({
    item,
    index,
  }: {
    item: ScientificSpeciesType;
    index: number;
  }) => {
    const isCheck = item.isUserSpecies;

    const SpecieListItem = () => {
      return (
        <>
          <View>
            <Text style={styles.scientificName}>{item.scientificName}</Text>
          </View>
          <TouchableOpacity
            key={index}
            onPress={() => {
              toggleUserSpecies(item.guid);
            }}>
            {isCheck ? <HeartPink /> : <HeartGray />}
          </TouchableOpacity>
        </>
      );
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.specieListItem}
        onPress={() => {
          toggleUserSpecies(item.guid, true);
          if (registrationType || isSampleTree) {
            handleSpeciePress(item);
          }
          if (editOnlySpecieName && (registrationType === SINGLE || isSampleTree) && onPressBack) {
            onPressBack();
          } else if (registrationType === SINGLE && !editOnlySpecieName && onPressSpeciesSingle) {
            onPressSpeciesSingle(item);
          }

          if (registrationType === SINGLE) {
            setSearchText('');
          }
        }}>
        <SpecieListItem />
      </TouchableOpacity>
    );
  };

  const memoizedRenderSearchSpecieCard = React.useMemo(() => renderSearchSpecieCard, [searchList]);

  const handleRemoveFavourite = () => {
    toggleUserSpecies(removeFavSpecieItem?.guid);
    setRemoveFavSpecieModal(false);
  };

  const renderSpecieCard = ({ item, index }: { item: ScientificSpeciesType; index: number }) => {
    return (
      <SpecieCard
        item={item}
        index={index}
        registrationType={registrationType}
        onPressSpecies={onPressSpeciesSingle}
        addSpecieToInventory={handleSpeciePress}
        editOnlySpecieName={editOnlySpecieName}
        onPressBack={onPressBack ? onPressBack : () => {}}
        isSampleTree={isSampleTree}
        navigateToSpecieInfo={navigateToSpecieInfo}
        screen={screen || 'ManageSpecies'}
        handleRemoveFavourite={item => {
          setRemoveFavSpecieItem(item);
          setRemoveFavSpecieModal(true);
        }}
      />
    );
  };

  const renderListHeader = React.useMemo(() => {
    return (
      <>
        <HeaderV2
          onBackPress={() => navigation.goBack()}
          headingText={
            registrationType
              ? i18next.t('label.select_species_header')
              : i18next.t('label.select_species_tree_species')
          }
          rightText={'aga'}
          TitleRightComponent={
            route.name === 'ManageSpecies'
              ? () => (
                  <TouchableOpacity
                    style={styles.syncAltContainer}
                    onPress={() => setShowSpeciesSyncAlert(true)}>
                    <IconSwitcher
                      size={20}
                      name={'sync-alt'}
                      iconType={'FA5Icon'}
                      color={Colors.TEXT_COLOR}
                    />
                  </TouchableOpacity>
                )
              : () => <></>
          }
          containerStyle={{
            paddingLeft: 25,
            paddingRight: route.name === 'ManageSpecies' ? 15 : 25,
          }}
        />
        <View
          style={[
            styles.container,
            {
              backgroundColor: 'rgba(104, 176, 48, 0.10)',
              padding: 24,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            },
          ]}>
          <SpeciesSyncError />
          <Text
            style={{
              textAlign: 'center',
              fontSize: Typography.FONT_SIZE_14,
              fontFamily: Typography.FONT_FAMILY_BOLD,
            }}>
            Explore and Manage Species
          </Text>
          <Text
            style={{
              marginTop: 4,
              textAlign: 'center',
              fontSize: Typography.FONT_SIZE_12,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {'Search '}
            <Text
              style={{
                marginTop: 4,
                textAlign: 'center',
                fontSize: Typography.FONT_SIZE_14,
                fontFamily: Typography.FONT_FAMILY_BOLD,
              }}>
              {'60,000 Species '}
            </Text>
            {`and Add Species to \n Your Favourites`}
          </Text>
          <TouchableOpacity onPress={() => modalizeRef.current?.open()} style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
            <Text style={[styles.searchText, { color: Colors.GRAY_LIGHTEST }]}>
              Search all species
            </Text>
            {/* <TextInput
              style={styles.searchText}
              placeholder={i18next.t('label.select_species_search_species')}
              onChangeText={handleSpeciesSearch}
              value={searchText}
              returnKeyType={'search'}
              autoCorrect={false}
              placeholderTextColor={Colors.GRAY_LIGHTEST}
            /> */}
            {/* {searchText ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                }}>
                <Ionicons name="close" size={20} style={styles.closeIcon} />
              </TouchableOpacity>
            ) : (
              []
            )} */}
          </TouchableOpacity>
          {/* {showSearchSpecies && searchText.length < 3 ? (
            <Text style={styles.notPresentText}>
              {i18next.t('label.select_species_search_atleast_3_characters')}
            </Text>
          ) : (
            []
          )} */}
        </View>

        <View
          style={{
            paddingLeft: 16,
            backgroundColor: '#E0E0E026',
          }}>
          <Text
            style={[
              styles.listTitle,
              {
                fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
              },
            ]}>
            {i18next.t('label.select_species_my_species')}
          </Text>
        </View>

        {/* <View
          style={{
            paddingLeft: 20,
            backgroundColor: '#E0E0E026',
          }}>
          {!showSearchSpecies ? (
            <Text style={styles.listTitle}>{i18next.t('label.select_species_my_species')}</Text>
          ) : showSearchSpecies && searchList && searchList.length > 0 && searchText.length > 2 ? (
            <Text style={styles.listTitle}>{i18next.t('label.search_result')}</Text>
          ) : (
            []
          )}
        </View> */}
      </>
    );
  }, [searchText, showSearchSpecies, searchList]);

  const renderListEmptyComponent = () => {
    if (showSearchSpecies && specieList && specieList.length > 0) {
      return <></>;
    } else {
      return (
        <View style={styles.listEmptyComponent}>
          <SvgXml xml={empty} style={styles.svgEmptyList} />
          <Text style={styles.headerText}>
            {i18next.t('label.select_species_looks_empty_here')}
          </Text>
          <Text style={styles.subHeadingText}>
            {i18next.t('label.select_species_add_species_desscription')}
          </Text>
        </View>
      );
    }
  };

  const renderItem = (props: any) => {
    return (
      <View
        style={[
          styles.container,
          { padding: 18, backgroundColor: 'rgba(224, 224, 224, 0.15)', paddingVertical: 6 },
        ]}>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            elevation: 5,
          }}>
          {renderSpecieCard(props)}
        </View>
      </View>
    );
  };

  const renderSearchItem = (props: any) => {
    return (
      <View style={[styles.searchBarMainFlatlist]}>
        <View style={{}}>
          {showSearchSpecies && searchList && searchList.length > 0 && searchText.length > 2 ? (
            memoizedRenderSearchSpecieCard(props)
          ) : (
            <></>
          )}
        </View>
      </View>
    );
  };

  const renderSearchListHeader = () => {
    return (
      <View style={{ paddingLeft: 16, backgroundColor: 'rgba(224, 224, 224, 0.15)' }}>
        {searchList && searchList.length > 0 && searchText.length > 2 ? (
          <Text style={[styles.listTitle, { paddingTop: 16 }]}>
            {i18next.t('label.search_result')}
          </Text>
        ) : (
          []
        )}
      </View>
    );
  };

  const handleBackModal = () => modalizeRef.current?.close();

  return (
    <>
      {/* <DismissKeyBoard> */}
      <Modalize ref={modalizeRef} withHandle={false} modalStyle={styles.modalStyle}>
        <View style={styles.mainSearchContainer}>
          <TouchableOpacity style={styles.backArrowCon} onPress={handleBackModal} accessible={true}>
            <ArrowBack />
          </TouchableOpacity>
          <View style={styles.searchBarMain}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="search-outline" size={20} style={styles.searchIconMain} />
              <TextInput
                autoFocus
                style={styles.searchText}
                placeholder={i18next.t('label.select_species_search_species')}
                onChangeText={handleSpeciesSearch}
                value={searchText}
                returnKeyType={'search'}
                autoCorrect={false}
                placeholderTextColor={Colors.GRAY_LIGHTEST}
              />
              {searchText ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                  }}>
                  <Ionicons name="close" size={20} style={styles.closeIcon} />
                </TouchableOpacity>
              ) : (
                []
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.syncAltContainerMain}
            onPress={() => setShowSpeciesSyncAlert(true)}>
            <IconSwitcher
              size={20}
              name={'sync-alt'}
              iconType={'FA5Icon'}
              color={Colors.TEXT_COLOR}
            />
          </TouchableOpacity>
        </View>
        {showSearchSpecies && searchText.length < 3 ? (
          <Text style={styles.notPresentText}>
            {i18next.t('label.select_species_search_atleast_3_characters')}
          </Text>
        ) : (
          []
        )}
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.WHITE,
          }}>
          <FlatList
            data={searchList}
            style={styles.flatList}
            renderItem={renderSearchItem}
            keyExtractor={item => item.guid}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderSearchListHeader}
          />
        </View>
      </Modalize>
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          paddingTop: insects.top,
        }}>
        <FlatList
          data={specieList}
          style={styles.flatList}
          renderItem={renderItem}
          keyExtractor={item => item.guid}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderListEmptyComponent}
        />
      </View>

      {/* </DismissKeyBoard> */}
      <TreeCountModal
        showTreeCountModal={showTreeCountModal}
        activeSpecie={activeSpecie}
        setTreeCount={setTreeCount}
        treeCount={treeCount}
        onPressTreeCountNextBtn={handleTreeCountNextButton}
        setShowTreeCountModal={setShowTreeCountModal}
      />
      <Modal visible={removeFavSpecieModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.subContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeartPink />
              <Text style={styles.alertHeader}>{i18next.t('label.remove_species')}</Text>
            </View>
            <Text style={styles.alertMessage}>{i18next.t('label.sure_remove_species')}</Text>
            <View style={styles.bottomBtnContainer}>
              <FlatButton
                onPress={() => {
                  setRemoveFavSpecieItem(null);
                  setRemoveFavSpecieModal(false);
                }}
                text={i18next.t('label.cancel')}
                style={styles.secondaryButtonStyle}
              />
              <TouchableOpacity onPress={handleRemoveFavourite} style={styles.primaryButtonStyle}>
                <GradientText
                  style={{
                    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
                    fontSize: Typography.FONT_SIZE_16,
                    lineHeight: Typography.LINE_HEIGHT_24,
                  }}>
                  {i18next.t('label.remove')}
                </GradientText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <AlertModal
        visible={deleteSpecieAlert}
        heading={i18next.t('label.delete_species')}
        message={i18next.t('label.zero_tree_count_species_delete_sample_tree_warning')}
        showSecondaryButton={true}
        primaryBtnText={i18next.t('label.tree_review_delete')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={() => handleZeroSpeciesDelete()}
        onPressSecondaryBtn={() => setDeleteSpecieAlert(false)}
      />
      <AlertModal
        visible={showSpeciesSyncAlert}
        heading={i18next.t('label.species_sync_update_alert_title')}
        message={i18next.t('label.species_sync_update_alert_message')}
        showSecondaryButton={true}
        primaryBtnText={i18next.t('label.yes')}
        secondaryBtnText={i18next.t('label.cancel')}
        onPressPrimaryBtn={() => handleSpeciesSyncPress()}
        onPressSecondaryBtn={() => setShowSpeciesSyncAlert(false)}
      />
    </>
  );
};

export default ManageSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  modalStyle: {
    minHeight: '100%',
    paddingTop: 55,
  },
  mainSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backArrowCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 100,
    marginTop: 24,
    backgroundColor: Colors.WHITE,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.09,
    shadowRadius: 3.3,
    elevation: 3,
  },
  searchBarMain: {
    width: '80%',
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  searchIcon: {
    color: 'rgb(104, 176, 48)',
    paddingLeft: 19,
  },
  searchIconMain: {
    color: Colors.TEXT_COLOR,
    paddingLeft: 19,
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    fontSize: Typography.FONT_SIZE_14,
    paddingLeft: 12,
    flex: 1,
    color: Colors.PLANET_BLACK,
  },
  specieListItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notPresentText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    paddingVertical: 10,
    alignSelf: 'center',
    color: Colors.PLANET_BLACK,
  },
  closeIcon: {
    justifyContent: 'flex-end',
    color: Colors.TEXT_COLOR,
    paddingRight: 20,
  },
  headerText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    paddingTop: 10,
    paddingBottom: 15,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    paddingLeft: 25,
    paddingRight: 25,
    textAlign: 'center',
  },
  listTitle: {
    paddingTop: 25,
    paddingBottom: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PLANET_BLACK,
  },
  listEmptyComponent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  svgEmptyList: {
    bottom: 10,
  },
  flatList: {
    flex: 1,
  },
  scientificName: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    color: Colors.PLANET_BLACK,
  },
  syncAltContainer: {
    padding: 10,
  },
  syncAltContainerMain: {},
  searchBarMainFlatlist: {
    paddingHorizontal: 16,
    backgroundColor: 'rgba(224, 224, 224, 0.15)',
  },
  subContainer: {
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 20,
  },
  bottomBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  alertHeader: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
    marginVertical: 10,
    marginLeft: 8,
  },
  alertMessage: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
  },
  primaryButtonStyle: {
    marginLeft: 16,
    color: Colors.ALERT,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryButtonStyle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
