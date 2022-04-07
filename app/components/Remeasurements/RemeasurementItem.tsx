import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { getInventoryByLocationId } from '../../repositories/inventory';
import { Colors } from '../../styles';
import { setRemeasurementId } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { useNavigation } from '@react-navigation/native';

type Props = {
  item: any;
};

const RemeasurementItem = ({ item }: Props) => {
  console.log('\n\nitem', item);
  const [inventory, setInventory] = useState<any>();

  const { dispatch } = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    getPlantLocation();
  }, [item]);

  const getPlantLocation = async () => {
    const plantLocation = await getInventoryByLocationId({ locationId: item.parentId });
    if (plantLocation && plantLocation.length > 0) {
      setInventory(plantLocation[0]);
    }
    console.log('\n\nplantLocation', plantLocation);
  };

  const handleItemOnPress = () => {
    setRemeasurementId(item.id)(dispatch);
    navigation.navigate('RemeasurementReview');
  };

  if (!inventory) {
    return <></>;
  }

  return (
    <TouchableOpacity onPress={handleItemOnPress}>
      <View>
        <Text style={{ color: Colors.PLANET_BLACK }}>RemeasurementItem</Text>
      </View>
    </TouchableOpacity>
  );
};

export default RemeasurementItem;

const styles = StyleSheet.create({});
