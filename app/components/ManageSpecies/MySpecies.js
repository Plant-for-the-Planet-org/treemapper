import i18next from 'i18next';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography } from '_styles';
import { empty, species_default } from '../../assets';
import { SINGLE } from '../../utils/inventoryConstants';

const MySpecies = ({
  registrationType,
  onPressSpeciesSingle,
  specieList,
  addSpecieToInventory,
  editOnlySpecieName,
  onPressBack,
  isSampleTree,
  navigateToSpecieInfo,
  screen,
}) => {
  const renderSpecieCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        key={index}
        style={{
          flex: 1,
          paddingTop: 20,
          paddingBottom: 20,
          paddingRight: 10,
          borderBottomWidth: 1,
          borderColor: '#E1E0E061',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => {
          if (registrationType || isSampleTree) {
            addSpecieToInventory(item);
            if (editOnlySpecieName && (registrationType === SINGLE || isSampleTree)) {
              onPressBack();
            } else if (registrationType === SINGLE && !editOnlySpecieName) {
              onPressSpeciesSingle(item);
            }
          } else if (screen !== 'SelectSpecies') {
            navigateToSpecieInfo(item);
          }
        }}>
        <View style={{ flex: 1 }}>
          {item.image ? (
            <Image
              source={{
                uri: `${item.image}`,
              }}
              style={styles.imageView}
            />
          ) : (
            <Image
              source={species_default}
              style={{
                borderRadius: 8,
                resizeMode: 'contain',
                width: 100,
                height: 80,
                // backgroundColor: Colors.TEXT_COLOR,
              }}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
              paddingBottom: 6,
            }}>
            {item.aliases}
          </Text>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_12,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {item.scientificName}
          </Text>
        </View>
        {item.guid !== 'unknown' && screen === 'SelectSpecies' ? (
          <TouchableOpacity onPress={() => navigateToSpecieInfo(item)}>
            <Ionicons name="information-circle-outline" size={20} />
          </TouchableOpacity>
        ) : (
          []
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View>
        <Text
          style={{
            paddingTop: 25,
            paddingBottom: 15,
            fontFamily: Typography.FONT_FAMILY_BOLD,
            fontSize: Typography.FONT_SIZE_16,
          }}>
          {i18next.t('label.select_species_my_species')}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        {specieList && specieList.length !== 0 ? (
          <FlatList
            style={{ flex: 1 }}
            data={specieList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.guid}
            renderItem={renderSpecieCard}
            keyboardShouldPersistTaps="always"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
            <SvgXml
              xml={empty}
              style={{
                bottom: 10,
              }}
            />
            <Text style={styles.headerText}>
              {i18next.t('label.select_species_looks_empty_here')}
            </Text>
            <Text style={styles.subHeadingText}>
              {i18next.t('label.select_species_add_species_desscription')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  imageView: {
    borderRadius: 8,
    resizeMode: 'cover',
    width: 100,
    height: 80,
    backgroundColor: Colors.TEXT_COLOR,
  },
});

export default MySpecies;
