import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';
 
const DateInput = ({ label, date }) => {
    return (
        <View>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.dateContainer}>
                <Text style={styles.date}>{date}</Text>
            </View>
        </View>
    )
}
export default DateInput

const styles = StyleSheet.create({
    label: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
    },
    date: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM
    },
    dateContainer: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.TEXT_COLOR,
    }
})