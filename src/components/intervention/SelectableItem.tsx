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

const SelectableItem: React.FC<SelectableItemProps> = ({ label, isChecked, disabled, onSelect }) => (
    <Pressable
        style={styles.selectWrapper}
        onPress={() => {
            if (!disabled) {
                onSelect(label.key);
            }
        }}
    >
        <View
            style={[
                styles.outerCircle,
                { borderColor: isChecked && !disabled ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT }
            ]}
        >
            {isChecked && !disabled && <View style={styles.innerCircle} />}
        </View>
        <Text
            style={[
                styles.checkBoxLabel,
                { color: isChecked && !disabled ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }
            ]}
        >
            {label.value}
        </Text>
    </Pressable>
);

export default SelectableItem;


const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom:25,
        marginTop:8
    },
    wrapper: {
        width: '92%',
        height:50,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    comingSoonWrapper: {
        position: 'absolute',
        top: 0,
        right: '6%',
        backgroundColor: Colors.GRAY_BACKDROP,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
    comingSoonLabel: {
        fontSize: scaleFont(10),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT
    },
    headerLabel: {
        fontSize: scaleFont(14),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        marginBottom: 10
    },
    checkWrapper: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    outerCircle: {
        width: 18,
        height: 18,
        justifyContent: "center",
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.TEXT_COLOR
    },
    innerCircle: {
        width: 10,
        height: 10,
        borderRadius: 20,
        backgroundColor: Colors.NEW_PRIMARY
    },
    checkBoxLabel: {
        fontSize: scaleFont(16),
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingHorizontal: 10
    },
    checkBox: {
        width: 20
    }
})