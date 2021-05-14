import { CommonActions, useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import { getForms } from '../../repositories/additionalData';
import { getInventory } from '../../repositories/inventory';
import { sortByField } from '../../utils/sortBy';

interface IAdditionalDataFormProps {}

const AdditionalDataForm = (props: IAdditionalDataFormProps) => {
  const [forms, setForms] = useState<any>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
  const [treeType, setTreeType] = useState<string>('');
  const [locateTree, setLocateTree] = useState<string>('');

  const { state: inventoryState } = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
        if (inventoryData) {
          setTreeType(inventoryData.treeType);
          setLocateTree(inventoryData.locateTree);
          addFormsToState(inventoryData.treeType, inventoryData.locateTree);
        }
      });
    });
    return unsubscribe;
  }, [navigation, inventoryState.inventoryID]);

  const addFormsToState = (treeType: string, locateTree: string) => {
    getForms().then((formsData: any) => {
      const shouldShowForm = formsData && formsData.length > 0 && formsData[0].elements.length > 0;
      if (formsData) {
        setForms(sortByField('order', formsData));
      }
      if (!shouldShowForm) {
        navigation.dispatch(
          CommonActions.reset({
            index: 2,
            routes: [
              { name: 'MainScreen' },
              { name: 'TreeInventory' },
              { name: 'SingleTreeOverview' },
            ],
          }),
        );
      }
    });
  };

  return (
    <View>
      <Text></Text>
    </View>
  );
};

export default AdditionalDataForm;

const styles = StyleSheet.create({});
