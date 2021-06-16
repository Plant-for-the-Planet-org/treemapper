import React, { useEffect, useState, useContext } from 'react';
import { View, SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';
import { TopRightBackground, Header } from '../Common';
import { Colors, Typography } from '../../styles';
import { SpecieListItem } from '../SampleTrees/TotalTreesSpecies';
import i18next from 'i18next';
import { useRoute, CommonActions, useNavigation } from '@react-navigation/native';
import { getScientificSpeciesById } from '../../repositories/species';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory } from '../../repositories/inventory';
import { getNotSampledSpecies } from '../../utils/getSampleSpecies';

interface SpecieSampleTreeProps {
  notSampledSpecies?: string[];
  plantedSpecies?: string[];
}

type RootStackParamList = {
  SpecieSampleTree: SpecieSampleTreeProps;
};

type SpecieSampleRouteProp = RouteProp<RootStackParamList, 'SpecieSampleTree'>;

const SpecieSampleTree = () => {
  const [speciesToSample, setSpeciesToSample] = useState([]);
  const [inventory, setInventory] = useState();
  const [speciesType, setSpeciesType] = useState('');
  const route: SpecieSampleRouteProp = useRoute();
  const navigation = useNavigation();
  const { state } = useContext(InventoryContext);

  let currentSampleTree;
  useEffect(() => {
    getInventory({ inventoryID: state.inventoryID }).then((inventoryData) => {
      setInventory(inventoryData);
      currentSampleTree = inventoryData.sampleTrees[inventoryData.completedSampleTreesCount];
      if (currentSampleTree?.latitude && currentSampleTree?.imageUrl) {
        const plantedSpecies = inventoryData.species.map((specie) => specie.id);
        createSpeciesArray(plantedSpecies);
        setSpeciesType('plantedSpecies');
      } else {
        const notSampledSpecies = getNotSampledSpecies(inventoryData);
        createSpeciesArray(notSampledSpecies);
        setSpeciesType('notSampledSpecies');
      }
    });
  }, []);

  const createSpeciesArray = async (species: any) => {
    let specieArray: {}[] = [];
    for (let id of species) {
      let specieItem = await getScientificSpeciesById(id);
      specieArray.push(specieItem);
    }
    setSpeciesToSample(specieArray);
  };

  const onPressSpecie = (specie: any) => {
    if (speciesType === 'notSampledSpecies') {
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [
            { name: 'MainScreen' },
            { name: 'TreeInventory' },
            {
              name: 'RecordSampleTrees',
              params: { specieId: specie.guid, specieName: specie.scientificName },
            },
          ],
        }),
      );
    } else {
      navigation.navigate('SelectSpecies', { specie });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <TopRightBackground />
          <View style={{ paddingHorizontal: 25 }}>
            <Header headingText={i18next.t('label.add_sample_tree')} />
          </View>

          {/* container for description of what sample trees are and how to proceed */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {i18next.t('label.select_species_and_add_sample')}
            </Text>
          </View>
          {speciesToSample.map((specie, index) => (
            <TouchableOpacity
              onPress={() => {
                onPressSpecie(specie);
              }}>
              <SpecieListItem item={specie} index={index} key={index} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SpecieSampleTree;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: Colors.WHITE,
    position: 'relative',
  },

  descriptionContainer: {
    marginTop: 40,
    paddingHorizontal: 25,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
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
