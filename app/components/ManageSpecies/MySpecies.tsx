import React from 'react';
import i18next from 'i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

import { HeartPink, SingleTreeIcon, species_default } from '../../assets';
import { Colors, Typography } from '../../styles';
import { SINGLE } from '../../utils/inventoryConstants';
import { ScientificSpeciesType } from '../../utils/ScientificSpecies/ScientificSpeciesTypes';

interface SpecieCardProps {
  item: any;
  index: number;
  registrationType?: any;
  onPressSpecies: any;
  addSpecieToInventory?: (specie: ScientificSpeciesType) => void;
  editOnlySpecieName?: any;
  onPressBack?: any;
  isSampleTree: any;
  navigateToSpecieInfo?: (specie: ScientificSpeciesType) => void;
  screen?: string;
  isSampleTreeSpecies?: boolean;
  handleRemoveFavourite?: (specie: ScientificSpeciesType) => void;
}

export const SpecieCard: React.FC<SpecieCardProps> = ({
  item,
  index,
  registrationType,
  onPressSpecies,
  addSpecieToInventory,
  editOnlySpecieName,
  onPressBack,
  isSampleTree,
  navigateToSpecieInfo,
  screen,
  isSampleTreeSpecies,
  handleRemoveFavourite,
}) => {
  const handlePress = () => {
    if (isSampleTree && isSampleTreeSpecies) {
      onPressSpecies(item);
    } else if ((registrationType || isSampleTree) && addSpecieToInventory) {
      addSpecieToInventory(item);
      if (editOnlySpecieName && (registrationType === SINGLE || isSampleTree)) {
        onPressBack();
      } else if (registrationType === SINGLE && !editOnlySpecieName) {
        onPressSpecies(item);
      }
    } else if (screen === 'ManageSpecies' && navigateToSpecieInfo) {
      navigateToSpecieInfo(item);
    }
  };
  return (
    <TouchableOpacity key={index} style={styles.mySpecies} onPress={handlePress}>
      <View style={styles.imageCon}>
        {item.image ? (
          <Image
            source={{
              uri: `${item.image}`,
            }}
            style={styles.imageView}
          />
        ) : (
          <View style={{ backgroundColor: '#82828210', borderRadius: 8 }}>
            <SingleTreeIcon width={74} height={74} />
          </View>
        )}
      </View>
      <View style={styles.flex1}>
        <Text style={styles.unknownText}>
          {item.guid !== 'unknown' || item.id === 'unknown'
            ? item.aliases
            : i18next.t('label.select_species_unknown')}
        </Text>
        <Text style={styles.unknownTextVal}>
          {item.guid !== 'unknown' || item.id === 'unknown'
            ? item.scientificName
            : i18next.t('label.select_species_unknown')}
        </Text>
      </View>
      {item.guid !== 'unknown' && screen === 'SelectSpecies' && navigateToSpecieInfo ? (
        <TouchableOpacity onPress={() => navigateToSpecieInfo(item)}>
          <Ionicons name="information-circle-outline" size={20} />
        </TouchableOpacity>
      ) : (
        []
      )}
      <TouchableOpacity onPress={() => handleRemoveFavourite(item)}>
        <HeartPink />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  imageView: {
    borderRadius: 8,
    resizeMode: 'cover',
    width: 100,
    height: 80,
    backgroundColor: Colors.TEXT_COLOR,
  },
  mySpecies: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    justifyContent: 'space-between',
  },
  imageCon: {
    paddingRight: 18,
    paddingLeft: 8,
  },
  image: {
    height: 74,
    width: 74,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  unknownText: {
    paddingBottom: 6,
    color: Colors.PLANET_BLACK,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  unknownTextVal: {
    color: Colors.PLANET_BLACK,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_ITALIC_SEMI_BOLD,
  },
});
