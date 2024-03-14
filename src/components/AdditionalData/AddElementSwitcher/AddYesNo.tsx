import i18next from 'i18next';
import React from 'react';
import { marginTop24, marginTop30 } from 'src/utils/constants/design';
import OutlinedInput from 'src/components/common/OutlinedInput';
import YesNoButton from 'src/components/common/YesNoButton';

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
}

export default function AddYesNo({
  isAdvanceModeEnabled,
  name,
  setName,
  nameError,
  fieldKey,
  setFieldKey,
  keyError,
  defaultValue,
  setDefaultValue,
}: Props) {
  return (
    <>
      <OutlinedInput
        value={name}
        onChangeText={setName}
        label={i18next.t('label.additional_data_field_name')}
        error={nameError}
        style={marginTop30}
      />
      {isAdvanceModeEnabled ? (
        <>
          <OutlinedInput
            value={fieldKey}
            onChangeText={setFieldKey}
            label={i18next.t('label.additional_data_field_key')}
            error={keyError}
            style={marginTop30}
          />
          <YesNoButton
            isAgreed={!!defaultValue}
            setIsAgreed={setDefaultValue}
            text={i18next.t('label.additional_data_default_value')}
            containerStyle={marginTop24}
          />
        </>
      ) : (
        []
      )}
    </>
  );
}
