import React from 'react';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';

interface IIconSwitcherProps {
  name: string;
  size: number;
  color: string;
  style?: any;
  iconType: 'MCIcon' | 'FA5Icon' | 'FAIcon';
}

const IconSwitcher = ({ name, size, color, style = {}, iconType }: IIconSwitcherProps) => {
  switch (iconType) {
    case 'MCIcon':
      return <MCIcon name={name} size={size} color={color} style={style} />;
    case 'FAIcon':
      return <FAIcon name={name} size={size} color={color} style={style} />;
    case 'FA5Icon':
      return <FA5Icon name={name} size={size} color={color} style={style} />;
    default:
      return <></>;
  }
};

export default IconSwitcher;
