import React from 'react'
import {Text} from 'react-native'
import AwesomeButton from "react-native-really-awesome-button";
import {Mixins, Colors} from '_styles'
const PrimaryButton = (props) => {

    return (
        <AwesomeButton
            progress
            onPress={next => {
                props.onPress()
                next();
            }}
            backgroundColor={'#89B53A'}
            raiseLevel={2}
            backgroundDarker={'#6E9A21'}
            height={Mixins.scaleSize(52)}
            width={Mixins.scaleSize(312)}
            style={{
                height:Mixins.scaleSize(52),
                width:Mixins.scaleSize(312)
            }}
            borderRadius={26}
            >
            <Text style={{fontFamily:'OpenSans-Bold', fontSize:Mixins.scaleFont(15),color:Colors.WHITE}}>
                {props.buttonText}
            </Text>  
        </AwesomeButton>
    )
}

export default PrimaryButton
