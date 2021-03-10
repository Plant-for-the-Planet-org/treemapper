import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '_styles';
import Icon from 'react-native-vector-icons/Feather';

const SearchSpecies = ({
  searchList,
  toggleUserSpecies,
  registrationType,
  onPressSpeciesSingle,
  addSpecieToInventory,
  editOnlySpecieName,
  onPressBack,
  clearSearchText,
  isSampleTree,
}) => {
  const renderSearchSpecieCard = ({ item, index }) => {
    const isCheck = item.isUserSpecies;

    const SpecieListItem = () => {
      return (
        <>
          <View>
            <Text
              style={{
                fontSize: Typography.FONT_SIZE_16,
                fontFamily: Typography.FONT_FAMILY_REGULAR,
              }}>
              {item.scientificName}
            </Text>
          </View>
          <TouchableOpacity
            key={index}
            onPress={() => {
              toggleUserSpecies(item.guid);
            }}>
            <Icon
              name={isCheck ? 'check-circle' : 'plus-circle'}
              size={25}
              color={isCheck ? Colors.PRIMARY : Colors.TEXT_COLOR}
            />
          </TouchableOpacity>
        </>
      );
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.specieListItem}
        onPress={() => {
          toggleUserSpecies(item.guid, true);
          addSpecieToInventory(item);
          if (editOnlySpecieName && (registrationType === 'single' || isSampleTree)) {
            onPressBack();
          } else if (registrationType === 'single' && !editOnlySpecieName) {
            onPressSpeciesSingle(item);
          }

          if (registrationType == 'single') {
            clearSearchText();
          }
        }}>
        <SpecieListItem />
      </TouchableOpacity>
    );
  };

  const memoizedRenderSearchSpecieCard = React.useMemo(() => renderSearchSpecieCard, [searchList]);

  return (
    <View style={{ flex: 1, paddingTop: 15 }}>
      <FlatList
        style={{ flex: 1 }}
        data={searchList}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.guid}
        renderItem={memoizedRenderSearchSpecieCard}
        keyboardShouldPersistTaps="always"
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
