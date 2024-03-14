import i18next from 'i18next';
import React from 'react';
import { marginTop24 } from 'src/utils/constants/design';
import OutlinedInput from 'src/components/common/OutlinedInput';

interface Props {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  nameError: string;
}

export default function AddHeading({ name, setName, nameError }: Props) {
  return (
    <>
      <OutlinedInput
        value={name}
        onChangeText={setName}
        label={i18next.t('label.additional_data_heading')}
        error={nameError}
        style={marginTop24}
      />
    </>
  );
}
