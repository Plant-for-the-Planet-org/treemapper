import i18next from 'i18next'
import React from 'react'
import {marginTop24} from 'src/utils/constants/design'
import OutlinedInput from 'src/components/common/OutlinedInput'

interface IAddDropdownProps {
  isAdvanceModeEnabled: boolean
  name: string
  setName: React.Dispatch<React.SetStateAction<string>>
  nameError: string
  fieldKey: string
  setFieldKey: React.Dispatch<React.SetStateAction<string>>
  keyError: string
  dropdownOptions: unknown
  setDropdownOptions: React.Dispatch<React.SetStateAction<string>>
}

export default function AddDropdown({
  isAdvanceModeEnabled,
  name,
  setName,
  nameError,
  fieldKey,
  setFieldKey,
  keyError,
}: IAddDropdownProps) {
  return (
    <>
      <OutlinedInput
        value={name}
        onChangeText={setName}
        label={i18next.t('label.additional_data_field_name')}
        error={nameError}
        style={marginTop24}
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
        </>
      ) : (
        []
      )}
    </>
  )
}
