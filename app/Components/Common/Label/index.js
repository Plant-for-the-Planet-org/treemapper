import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import { back_icon, close } from '../../../assets'


const Label = ({ leftText, rightText }) => {
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
                <View>
                    <Text style={styles.leftText}>{leftText}</Text>
                </View>
                <View>
                    <Text style={styles.rightText}>{rightText}</Text>
                </View>
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