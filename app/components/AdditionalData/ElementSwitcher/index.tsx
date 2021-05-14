import React from 'react';
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
}

export default function ElementSwitcher({
  id,
  type,
  name,
  defaultValue,
  editable = false,
}: IElementSwitcherProps): JSX.Element {
  switch (type) {
    case elementsType.INPUT:
      return (
        <OutlinedInput editable={editable} label={name} value={defaultValue || ' '} key={id} />
      );
    case elementsType.DROPDOWN:
      return <Dropdown />;
    case elementsType.HEADING:
      return <Heading text={name} />;
    case elementsType.YES_NO:
      return <YesNoButton text={name} isAgreed={defaultValue} editable={editable} />;
    case elementsType.GAP:
      return <GapElement />;
    default:
      return <></>;
  }
}
