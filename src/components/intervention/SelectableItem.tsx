import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography } from 'src/utils/constants';
import { scaleFont } from 'src/utils/constants/mixins';

interface SelectableItemProps {
    label: { key: string; value: string };
    isChecked: boolean;
    disabled: boolean;
    onSelect: (key: string) => void;
}

const SelectableItem = ({ label, isChecked, disabled, onSelect }: SelectableItemProps) => (
    <Pressable
        style={styles.selectWrapperItem}
        onPress={() => {
            if (!disabled) {
                onSelect(label.key);
            }
        }}
    >
        <View
            style={[
                styles.outerCircleItem,
                { borderColor: isChecked && !disabled ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT }
            ]}
        >
            {isChecked && !disabled && <View style={styles.innerCircleItem} />}
        </View>
        <Text
            style={[
                styles.checkBoxLabelItem,
                { color: isChecked && !disabled ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }
            ]}
        >
            {label.value}
        </Text>
    </Pressable>
);

export default SelectableItem;


const styles = StyleSheet.create({
    selectWrapperItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    outerCircleItem: {
        width: 18,
        height: 18,
        justifyContent: "center",
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.TEXT_COLOR
    },
    innerCircleItem: {
        width: 10,
        height: 10,
        borderRadius: 20,
        backgroundColor: Colors.NEW_PRIMARY
    },
    checkBoxLabelItem: {
        fontSize: scaleFont(16),
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingHorizontal: 10
    }
})