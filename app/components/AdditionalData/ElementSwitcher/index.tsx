import React from 'react';
import { marginTop24 } from '../../../styles/design';
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
  fieldKey: string;
  defaultValue: any;
  dropdownOptions: any;
}

export default function ElementSwitcher({
  id,
  type,
  name,
  fieldKey,
  defaultValue,
  dropdownOptions,
}: IElementSwitcherProps): JSX.Element {
  switch (type) {
    case elementsType.INPUT:
      return <OutlinedInput editable={false} label={name} key={id} style={marginTop24} />;
    case elementsType.DROPDOWN:
      return <Dropdown />;
    case elementsType.HEADING:
      return <Heading text={name} />;
    case elementsType.YES_NO:
      return (
        <YesNoButton
          text={name}
          isAgreed={defaultValue}
          editable={false}
          containerStyle={marginTop24}
        />
      );
    case elementsType.GAP:
      return <GapElement />;
    default:
      return <></>;
  }
}
