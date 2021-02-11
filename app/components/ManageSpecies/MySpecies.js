import React from 'react';
import { SvgXml } from 'react-native-svg';
import PrimaryButton from '../Common/PrimaryButton';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import i18next from 'i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { empty } from '../../assets';
import { Colors, Typography } from '_styles';
import { useNavigation } from '@react-navigation/native';

const MySpecies = ({
  onSaveMultipleSpecies,
  registrationType,
  onPressSpeciesSingle,
  onPressSpeciesMultiple,
  specieList,
  addSpecieNameToInventory,
  editOnlySpecieName,
  onPressBack,
}) => {
  const navigation = useNavigation();

  // console.log('specieList =>', specieList);

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
          if (registrationType == 'single') {
            addSpecieNameToInventory(item.scientific_name);
            if (editOnlySpecieName) {
              onPressBack();
            } else {
              onPressSpeciesSingle(item);
            }
          } else if (registrationType == 'multiple') {
            onPressSpeciesMultiple(item, index);
          }
        }}>
        <View>
          <Text
            style={{
              fontSize: Typography.FONT_SIZE_16,
              fontFamily: Typography.FONT_FAMILY_REGULAR,
            }}>
            {item.scientific_name}
          </Text>
        </View>
        {registrationType == 'multiple' ? (
          <Text>{item.treeCount ? item.treeCount : 'NA'}</Text>
        ) : item.scientific_name !== 'Unknown' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('SpecieInfo', { SpecieName: item.scientific_name })}>
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
          <View style={{ flex: 1, alignItems: 'center' }}>
            <SvgXml
              xml={empty}
              style={{
                bottom: 10,
              }}
            />
            <Text style={styles.headerText}>Looks Empty Here!</Text>
            <Text style={styles.subHeadingText}>Add species to your list by </Text>
            <Text style={styles.subHeadingText}>searching the species. </Text>
          </View>
        )}
      </View>
      {registrationType === 'multiple' && (
        <PrimaryButton
          onPress={onSaveMultipleSpecies}
          btnText={i18next.t('label.select_species_btn_text')}
          testID={'btn_save_and_continue_species'}
          accessibilityLabel={'Save and Continue Species'}
        />
      )}
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
  },
});

export default MySpecies;
