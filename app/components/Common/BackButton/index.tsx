import React from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../styles';


interface IBackButtonProps {
    onBackPress: (event?: GestureResponderEvent) => void
}

const BackButton = ({ onBackPress }: IBackButtonProps) => {
    return (
        <TouchableOpacity
            onPress={onBackPress}
            style={styles.backIconContainer}>
            <Icon name="chevron-left" size={30} color={Colors.TEXT_COLOR} />
        </TouchableOpacity>
    )
}

export default BackButton

const styles = StyleSheet.create({
    backIconContainer: {
        backgroundColor: Colors.WHITE,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
})
