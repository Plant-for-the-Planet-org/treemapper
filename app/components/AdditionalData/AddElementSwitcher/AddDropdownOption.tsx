import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import KeyValueForm from '../KeyValueForm';

interface IAddDropdownOptionFormProps {
  fieldKey?: string;
  fieldValue?: string;
  closeForm: any;
  setDropdownOptions: any;
  dropdownIndex: number | null;
}

const AddDropdownOption = ({
  fieldKey: fieldKeyProps,
  fieldValue: fieldValueProps,
  closeForm,
  setDropdownOptions,
  dropdownIndex,
}: IAddDropdownOptionFormProps) => {
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<string>('');

  useEffect(() => {
    setFieldKey(fieldKeyProps || '');
    setFieldValue(fieldValueProps || '');
  }, [fieldKeyProps, fieldValueProps]);

  const handleOnSubmit = (data: any) => {
    const fieldData = {
      key: data.key,
      value: data.value,
    };
    setDropdownOptions((dropdownOptions: any) => {
      const options = [...dropdownOptions];
      if (dropdownIndex === null) {
        options.push(fieldData);
      } else {
        options[dropdownIndex] = fieldData;
      }
      return options;
    });
    closeForm();
  };

  return (
    <KeyValueForm
      fieldKey={fieldKey}
      fieldValue={fieldValue}
      headingText={i18next.t('label.add_dropdown_option')}
      showPublicToggle={false}
      handleOnSubmit={handleOnSubmit}
      onBackPress={closeForm}
    />
  );
};

export default AddDropdownOption;
