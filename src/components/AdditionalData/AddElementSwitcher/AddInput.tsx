import i18next from 'i18next';
import React from 'react';
import { marginTop24 } from 'src/utils/constants/design';
import { inputOptions, inputTypes } from 'src/utils/constants/additionalConstants';
import Dropdown from 'src/components/common/Dropdown';
import OutlinedInput from 'src/components/common/OutlinedInput';

interface Props {
  isAdvanceModeEnabled: boolean;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  nameError: string;
  fieldKey: string;
  setFieldKey: React.Dispatch<React.SetStateAction<string>>;
  keyError: string;
  defaultValue: string;
  setDefaultValue: React.Dispatch<React.SetStateAction<string>>;
  defaultValueError: string;
  inputType: string;
  setInputType: React.Dispatch<React.SetStateAction<string>>;
  selectedOption: any;
}

export default function AddInput({
  isAdvanceModeEnabled,
  name,
  setName,
  nameError,
  fieldKey,
  setFieldKey,
  keyError,
  defaultValue,
  setDefaultValue,
  defaultValueError,
  inputType,
  setInputType,
  selectedOption,
}: Props) {
  const onInputTypeChange = (value: any) => {
    setInputType(value.key);
  };
  return (
    <>
      <OutlinedInput
        value={name}
        onChangeText={setName}
        label={i18next.t('label.additional_data_field_name')}
        error={nameError}
        style={marginTop24}
      />
      <Dropdown
        label={i18next.t('label.additional_data_field_type')}
        options={inputOptions}
        defaultValue={inputOptions[0]}
        onChange={onInputTypeChange}
        style={marginTop24}
        editable={true}
        selectedOption={selectedOption}
      />
      {isAdvanceModeEnabled ? (
        <>
          <OutlinedInput
            value={fieldKey}
            onChangeText={setFieldKey}
            label={i18next.t('label.additional_data_field_key')}
            error={keyError}
            style={marginTop24}
          />
          <OutlinedInput
            value={defaultValue}
            onChangeText={setDefaultValue}
            label={i18next.t('label.additional_data_default_value')}
            error={defaultValueError}
            style={marginTop24}
            keyboardType={inputType === inputTypes.NUMBER ? 'numeric' : 'default'}
          />
        </>
      ) : (
        []
      )}
    </>
  );
}
