import React, { useEffect, useState } from 'react';
import { elementsType, inputTypes } from '../../../utils/additionalDataConstants';
import Dropdown from '../../Common/Dropdown';
import OutlinedInput from '../../Common/OutlinedInput';
import YesNoButton from '../../Common/YesNoButton';
import GapElement from './GapElement';
import Heading from './Heading';

interface IElementSwitcherProps {
  id: string;
  type: any;
  name: string;
  defaultValue: any;
  editable: boolean;
  fieldKey?: string;
  setFormValuesCallback?: any;
  error?: string;
  dropdownOptions?: any;
  inputType?: string;
  accessType?: string;
}

export default function ElementSwitcher({
  id,
  type,
  name,
  defaultValue,
  editable = false,
  fieldKey,
  setFormValuesCallback,
  error,
  dropdownOptions,
  inputType,
  accessType,
}: IElementSwitcherProps): JSX.Element {
  const [value, setValue] = useState<any>(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (setFormValuesCallback && type !== elementsType.GAP && type !== elementsType.HEADING) {
      const updatedValue = typeof value === 'boolean' ? (value ? 'yes' : 'no') : value;
      setFormValuesCallback(
        {
          [`${fieldKey}`]: updatedValue,
        },
        {
          [`${fieldKey}`]: accessType,
        },
      );
    }
  }, [value]);

  switch (type) {
    case elementsType.INPUT:
      const inputValue = !editable ? value || '' : value;
      return (
        <OutlinedInput
          editable={editable}
          label={name}
          value={inputValue}
          onChangeText={(text: any) => setValue(text)}
          key={id}
          error={error}
          keyboardType={inputType === inputTypes.NUMBER ? 'numeric' : 'default'}
        />
      );
    case elementsType.DROPDOWN:
      return (
        <Dropdown
          defaultValue={defaultValue}
          editable={editable}
          options={dropdownOptions}
          label={name}
          onChange={(option: any) => setValue(option.value)}
          error={error}
        />
      );
    case elementsType.HEADING:
      return <Heading text={name} />;
    case elementsType.YES_NO:
      return (
        <YesNoButton text={name} isAgreed={!!value} setIsAgreed={setValue} editable={editable} />
      );
    case elementsType.GAP:
      return <GapElement editable={editable} />;
    default:
      return <></>;
  }
}
