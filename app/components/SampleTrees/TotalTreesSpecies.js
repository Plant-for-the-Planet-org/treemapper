import React, { useContext, useEffect } from 'react';
import { Text, View, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory, updateLastScreen, updateInventory } from '../../repositories/inventory';
import PrimaryButton from '../Common/PrimaryButton';
import Header from '../Common/Header';
import { Colors, Typography } from '_styles';
import i18next from 'i18next';
import { useNavigation } from '@react-navigation/core';
import { useState } from 'react';
import ManageSpecies from '../ManageSpecies';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { MULTI } from '../../utils/inventoryConstants';

export default function TotalTreesSpecies() {
  const { state: inventoryState } = useContext(InventoryContext);
  const [showManageSpecies, setShowManageSpecies] = useState(false);
  const [inventory, setInventory] = useState();
  const navigation = useNavigation();

  useEffect(() => {
    let data = {
      inventory_id: inventoryState.inventoryID,
      last_screen: 'TotalTreesSpecies',
    };
    updateLastScreen(data);
    getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
      setInventory(inventoryData);
    });
  }, []);

  const addSpecieToInventory = (specie) => {
    console.log('specie added', specie);
    let species = [...inventory.species];

    let deleteSpecieIndex;
    let updateSpecieIndex;
    for (const index in species) {
      if (species[index].id === specie.guid && specie.treeCount === 0) {
        deleteSpecieIndex = index;
        break;
      } else if (species[index].id === specie.guid && specie.treeCount > 0) {
        updateSpecieIndex = index;
      }
    }

    if (deleteSpecieIndex) {
      species.splice(deleteSpecieIndex, 1);
    } else if (updateSpecieIndex) {
      species[updateSpecieIndex].treeCount = specie.treeCount;
    } else {
      species = [
        ...species,
        {
          aliases: specie.scientificName,
          id: specie.guid,
          treeCount: specie.treeCount,
        },
      ];
    }

    console.log('species=>>', species);

    updateInventory({
      inventory_id: inventory.inventory_id,
      inventoryData: {
        species,
      },
    })
      .then(() => {
        getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
          setInventory(inventoryData);
        });
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully added specie with id: ${specie.guid} multiple tree having inventory_id: ${inventory.inventory_id}`,
        });
        console.log(
          `Successfully added specie with id: ${specie.guid} multiple tree having inventory_id: ${inventory.inventory_id}`,
        );
      })
      .catch((err) => {
        console.error('Error while specie in multiple tree', err);
      });
  };

  const SpecieListItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        key={index}
        style={{
          paddingVertical: 20,
          paddingRight: 10,
          borderBottomWidth: 1,
          borderColor: '#E1E0E061',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={(item) => {
          console.log('specie clicked', item);
        }}>
        <View>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {item.aliases}
          </Text>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_18,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
              marginTop: 10,
              color: Colors.PRIMARY,
            }}>
            {item.treeCount}
          </Text>
        </View>
        {item.guid !== 'unknown' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('SpecieInfo', { SpecieName: item.aliases })}>
            <Ionicons name="information-circle-outline" size={20} />
          </TouchableOpacity>
        ) : (
          []
        )}
      </TouchableOpacity>
    );
  };

  if (showManageSpecies) {
    return (
      <ManageSpecies
        onPressBack={() => setShowManageSpecies(false)}
        registrationType={MULTI}
        addSpecieToInventory={addSpecieToInventory}
        isSampleTree={true}
        isSampleTreeCompleted={true}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        {/* <Image source={sample_trees_vector} style={styles.backgroundImage} /> */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header headingText={i18next.t('label.total_trees_header')} />

          {/* container for description of what sample trees are and how to proceed */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {i18next.t('label.add_all_trees_planted_on_site')}
            </Text>
          </View>
          {inventory && Array.isArray(inventory.species) && inventory.species.length > 0
            ? inventory.species.map((specie, index) => (
              <SpecieListItem item={specie} index={index} key={index} />
            ))
            : []}
        </ScrollView>
        <PrimaryButton
          onPress={() => setShowManageSpecies(true)}
          btnText={i18next.t('label.select_species_add_species')}
          theme={'primary'}
          testID={'sample_tree_count_continue'}
          accessibilityLabel={'sample_tree_count_continue'}
        />
        <PrimaryButton
          onPress={() => navigation.navigate('InventoryOverview')}
          btnText={i18next.t('label.tree_review_continue_to_review')}
          theme={'primary'}
          testID={'sample_tree_count_continue'}
          accessibilityLabel={'sample_tree_count_continue'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
    position: 'relative',
  },
  backgroundImage: {
    width: '90%',
    height: 40,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  descriptionContainer: {
    marginTop: 40,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  treeCountSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 30,
  },
  treeCountSelection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 10,
    minWidth: '28%',
  },
  treeCountSelectionActive: {
    borderWidth: 0,
    padding: 11,
    backgroundColor: Colors.PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
  },
  treeCountSelectionActiveText: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
});
