import React from 'react'
import {Text, TextStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { Colors } from 'src/utils/constants'
//Delete this component
interface GradientTextProps extends TextStyle {
  children: React.ReactNode
  style: TextStyle
}

const GradientText: React.FC<GradientTextProps> = ({children, style}) => {
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={[Colors.PRIMARY_DARK, Colors.LINEAR_INTERMEDIATE, Colors.PRIMARY]}>
        <Text style={[{opacity: 0, ...style}]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  )
}

export default GradientText
