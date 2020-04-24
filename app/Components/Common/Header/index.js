import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import { back_icon } from '../../../assets'


const Header = ({ leftIcon, headingText, subHeadingText }) => {
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
                <TouchableOpacity>
                    <Image source={back_icon} />
                </TouchableOpacity>
                <View />
            </View>
            <View style={{ marginVertical: 10 }}>
                <Text style={styles.headerText}>{headingText}</Text>
            </View>
            <View style={{ marginVertical: 10, }}>
                <Text style={styles.subHeadingText}>{subHeadingText}</Text>
            </View>
        </View>
    )
}
export default Header

const styles = StyleSheet.create({
    headerText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_27,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_BOLD
    },
    subHeadingText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_REGULAR,
    },
    backArrow: {

    }

})