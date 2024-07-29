import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SelectableItem from './SelectableItem';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Typography } from 'src/utils/constants';
import { scaleFont } from 'src/utils/constants/mixins';

interface Props {
    header: string;
    labelOne: { key: string; value: string };
    labelTwo: { key: string; value: string };
    disabled: boolean;
    selectedValue: string;
    onSelect: (key: "Polygon" | "Point") => void;
}

const SelectionLocationType: React.FC<Props> = ({ header, labelOne, labelTwo, disabled, selectedValue, onSelect }) => {
    const isCheckedOne = selectedValue === labelOne.key;

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Text style={styles.headerLabel}>{header}</Text>
                <View style={styles.checkWrapper}>
                    <SelectableItem
                        label={labelOne}
                        isChecked={isCheckedOne}
                        disabled={disabled}
                        onSelect={onSelect}
                    />
                    <SelectableItem
                        label={labelTwo}
                        isChecked={!isCheckedOne}
                        disabled={disabled}
                        onSelect={onSelect}
                    />
                </View>
            </View>
        </View>
    );
};

export default SelectionLocationType;


const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 25,
        marginTop: 8
    },
    wrapper: {
        width: '92%',
        height: 50,
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