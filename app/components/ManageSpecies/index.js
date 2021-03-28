import { CommonActions, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Realm from 'realm';
import { Colors, Typography } from '_styles';
import { getSchema } from '../../repositories/default';
import dbLog from '../../repositories/logs';
import { getUserSpecies, searchSpeciesFromLocal } from '../../repositories/species';
import { LogTypes } from '../../utils/constants';
import { MULTI } from '../../utils/inventoryConstants';
import { Header, SpeciesSyncError, TreeCountModal } from '../Common';
import MySpecies from './MySpecies';
import SearchSpecies from './SearchSpecies';

const DismissKeyBoard = ({ children }) => {
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      {children}
    </TouchableWithoutFeedback>
  );
};

const ManageSpecies = ({
  onPressSpeciesSingle,
  onPressBack,
  registrationType,
  addSpecieToInventory,
  editOnlySpecieName,
  isSampleTree,
  isSampleTreeCompleted,
}) => {
  const navigation = useNavigation();
  const [specieList, setSpecieList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);
  const [showSearchSpecies, setShowSearchSpecies] = useState(false);
  const [showTreeCountModal, setShowTreeCountModal] = useState(false);
  const [treeCount, setTreeCount] = useState('');
  const [activeSpecie, setActiveSpecie] = useState(undefined);

  useEffect(() => {
    // fetches all the species already added by user when component mount
    getUserSpecies().then((userSpecies) => {
      if (registrationType) {
        let specieListWithUnknown = [];
        if (userSpecies && userSpecies.length > 0) {
          specieListWithUnknown = [
            ...userSpecies,
            {
              guid: 'unknown',
              isUserSpecies: true,
              scientificName: i18next.t('label.select_species_unknown'),
            },
          ];
        } else {
          specieListWithUnknown = [
            {
              guid: 'unknown',
              isUserSpecies: true,
              scientificName: i18next.t('label.select_species_unknown'),
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

  // used to navigate to main screen
  const onPressHome = () => {
    navigation.navigate('MainScreen');
  };

  // This function adds or removes the specie from User Species
  // ! Do not move this function to repository as state change is happening here to increase the performance
  const toggleUserSpecies = (guid, addSpecie = false) => {
    return new Promise((resolve) => {
      Realm.open(getSchema())
        .then((realm) => {
          realm.write(() => {
            let specieToToggle = realm.objectForPrimaryKey('ScientificSpecies', guid);
            if (addSpecie) {
              specieToToggle.isUserSpecies = true;
              specieToToggle.isDeleted = false;
            } else {
              console.log('Above', specieToToggle.isUserSpecies);
              specieToToggle.isUserSpecies = !specieToToggle.isUserSpecies;
              console.log('Below', specieToToggle.isUserSpecies);
              if (specieToToggle.isUserSpecies === true) {
                specieToToggle.isDeleted = false;
              }
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
          resolve();
        })
        .catch((err) => {
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
  const handleSpeciesSearch = (text) => {
    setSearchText(text);
    if (text && text.length > 2) {
      setShowSearchSpecies(true);
      searchSpeciesFromLocal(text).then((data) => {
        setSearchList([...data]);
      });
    } else if (!text) {
      setShowSearchSpecies(false);
      setSearchList([]);
    }
  };

  const handleSpeciePress = (specie) => {
    if (registrationType === MULTI && isSampleTreeCompleted) {
      setActiveSpecie(specie);
      setShowTreeCountModal(true);
    } else {
      addSpecieToInventory(specie);
    }
  };

  const handleTreeCountNextButton = () => {
    let specie = activeSpecie;
    specie.treeCount = Number(treeCount);
    addSpecieToInventory(specie);

    setActiveSpecie();
    setTreeCount('');
    setShowTreeCountModal(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 2,
        routes: [{ name: 'MainScreen' }, { name: 'TreeInventory' }, { name: 'TotalTreesSpecies' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <DismissKeyBoard>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.container}>
            <Header
              closeIcon
              onBackPress={onPressBack ? onPressBack : onPressHome}
              headingText={
                registrationType
                  ? i18next.t('label.select_species_header')
                  : i18next.t('label.select_species_tree_species')
              }
            />
            <SpeciesSyncError />
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
              <TextInput
                style={styles.searchText}
                placeholder={i18next.t('label.select_species_search_species')}
                onChangeText={handleSpeciesSearch}
                value={searchText}
                returnKeyType={'search'}
                autoCorrect={false}
              />
              {searchText ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                  }}>
                  <Ionicons name="md-close" size={20} style={styles.closeIcon} />
                </TouchableOpacity>
              ) : (
                []
              )}
            </View>
            {showSearchSpecies ? (
              searchText.length < 3 ? (
                <Text style={styles.notPresentText}>
                  {i18next.t('label.select_species_search_atleast_3_characters')}
                </Text>
              ) : searchList && searchList.length > 0 ? (
                <SearchSpecies
                  searchList={searchList}
                  registrationType={registrationType}
                  onPressSpeciesSingle={onPressSpeciesSingle}
                  toggleUserSpecies={toggleUserSpecies}
                  addSpecieToInventory={handleSpeciePress}
                  editOnlySpecieName={editOnlySpecieName}
                  onPressBack={onPressBack}
                  clearSearchText={() => setSearchText('')}
                  isSampleTree={isSampleTree}
                />
              ) : (
                <Text style={styles.notPresentText}>
                  {i18next.t('label.select_species_search_specie_not_present', {
                    searchText,
                  })}
                </Text>
              )
            ) : (
              <MySpecies
                registrationType={registrationType}
                onPressSpeciesSingle={onPressSpeciesSingle}
                specieList={specieList}
                addSpecieToInventory={handleSpeciePress}
                editOnlySpecieName={editOnlySpecieName}
                onPressBack={onPressBack}
                isSampleTree={isSampleTree}
              />
            )}
          </View>
        </ScrollView>
      </DismissKeyBoard>
      <TreeCountModal
        showTreeCountModal={showTreeCountModal}
        activeSpecie={activeSpecie}
        setTreeCount={setTreeCount}
        treeCount={treeCount}
        onPressTreeCountNextBtn={handleTreeCountNextButton}
      />
    </SafeAreaView>
  );
};

export default ManageSpecies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderWidth: 1,
    height: 48,
    borderRadius: 5,
    marginTop: 24,
    backgroundColor: Colors.WHITE,
    // borderColor: '#00000024',
    shadowColor: '#00000024',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.3,
    elevation: 6,
  },
  searchIcon: {
    color: '#949596',
    paddingLeft: 19,
  },
  searchText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    paddingLeft: 12,
    flex: 1,
  },
  specieListItem: {
    paddingVertical: 20,
    paddingRight: 10,
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
    paddingVertical: 20,
    alignSelf: 'center',
  },
  closeIcon: {
    justifyContent: 'flex-end',
    color: Colors.TEXT_COLOR,
    paddingRight: 20,
  },
});
