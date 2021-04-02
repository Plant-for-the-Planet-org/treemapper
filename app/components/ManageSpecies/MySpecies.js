import React, { useEffect } from 'react';
import { SvgXml } from 'react-native-svg';
import PrimaryButton from '../Common/PrimaryButton';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import i18next from 'i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { empty } from '../../assets';
import { Colors, Typography } from '_styles';
import { useNavigation } from '@react-navigation/native';
import { MULTI, SINGLE } from '../../utils/inventoryConstants';
import { deleteUserSpecieFromServer } from '../../utils/addUserSpecies';

const MySpecies = ({
  registrationType,
  onPressSpeciesSingle,
  specieList,
  addSpecieToInventory,
  editOnlySpecieName,
  onPressBack,
  isSampleTree,
  toggleUserSpecies,
}) => {
  const navigation = useNavigation();
  // useEffect(() => {
  //   for (const specie of specieList) {
  //     console.log(specie, 'specie');
  //     deleteUserSpecieFromServer(specie);
  //   }
  // }, []);
  const renderSpecieCard = ({ item, index }) => {
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
        onPress={() => {
          if (registrationType || isSampleTree) {
            addSpecieToInventory(item);
          }
          if (editOnlySpecieName && (registrationType === SINGLE || isSampleTree)) {
            onPressBack();
          } else if (registrationType === SINGLE && !editOnlySpecieName) {
            onPressSpeciesSingle(item);
          }
        }}>
        <View>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {item.scientificName}
          </Text>
        </View>
        {item.guid !== 'unknown' ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SpecieInfo', {
                specieName: item.scientificName,
                specieGuid: item.guid,
                specieId: item.specieId,
                specieAliases: item.aliases,
                specieDescription: item.description,
                specieImage: item.image,
                toggleUserSpecies,
              })
            }>
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
});

export default MySpecies;
