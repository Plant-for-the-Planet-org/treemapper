import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';

import { InventoryContext } from '../../reducers/inventory';
import {
  getInventory,
  updateInventory,
  updateSingleTreeSpecie,
} from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { INCOMPLETE_SAMPLE_TREE } from '../../utils/inventoryConstants';
import ManageSpecies from '../ManageSpecies';
import { AddMeasurements } from './AddMeasurements';

const SelectSpecies = () => {
  const [isShowTreeMeasurement, setIsShowTreeMeasurement] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [registrationType, setRegistrationType] = useState(null);
  const [isSampleTree, setIsSampleTree] = useState(false);

  const { state } = useContext(InventoryContext);
  const navigation = useNavigation();

  useEffect(() => {
    Inventory();
  }, []);

  useEffect(() => {
    setIsSampleTree(inventory?.status === INCOMPLETE_SAMPLE_TREE);
  }, [inventory]);

  const Inventory = () => {
    if (state.inventoryID) {
      getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
        setInventory(inventory);

        if (inventory.species.length > 0 && inventory.specieDiameter == null) {
          if (
            inventory?.status === INCOMPLETE_SAMPLE_TREE &&
            inventory.sampleTrees[inventory.completedSampleTreesCount].specieId
          ) {
            setIsShowTreeMeasurement(true);
          } else {
            setIsShowTreeMeasurement(false);
          }
        }
        setRegistrationType(inventory.treeType);
      });
    }
  };

  const onPressSaveBtn = () => {
    setIsShowTreeMeasurement(true);
  };

  const addSpecieToInventory = (specie) => {
    if (!isSampleTree) {
      updateSingleTreeSpecie({
        inventory_id: inventory.inventory_id,
        species: [
          {
            id: specie.guid,
            aliases: specie.scientificName,
            treeCount: 1,
          },
        ],
      });
    } else {
      let updatedSampleTrees = [...inventory.sampleTrees];
      updatedSampleTrees[inventory.completedSampleTreesCount].specieId = specie.guid;
      updatedSampleTrees[inventory.completedSampleTreesCount].specieName = specie.scientificName;

      updateInventory({
        inventory_id: inventory.inventory_id,
        inventoryData: {
          sampleTrees: [...updatedSampleTrees],
        },
      })
        .then(() => {
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
          });
          setIsShowTreeMeasurement(true);
        })
        .catch((err) => {
          dbLog.error({
            logType: LogTypes.INVENTORY,
            message: `Error while adding specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
            logStack: JSON.stringify(err),
          });
          console.error(
            `Error while adding specie with id: ${specie.guid} for sample tree #${
              inventory.completedSampleTreesCount + 1
            } having inventory_id: ${inventory.inventory_id}`,
            err,
          );
        });
    }
  };

  return (
    <>
      {!isShowTreeMeasurement ? (
        <ManageSpecies
          onPressSpeciesSingle={onPressSaveBtn}
          onPressBack={() => navigation.goBack()}
          registrationType={registrationType}
          addSpecieToInventory={addSpecieToInventory}
          isSampleTree={isSampleTree}
          screen={'SelectSpecies'}
        />
      ) : (
        <AddMeasurements setIsShowTreeMeasurement={setIsShowTreeMeasurement} />
      )}
    </>
  );
};
export default SelectSpecies;
