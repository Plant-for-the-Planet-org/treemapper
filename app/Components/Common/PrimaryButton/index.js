import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';


const PrimaryButton = ({ btnText, theme , halfWidth}) => {
    const isWhiteTheme = theme == 'white';
    return (
        <TouchableOpacity style={[styles.container, isWhiteTheme && styles.whiteTheme , halfWidth && styles.halfWidth]}>
            <Text style={[styles.btnText, isWhiteTheme && styles.primaryText]}>{btnText}</Text>
        </TouchableOpacity>
    )
}
export default PrimaryButton;

const styles = StyleSheet.create({
    container: {
        height : 60,
        paddingVertical: 18,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        // marginHorizontal : 10,
        // flex : 1,    
    },
    whiteTheme: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        borderWidth: 1,
    },
    primaryText: {
        color : Colors.PRIMARY
    },
    btnText: {
        color: Colors.WHITE,
        fontSize: Typography.FONT_SIZE_18,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD
    },
    halfWidth :{
        width : '47%'
    }
})