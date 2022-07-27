import React, {useState, useCallback, useEffect} from 'react';
import CustomDropDownPicker from '../Common/Dropdown/CustomDropDownPicker';
import {useInventory} from '../../reducers/inventory';
import {setFetchNecessaryInventoryFlag} from '../../actions/inventory';
import {InventoryType} from '../../types/inventory';
import {getUserDetails, modifyUserDetails} from '../../repositories/user';

export const InventoryTypeSelector = () => {
  const {state, dispatch} = useInventory();

  const [showInventoryTypeDropdown, setShowInventoryTypeDropdown] = useState<boolean>(false);
  const [selectedInvType, setSelectedInvType] = useState<InventoryType | null>(null);

  const setInventoryType = async () => {
    const user = await getUserDetails();
    console.log(user);
    if (user) {
      setSelectedInvType(user.fetchNecessaryInventoryFlag);
    } else setSelectedInvType(InventoryType.NecessaryItems);
  };

  const switchInventoryFetchTypeFlag = async () => {
    const _fetchNecessaryInventoryFlag = selectedInvType
      ? InventoryType.NecessaryItems
      : InventoryType.AllItems;
    setFetchNecessaryInventoryFlag(_fetchNecessaryInventoryFlag)(dispatch);
    await modifyUserDetails({fetchNecessaryInventoryFlag: _fetchNecessaryInventoryFlag});
  };

  useEffect(() => {
    setInventoryType();
  }, []);

  useEffect(() => {
    switchInventoryFetchTypeFlag();
  }, [selectedInvType]);

  useEffect(() => {
    console.log('selectedInvType', selectedInvType);
  }, [selectedInvType]);

  const inventoryTypeOption = [
    {label: 'Fetch all Items', value: InventoryType.AllItems},
    {label: 'Fetch Necessary Items', value: InventoryType.NecessaryItems},
  ];

  return (
    <CustomDropDownPicker
      items={inventoryTypeOption}
      open={showInventoryTypeDropdown}
      setOpen={setShowInventoryTypeDropdown}
      value={selectedInvType}
      setValue={setSelectedInvType}
    />
  );
};
