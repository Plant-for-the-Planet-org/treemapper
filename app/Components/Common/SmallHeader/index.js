
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacit } from 'react-native';
import { Colors, Typography } from '_styles';
import { back_icon, close, upload_now, upload_check } from '../../../assets'

const SmallHeader = ({ leftText, rightText, rightTheme, icon }) => {
    icon == 'upload_now' ? upload_now : upload_check
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.subHeadingText}>{leftText}</Text>
            <View>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.uploadNowBtn, styles.activeText]}>{rightText}</Text>
                    <Image source={icon} />
                </View>
            </View>
        </View>
    )
}
export default SmallHeader

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
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_REGULAR,
    },
    activeText: {
        color: Colors.PRIMARY,
    },
    uploadNowBtn: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_24,
        fontWeight: Typography.FONT_WEIGHT_REGULAR,
        paddingHorizontal: 10
    }
})




