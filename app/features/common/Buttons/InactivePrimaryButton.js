import React from 'react'
import {Text} from 'react-native'
import AwesomeButton from "react-native-really-awesome-button";
import {Mixins, Colors} from '_styles'
const InactivePrimaryButton = (props) => {

    return (
        <AwesomeButton
            progress
            onPress={next => {
                next();
            }}
            disabled
            backgroundColor={'#BFBFBF'}
            raiseLevel={0}
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

export default InactivePrimaryButton
