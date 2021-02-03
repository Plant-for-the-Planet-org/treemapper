import React, { useEffect } from 'react';
import Realm from 'realm';
import { bugsnag } from '../../utils';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '_styles';
import Icon from 'react-native-vector-icons/Feather';
// import { toggleUserSpecies } from '../../repositories/species';
import {
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  Species,
  User,
  ScientificSpecies,
  ActivityLogs
} from '../../repositories/schema';
import { LogTypes } from '../../utils/constants';
import dbLog from '../../repositories/logs';

const SearchSpecies = ({
  searchList,
  toggleSpecies,
  setSearchList
}) => {

  const handleSpecieOnClick = (item, index) => {
    toggleUserSpecies(item.guid)
    toggleSpecies(index);
  }

  const toggleUserSpecies = (guid) => {
    return new Promise((resolve, reject) => {
      Realm.open({
        schema: [
          Inventory,
          Species,
          Polygons,
          Coordinates,
          OfflineMaps,
          User,
          AddSpecies,
          ScientificSpecies,
          ActivityLogs
        ],
      })
      .then((realm) => {
        realm.write(() => {
          let specieToToggle = realm.objectForPrimaryKey('ScientificSpecies', guid);
          specieToToggle.isUserSpecies= !(specieToToggle.isUserSpecies);
          console.log(`Specie with guid ${guid} is toggled ${specieToToggle.isUserSpecies ? 'on' : 'off'}`);
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Specie with guid ${guid} is toggled ${specieToToggle.isUserSpecies ? 'on' : 'off'}`,
          })
        });
        resolve();
      })
    })
  };

  const renderSearchSpecieCard = ({ item, index }) => {
    // const isDisabled = item.isDisabled;
    const isCheck = item.isUserSpecies;
    // console.log(item.isUserSpecies,'isCheck');
  
    const SpecieListItem = () => {
      return (
        <>
          <View>
            <Text
              style={{
                fontSize: Typography.FONT_SIZE_16,
                fontFamily: Typography.FONT_FAMILY_REGULAR,
              }}>
              {item.scientific_name}
            </Text>
          </View>
          <Icon
            name={isCheck ? 'check-circle' : 'plus-circle'}
            size={25}
            color={isCheck ? Colors.PRIMARY : Colors.TEXT_COLOR}
          />
        </>
      );
    };

    // if (isDisabled) {
    //   return (
    //     <View style={[styles.specieListItem, { opacity: 0.5 }]}>
    //       <SpecieListItem />
    //     </View>
    //   );
    // } else {
      return (
        <TouchableOpacity
          key={index}
          style={styles.specieListItem}
          onPress={() => {
            // if (isCheck) {
            //   removeSpecies(item, index);
            // } else {
            //   addSpecies(item, index);
            // }
            handleSpecieOnClick(item, index);
          }}>
          <SpecieListItem />
        </TouchableOpacity>
      );
    // }
  };

  // const memoizedRenderSearchSpecieCard = React.useMemo(() => renderSearchSpecieCard, [
  //   selectedSpecies,
  // ]);

  return (
    <View style={{ flex: 1, paddingTop: 15 }}>
      <FlatList
        style={{ flex: 1 }}
        data={searchList}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.guid}
        renderItem={renderSearchSpecieCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  specieListItem: {
    paddingVertical: 20,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SearchSpecies;
