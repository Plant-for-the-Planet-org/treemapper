import React from 'react';
import { elementsType } from '../../../utils/additionalDataConstants';
import AddDropdown from './AddDropdown';
import AddHeading from './AddHeading';
import AddInput from './AddInput';
import AddYesNo from './AddYesNo';

interface IAddElementSwitcherProps {
  elementType: any;
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
  dropdownOptions: any;
  setDropdownOptions: any;
  inputType: string;
  setInputType: React.Dispatch<React.SetStateAction<string>>;
}

export default function AddElementSwitcher({
  elementType,
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
  dropdownOptions,
  setDropdownOptions,
  inputType,
  setInputType,
}: IAddElementSwitcherProps): JSX.Element {
  switch (elementType) {
    case elementsType.INPUT:
      return (
        <AddInput
          isAdvanceModeEnabled={isAdvanceModeEnabled}
          name={name}
          setName={setName}
          nameError={nameError}
          fieldKey={fieldKey}
          setFieldKey={setFieldKey}
          keyError={keyError}
          defaultValue={defaultValue}
          setDefaultValue={setDefaultValue}
          defaultValueError={defaultValueError}
          inputType={inputType}
          setInputType={setInputType}
        />
      );
    case elementsType.DROPDOWN:
      return (
        <AddDropdown
          isAdvanceModeEnabled={isAdvanceModeEnabled}
          name={name}
          setName={setName}
          nameError={nameError}
          fieldKey={fieldKey}
          setFieldKey={setFieldKey}
          keyError={keyError}
          dropdownOptions={dropdownOptions}
          setDropdownOptions={setDropdownOptions}
        />
      );
    case elementsType.HEADING:
      return <AddHeading name={name} setName={setName} nameError={nameError} />;
    case elementsType.YES_NO:
      return (
        <AddYesNo
          isAdvanceModeEnabled={isAdvanceModeEnabled}
          name={name}
          setName={setName}
          nameError={nameError}
          fieldKey={fieldKey}
          setFieldKey={setFieldKey}
          keyError={keyError}
          defaultValue={defaultValue}
          setDefaultValue={setDefaultValue}
          defaultValueError={defaultValueError}
        />
      );
    default:
      return <></>;
  }
}
