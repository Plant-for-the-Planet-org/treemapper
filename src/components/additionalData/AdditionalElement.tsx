import i18next from "i18next";
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { FormElement } from "src/types/interface/form.interface";
import { Colors, Typography } from "src/utils/constants";
import YeNoElement from "./YeNoElement";
import { scaleSize } from "src/utils/constants/mixins";
import {
    ScaleDecorator,
} from "react-native-draggable-flatlist";
import DragIcon from 'assets/images/svg/DragIcon.svg'

const AdditionalElement = (props: {
    isActive: any,
    drag: any,
    elementDetails: FormElement, form_id: string, pressHandler: (data: FormElement, form_id: string) => void
}) => {
    const { elementDetails, pressHandler, form_id } = props;
    const getDropDownData = (d: any) => {
        return d.map((el, i) => {
            return {
                label: el.key,
                value: el.value,
                index: i
            }
        })
    }
    const renderBody = () => {
        switch (elementDetails.type) {
            case "INPUT":
                return (
                    <View style={styles.wrapper}>
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.keyLabel}>{i18next.t('label.input_element')}</Text>
                            <View style={styles.bodyWrapper}>
                                <Text style={styles.inputWrapper}>
                                    {elementDetails.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case "YES_NO":
                return (
                    <View style={styles.wrapper}>
                        <View style={styles.sectionWrapper} >
                            <Text style={styles.keyLabel}>{i18next.t('label.yes_no_element')}</Text>
                            <View style={styles.bodyWrapper}>
                                <View style={styles.yesNoWrapper}>
                                    <Text style={styles.inputWrapper}>
                                        {elementDetails.label}
                                    </Text>
                                    <YeNoElement />
                                </View>
                            </View>
                        </View>
                    </View>
                )
            case "GAP":
                return (
                    <View style={styles.wrapper}>
                        <View style={styles.gapWrapper} >
                            <Text style={styles.keyLabel}>{i18next.t('label.gap_element')}</Text>
                        </View>
                    </View>
                )
            case "HEADING":
                return (
                    <View style={styles.wrapper}>
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.keyLabel}>{i18next.t('label.heading_element')}</Text>
                            <View style={styles.bodyWrapper}>
                                <Text style={styles.inputWrapper}>
                                    Title: {elementDetails.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case "DROPDOWN":
                return (
                    <View style={styles.wrapper}>
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.keyLabel}>{i18next.t('label.dropdown_element')}</Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                placeholder={elementDetails.label}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={getDropDownData(JSON.parse(elementDetails.dropDownData))}
                                autoScroll
                                maxHeight={250}
                                minHeight={100}
                                labelField="label"
                                valueField="value"
                                onChange={() => { }}
                                fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
                                containerStyle={styles.listContainer}
                                itemTextStyle={styles.itemTextStyle}
                            />
                        </View>
                    </View>
                )
            default:
                return (
                    null
                )
        }
    }

    const editSelection = () => {
        pressHandler(elementDetails, form_id)
    }

    return (
        <ScaleDecorator >
            <View style={styles.container}>
                <TouchableOpacity style={styles.dragIconWrapper} onLongPress={props.drag}
                    disabled={props.isActive} onPress={editSelection}>
                    <DragIcon width={30} height={30} />
                </TouchableOpacity>
                {renderBody()}
            </View>
        </ScaleDecorator >
    )
}

export default AdditionalElement

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginLeft: '2%',
        flexDirection: 'row'
    },
    dragIconWrapper: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    wrapper: {
        flex: 1,
        paddingRight: 30,
        paddingVertical: 10,
    },
    sectionWrapper: {
        paddingBottom: 20,
        paddingLeft: 10,
        borderRadius: 8,
        borderWidth: 0.8,
        borderColor: Colors.GRAY_LIGHT
    },
    gapWrapper: {
        paddingLeft: 10,
        borderRadius: 8,
        borderWidth: 0.8,
        borderColor: Colors.GRAY_LIGHT
    },
    keyLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginVertical: 10
    },
    bodyWrapper: {
        width: "95%",
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: Colors.TEXT_COLOR,
        borderStyle: 'dotted'
    },
    dropdown: {
        height: scaleSize(40),
        borderColor: Colors.GRAY_BORDER,
        borderWidth: 0.5,
        borderRadius: 5,
        width: '95%',
        paddingHorizontal: 8,
    },
    inputWrapper: {
        fontSize: 18,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 10,
        width: '70%'
    },
    yesNoWrapper: {
        width: '100%',
        height: '100%',
        alignItems: "center",
        paddingLeft: 10,
        justifyContent: 'space-between',
        flexDirection: 'row'
    },
    headerLabel: {
        fontSize: 22,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginVertical: 20
    },
    footerWrapper: {
        width: '100%',
        height: 50,
        marginTop: 20
    },
    footerButton: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.TEXT_COLOR,
        width: 100,
        marginLeft: 20

    },
    footerLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deleteWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        // borderWidth: 1,
        // borderColor: 'tomato',
        // borderStyle: 'dashed',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 10,
        marginRight: 20
    },
    deletable: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: 'tomato',
        marginHorizontal: 10,
    },
    placeholderStyle: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        paddingHorizontal: 3,
        color: Colors.TEXT_COLOR
    },
    selectedTextStyle: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    },
    itemTextStyle: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
    listContainer: {
        borderRadius: 12,
        elevation: 5, // This adds a shadow on Android
        shadowColor: 'black', // This adds a shadow on iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
})