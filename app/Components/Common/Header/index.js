import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import { back_icon, close } from '../../../assets'
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'


const Header = ({ hideBackIcon, closeIcon, headingText, subHeadingText, onBackPress }) => {
    const navigation = useNavigation();
    const onPressBack = () => onBackPress ? onBackPress() : navigation.goBack()
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
                {!hideBackIcon && <TouchableOpacity onPress={onPressBack}>
                    <Ionicons name={closeIcon ? 'md-close' : 'md-arrow-back'} size={30} color={Colors.TEXT_COLOR} />
                </TouchableOpacity>}
                <View />
            </View>
            {headingText ? <View style={{ marginVertical: 0 }}>
                <Text style={styles.headerText}>{headingText}</Text>
            </View> : null}
            {subHeadingText && <View style={{ marginVertical: 10, }}>
                <Text style={styles.subHeadingText}>{subHeadingText}</Text>
            </View>}
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