import React from 'react';
import { Switch as RNSwitch } from 'react-native-switch';

import { Colors } from '../../../styles';

const toggleWidth = 31;
const circleSize = 18;
const switchWidthMultiplier = toggleWidth / circleSize;
const multiplierFix = circleSize / ((circleSize * switchWidthMultiplier - circleSize) / 2);

const Switch = ({ value = false, onValueChange, disabled = false }) => (
  <RNSwitch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    activeText={'On'}
    inActiveText={'Off'}
    barHeight={12}
    circleSize={circleSize}
    switchLeftPx={multiplierFix}
    switchRightPx={multiplierFix}
    switchWidthMultiplier={switchWidthMultiplier}
    circleBorderWidth={3}
    backgroundActive={'#68B0308A'}
    backgroundInactive={'#BDBDBD8A'}
    circleActiveColor={'#007A49'}
    circleInActiveColor={'#828282'}
    changeValueImmediately={true} // if rendering inside circle, change state immediately or wait for animation to complete
    innerCircleStyle={{
      borderWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
    }} // style for inner animated circle for what you (may) be rendering inside the circle
    outerCircleStyle={{}} // style for outer animated circle
    renderActiveText={false}
    renderInActiveText={false}
    switchBorderRadius={30} // Sets the border Radius of the switch slider. If unset, it remains the circleSize.
  />
);

export default Switch;
