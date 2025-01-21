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

const SelectionLocationType = ({ header, labelOne, labelTwo, disabled, selectedValue, onSelect }: Props) => {
    const isCheckedOne = selectedValue === labelOne.key;

    return (
        <View style={styles.containerType}>
            <View style={styles.wrapperType}>
                <Text style={styles.headerLabelType}>{header}</Text>
                <View style={styles.checkWrapperType}>
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
    containerType: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 25,
        marginTop: 8
    },
    wrapperType: {
        width: '92%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    comingSoonWrapperType: {
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
    comingSoonLabelType: {
        fontSize: scaleFont(10),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT
    },
    headerLabelType: {
        fontSize: scaleFont(14),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        marginBottom: 10
    },
    checkWrapperType: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    }
})