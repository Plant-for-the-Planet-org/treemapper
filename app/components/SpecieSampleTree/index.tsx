import i18next from 'i18next';
import React, { useEffect, useState, useContext } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { View, SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';

import { Colors, Typography } from '../../styles';
import { setSpecie } from '../../actions/species';
import { TopRightBackground, Header } from '../Common';
import { SpecieCard } from '../ManageSpecies/MySpecies';
import { SpeciesContext } from '../../reducers/species';
import { InventoryContext } from '../../reducers/inventory';
import { getInventory } from '../../repositories/inventory';
import { getNotSampledSpecies } from '../../utils/getSampleSpecies';
import { getScientificSpeciesById } from '../../repositories/species';
import { ScientificSpeciesType } from '../../utils/ScientificSpecies/ScientificSpeciesTypes';
interface SpecieSampleTreeProps {
  onPressBack?: any;
  addSpecieToInventory?: any;
  editOnlySpecieName?: any;
}

const SpecieSampleTree: React.FC<SpecieSampleTreeProps> = ({
  onPressBack,
  addSpecieToInventory,
  editOnlySpecieName,
}) => {
  const [speciesToSample, setSpeciesToSample] = useState<any>([]);
  const [inventory, setInventory] = useState();
  const [speciesType, setSpeciesType] = useState('');
  const navigation = useNavigation();
  const { state } = useContext(InventoryContext);
  const { dispatch } = useContext(SpeciesContext);

  let currentSampleTree;
  useEffect(() => {
    getInventory({ inventoryID: state.inventoryID }).then(inventoryData => {
      setInventory(inventoryData);
      currentSampleTree = inventoryData.sampleTrees[inventoryData.completedSampleTreesCount];
      if ((currentSampleTree?.latitude && currentSampleTree?.imageUrl) || editOnlySpecieName) {
        const plantedSpecies = inventoryData.species.map((specie: any) => specie.id);
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
    } else if (editOnlySpecieName) {
      addSpecieToInventory(JSON.stringify(specie));
      onPressBack();
    } else {
      navigation.navigate('SelectSpecies', {
        specie: JSON.stringify(specie),
      });
    }
  };
  const navigateToSpecieInfo = (specie: ScientificSpeciesType) => {
    setSpecie(specie)(dispatch);
    navigation.navigate('SpecieInfo', { screen: 'SelectSpecies' });
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <TopRightBackground />
          <View>
            <Header
              containerStyle={styles.headerContainer}
              headingText={
                inventory?.sampleTrees[inventory?.completedSampleTreesCount] || editOnlySpecieName
                  ? i18next.t('label.select_species')
                  : i18next.t('label.add_sample_tree')
              }
            />
          </View>

          {/* container for description of what sample trees are and how to proceed */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {i18next.t('label.select_species_and_add_sample')}
            </Text>
          </View>
          {speciesToSample.map((specie: any, index: number) => (
            <View style={styles.speciesCardContainer} key={index}>
              <SpecieCard
                index={index}
                item={specie}
                isSampleTree={true}
                screen={'SelectSpecies'}
                isSampleTreeSpecies={true}
                onPressSpecies={onPressSpecie}
                navigateToSpecieInfo={navigateToSpecieInfo}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SpecieSampleTree;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    position: 'relative',
  },
  headerContainer: {
    paddingHorizontal: 25,
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
  speciesCardContainer: {
    // paddingLeft: 25,
  },
});
