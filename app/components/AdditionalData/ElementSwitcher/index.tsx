import React, { useEffect, useState } from 'react';
import { elementsType } from '../../../utils/additionalDataConstants';
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
}

export default function ElementSwitcher({
  id,
  type,
  name,
  defaultValue,
  editable = false,
  fieldKey,
  setFormValuesCallback,
}: IElementSwitcherProps): JSX.Element {
  const [value, setValue] = useState<any>(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (setFormValuesCallback && type !== elementsType.GAP && type !== elementsType.HEADING) {
      const updatedValue = typeof value === 'boolean' ? (value ? 'yes' : 'no') : value;
      setFormValuesCallback({
        [`${fieldKey}`]: updatedValue,
      });
    }
  }, [value]);

  switch (type) {
    case elementsType.INPUT:
      return (
        <OutlinedInput
          editable={editable}
          label={name}
          value={!editable ? value || ' ' : value}
          onChangeText={(text: any) => setValue(text)}
          key={id}
        />
      );
    case elementsType.DROPDOWN:
      return <Dropdown />;
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
