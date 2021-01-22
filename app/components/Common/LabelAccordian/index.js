import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Colors, Typography } from '_styles';
import Label from '../Label';
import Accordian from '../Accordian';
import { addSpeciesAction } from '../../../repositories/inventory';
import { InventoryContext } from '../../../reducers/inventory';
import { useNavigation, useRoute } from '@react-navigation/native';

const LabelAccordian = ({ data, onPressRightText, isEditShow, plantingDate, status }) => {
  const { state } = useContext(InventoryContext);
  const navigation = useNavigation();
  const route = useRoute();

  const [species, setSpecies] = useState(data ? data : []);

  const renderSubSpecie = (item, index) => (
    <Accordian
      onSubmitEditing={onSubmitEditing}
      onPressDelete={onPressDelete}
      onBlur={() => onPressContinue(true)}
      onChangeText={onChangeText}
      index={index}
      data={item}
      shouldExpand={false}
      status={status}
    />
  );

  const onChangeText = (text, dataKey, index) => {
    species[index][dataKey] = text;
    setSpecies([...species]);
  };

  const onSubmitEditing = () => {
    onPressContinue(true);
  };

  const onPressDelete = (index) => {
    species.splice(index, 1);
    setSpecies([...species]);
  };

  const onPressContinue = (onBlur = false) => {
    let speciesData = {
      inventory_id: state.inventoryID,
      species,
      plantation_date: `${plantingDate.getTime()}`,
    };
    if (!onBlur) {
      let totalTreeCount = 0;
      for (let i = 0; i < species.length; i++) {
        totalTreeCount += Number(species[i].treeCount);
      }
      if (totalTreeCount < 2) {
        alert('Tree count should be greater than one.');
        return;
      }
    }
    addSpeciesAction(speciesData).then(() => {
      if (!onBlur) {
        if (route.params?.isEdit) {
          navigation.navigate('InventoryOverview');
        } else {
          navigation.navigate('LocateTree');
        }
      }
    });
  };

  const renderSpecieCont = ({ item, index }) => {
    return <View>{renderSubSpecie(item, index)}</View>;
  };

  const addSpecies = () => {
    species.push({ nameOfTree: '', treeCount: '' });
    setSpecies([...species]);
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <Label
        leftText={'Species'}
        rightText={isEditShow && 'Edit'}
        onPressRightText={onPressRightText}
      />
      {species && (
        <FlatList
          keyboardShouldPersistTaps={'always'}
          data={species}
          renderItem={renderSpecieCont}
        />
      )}
      {status !== 'pending' && (
        <TouchableOpacity
          onPress={addSpecies}
          accessible={true}
          accessibilityLabel="Accordian Button"
          testID="accordian_btn">
          <Text style={styles.addSpecies}>+ Add Species</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
export default LabelAccordian;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  treeCountCont: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
  },
  treeCount: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.PRIMARY,
  },
  trees: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    marginHorizontal: 5,
  },
  arrowIcon: {
    width: 35,
    height: 35,
  },
  oneSpecieCont: {
    flexDirection: 'row',
    paddingVertical: 5,
    justifyContent: 'space-between',
    marginLeft: 25,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
});
