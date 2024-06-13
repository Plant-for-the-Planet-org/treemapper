import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Typography, Colors } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { SCALE_18 } from 'src/utils/constants/spacing';
import { PLOT_COMPLEXITY, PLOT_SHAPE, PLOT_TYPE } from 'src/types/type/app.type';


interface Props {
    header: string
    labelOne: {
        key: PLOT_COMPLEXITY | PLOT_SHAPE | PLOT_TYPE
        value: string
    }
    labelTwo: {
        key: PLOT_COMPLEXITY | PLOT_SHAPE | PLOT_TYPE
        value: string
    },
    disabled: boolean,
    selectedValue: string,
    onSelect: (v: PLOT_COMPLEXITY | PLOT_SHAPE | PLOT_TYPE) => void
}

const CreatePlotCard = (props: Props) => {
    const { header, labelOne, labelTwo, disabled, selectedValue, onSelect } = props;
    const isCheckedOne = selectedValue === labelOne.key
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                {disabled && <View style={styles.comingSoonWrapper}>
                    <Text style={styles.comingSoonLabel}>Coming Soon</Text>
                </View>}
                <Text style={styles.headerLabel}>
                    {header}
                </Text>
                <View style={styles.checkWrapper}>
                    <Pressable style={styles.selectWrapper} onPress={
                        () => {
                            onSelect(labelOne.key)
                        }
                    }>
                        <BouncyCheckbox
                            disabled={disabled}
                            size={SCALE_18} fillColor={disabled ? Colors.LIGHT_BORDER_COLOR : Colors.NEW_PRIMARY}
                            unFillColor={disabled ? Colors.GRAY_LIGHT : Colors.WHITE}
                            style={styles.checkBox}
                            isChecked={isCheckedOne}
                            onPress={
                                () => {
                                    onSelect(labelOne.key)
                                }
                            }
                        />
                        <Text style={[styles.checkBoxLable, { color: isCheckedOne ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }]}>
                            {labelOne.value}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.selectWrapper} onPress={
                        () => {
                            onSelect(labelTwo.key)
                        }
                    }>
                        <BouncyCheckbox disabled={disabled}
                            unFillColor={disabled ? Colors.GRAY_LIGHT : Colors.WHITE}
                            isChecked={!isCheckedOne}
                            
                            size={SCALE_18} fillColor={disabled ? Colors.LIGHT_BORDER_COLOR : Colors.NEW_PRIMARY} style={styles.checkBox}
                            onPress={() => {
                                onSelect(labelTwo.key)
                            }}
                        />
                        <Text style={[styles.checkBoxLable, { color: !isCheckedOne ? Colors.DARK_TEXT_COLOR : Colors.TEXT_LIGHT }]}>
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
        backgroundColor: Colors.NEW_PRIMARY + '1A',
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
        color: Colors.NEW_PRIMARY
    },
    headerLabel: {
        fontSize: scaleFont(16),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
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
    checkBoxLable: {
        fontSize: scaleFont(17),
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingHorizontal: 10
    },
    checkBox: {
        width: 20
    }
})