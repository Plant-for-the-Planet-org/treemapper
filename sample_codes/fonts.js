import React from 'react'
import { View, Text } from 'react-native'
const Fonts = () => {
    return (
            <View style={{alignItems:'center',justifyContent:'center',height:'100%'}}>
                <Text style={{fontFamily: 'OpenSans-Regular' }}>Regular Text</Text>
                <Text style={{fontFamily: 'OpenSans-Italic' }}>Italic Text</Text>
                <Text style={{fontFamily: 'OpenSans-Light' }}>Light Text</Text>
                <Text style={{fontFamily: 'OpenSans-LightItalic' }}>Light Italic Text</Text>
                <Text style={{fontFamily: 'OpenSans-SemiBold' }}>Semi Bold Text</Text>
                <Text style={{fontFamily: 'OpenSans-SemiBoldItalic' }}>Semi Bold Italic Text</Text>
                <Text style={{fontFamily: 'OpenSans-Bold' }}>Bold Text</Text>
                <Text style={{fontFamily: 'OpenSans-BoldItalic' }}>Bold Italic Text</Text>
                <Text style={{fontFamily: 'OpenSans-ExtraBold' }}>Extra Bold Text</Text>
                <Text style={{fontFamily: 'OpenSans-ExtraBoldItalic' }}>Extra Bold Italic Text</Text>
            </View>
    )
}

export default Fonts
