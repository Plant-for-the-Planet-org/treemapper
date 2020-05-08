import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';


const LargeButton = ({ heading, subHeading, active, medium, rightIcon, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, active && styles.activeContainer, medium && styles.mediumCont]}>
            <View style={styles.subContainer}>
                <Text style={[styles.heading, active && styles.activeText]}>{heading}</Text>
                {medium && <Text>{rightIcon}</Text>}
            </View>
            {!medium && <View style={styles.subContainer}>
                <Text style={[styles.subHeading, active && styles.activeText]}>{subHeading}</Text>
            </View>}
        </TouchableOpacity>
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
    mediumCont: {
        paddingVertical: 5
    },
    activeContainer: {
        borderColor: Colors.PRIMARY
    },
    subContainer: {
        flexDirection: 'row',
        marginHorizontal: 25,
        marginVertical: 5,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    heading: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.BLACK,
    },
    activeText: {
        color: Colors.PRIMARY,
    },
    subHeading: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        color: Colors.BLACK,
    },
})