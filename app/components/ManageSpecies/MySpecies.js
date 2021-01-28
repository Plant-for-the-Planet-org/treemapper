import React from 'react'
import PrimaryButton from '../Common/PrimaryButton';
import { FlatList, Text,  TouchableOpacity, View } from 'react-native';
import { Typography } from '_styles';
import i18next from 'i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MySpecies = ({onSaveMultipleSpecies, registrationType, speciesState,onPressSpeciesSingle,onPressSpeciesMultiple,specieList}) => {
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
                onPressSpeciesSingle(item);
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
                {item.scientificName}
              </Text>
            </View>
            {registrationType == 'multiple' ? (
              <Text>{item.treeCount ? item.treeCount : 'NA'}</Text>
            ) : (
                <Ionicons name="chevron-forward-outline" size={20} />
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
          <FlatList
            style={{ flex: 1 }}
            data={registrationType === 'multiple' ? speciesState.multipleTreesSpecies : specieList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.speciesId}
            renderItem={renderSpecieCard}
          />
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
    )
}

export default MySpecies
