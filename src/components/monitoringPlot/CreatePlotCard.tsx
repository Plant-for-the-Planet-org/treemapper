import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Typography, Colors } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import {PlotAttributes } from 'src/types/type/app.type';
import i18next from 'src/locales/index'


interface Props {
    header: string
    labelOne: {
        key: PlotAttributes
        value: string
    }
    labelTwo: {
        key: PlotAttributes
        value: string
    },
    disabled: boolean,
    selectedValue: string,
    onSelect: (v: PlotAttributes) => void
}

const CreatePlotCard = (props: Props) => {
    const { header, labelOne, labelTwo, disabled, selectedValue, onSelect } = props;
    const isCheckedOne = selectedValue === labelOne.key
    return (
        <View style={styles.container}>
            <View style={[styles.wrapper, { backgroundColor: disabled ? Colors.GRAY_LIGHT : Colors.WHITE }]}>
                {disabled && <View style={styles.comingSoonWrapper}>
                    <Text style={styles.comingSoonLabel}>{i18next.t('label.coming_soon')}</Text>
                </View>}
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

export default CreatePlotCard

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '19%',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: '3%'
    },
    wrapper: {
        width: '90%',
        height: "90%",
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderColor: Colors.SHADOW_BORDER,
        shadowColor: Colors.GRAY_TEXT,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
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
        fontSize: scaleFont(16),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        marginBottom:10
    },
    checkWrapper: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: '5%',
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