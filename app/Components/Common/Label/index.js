import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TouchableHighlight } from 'react-native';
import { Colors, Typography } from '_styles';
import { back_icon, close } from '../../../assets'


const Label = ({ leftText, rightText, onPressRightText }) => {
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
                <View>
                    <Text style={styles.leftText}>{leftText}</Text>
                </View>
                <TouchableOpacity onPress={onPressRightText}>
                    <Text style={styles.rightText}>{rightText}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
export default Label

const styles = StyleSheet.create({
    headerText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_27,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_BOLD
    },
    leftText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_BOLD,
    },
    rightText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.PRIMARY,
        fontWeight: Typography.FONT_WEIGHT_REGULAR,
    },
    backArrow: {

    }

})