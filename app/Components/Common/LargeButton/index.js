import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';


const LargeButton = ({ heading, subHeading, active }) => {
    return (
        <View style={[styles.container, active && styles.activeContainer]}>
            <View style={styles.subContainer}>
                <Text style={[styles.heading, active && styles.activeText]}>{heading}</Text>
            </View>
            <View style={styles.subContainer}>
                <Text style={[styles.subHeading, active && styles.activeText]}>{subHeading}</Text>
            </View>
        </View>
    )
}
export default LargeButton;

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: Colors.LIGHT_BORDER_COLOR,
        borderRadius: 10,
        marginVertical: 20,
        justifyContent: 'center',
        paddingVertical: 25
    },
    activeContainer: {
        borderColor: Colors.PRIMARY
    },
    subContainer: {
        marginHorizontal: 25,
        marginVertical: 5
    },
    heading: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_22,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.BLACK,
    },
    activeText: {
        color: Colors.PRIMARY,
    },
    subHeading: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        color: Colors.BLACK,
    },
})