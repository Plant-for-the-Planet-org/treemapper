import React from 'react'
import { ViewStyle } from 'react-native'
import {Switch as RNSwitch} from 'react-native-switch'

const toggleWidth = 31
const circleSize = 20
const switchWidthMultiplier = toggleWidth / circleSize
const multiplierFix =
  circleSize / ((circleSize * switchWidthMultiplier - circleSize) / 2)

interface Props {
  value: boolean
  onValueChange: () => void
  disabled: boolean
  styles?: ViewStyle
}

const Switch = (props: Props) => {
  const {value, onValueChange, disabled, styles} = props
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      barHeight={13}
      activeText={'On'}
      inActiveText={'Off'}
      containerStyle={{marginHorizontal:10,...styles}}
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
  )
}

export default Switch
