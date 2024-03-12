import React from 'react'
import {Text, TextStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

interface GradientTextProps extends TextStyle {
  children: React.ReactNode
  style: TextStyle
}

const GradientText: React.FC<GradientTextProps> = ({children, ...rest}) => {
  return (
    <MaskedView maskElement={<Text {...rest}>{children}</Text>}>
      <LinearGradient colors={['#007A49', '#348F39', '#68B030']}>
        <Text {...rest} style={[{opacity: 0, ...rest}]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  )
}

export default GradientText
