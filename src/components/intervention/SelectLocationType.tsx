import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Typography, Colors } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'


interface Props {
    header: string
    labelOne: {
        key: 'Polygon' | 'Point'
        value: string
    }
    labelTwo: {
        key: 'Polygon' | 'Point'
        value: string
    },
    disabled: boolean,
    selectedValue: string,
    onSelect: (v: 'Polygon' | 'Point') => void
}

const SelectionLocationType = (props: Props) => {
    const { header, labelOne, labelTwo, disabled, selectedValue, onSelect } = props;
    const isCheckedOne = selectedValue === labelOne.key
    return (
        <View style={styles.container}>
            <View style={[styles.wrapper]}>
                <Text style={styles.headerLabel}>
                    {header}
                </Text>
                <View style={styles.checkWrapper}>
                    <Pressable style={styles.selectWrapper} onPress={
                        () => {
                            if (!disabled) {
                                onSelect(labelOne.key)
                            }
                        }
                    }>
                        <View style={[styles.outerCircle, { borderColor: isCheckedOne && !disabled ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT }]}>
                            {isCheckedOne && !disabled ? <View style={styles.innerCircle}></View> : null}
                        </View>
                        <Text style={[styles.checkBoxLabel, { color: isCheckedOne && !disabled ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }]}>
                            {labelOne.value}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.selectWrapper} onPress={
                        () => {
                            if (!disabled) {
                                onSelect(labelTwo.key)
                            }
                        }
                    }>
                        <View style={[styles.outerCircle, { borderColor: !isCheckedOne ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT }]}>
                            {!isCheckedOne && <View style={styles.innerCircle}></View>}
                        </View>
                        <Text style={[styles.checkBoxLabel, { color: !isCheckedOne ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }]}>
                            {labelTwo.value}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}

export default SelectionLocationType

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