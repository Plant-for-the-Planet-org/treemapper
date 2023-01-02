import React, {useState, useEffect} from 'react';
import i18next from 'i18next';
import CustomDropDownPicker from '../Common/Dropdown/CustomDropDownPicker';
import {useInventory} from '../../reducers/inventory';
import {setFetchNecessaryInventoryFlag} from '../../actions/inventory';
import {InventoryType} from '../../types/inventory';
import {getUserDetails, modifyUserDetails} from '../../repositories/user';

export const InventoryTypeSelector = () => {
  const {dispatch} = useInventory();

  const [showInventoryTypeDropdown, setShowInventoryTypeDropdown] = useState<boolean>(false);
  const [selectedInvType, setSelectedInvType] = useState<InventoryType | null>(null);

  const setInventoryType = async () => {
    const user = await getUserDetails();
    if (user) {
      setSelectedInvType(user.fetchNecessaryInventoryFlag);
    }
  };

  const switchInventoryFetchTypeFlag = async () => {
    if (selectedInvType !== null) {
      const _fetchNecessaryInventoryFlag = selectedInvType
        ? InventoryType.NecessaryItems
        : InventoryType.AllItems;
      setFetchNecessaryInventoryFlag(_fetchNecessaryInventoryFlag)(dispatch);
      await modifyUserDetails({
        fetchNecessaryInventoryFlag: _fetchNecessaryInventoryFlag,
      });
    }
  };

  useEffect(() => {
    setInventoryType();
  }, []);

  useEffect(() => {
    switchInventoryFetchTypeFlag();
  }, [selectedInvType]);

  const inventoryTypeOption = [
    {label: i18next.t('label.fetch_all_items'), value: InventoryType.AllItems},
    {label: i18next.t('label.fetch_necessary_items'), value: InventoryType.NecessaryItems},
  ];

  return (
    <CustomDropDownPicker
      items={inventoryTypeOption}
      open={showInventoryTypeDropdown}
      setOpen={setShowInventoryTypeDropdown}
      value={selectedInvType}
      setValue={setSelectedInvType}
      style={{marginBottom: 8}}
    />
  );
};
