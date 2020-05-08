import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import { arrow_down, arrow_up } from "../../../assets/";
import { Input } from '../';


const Accordian = ({ data }) => {

    const [isOpen, setIsOpen] = useState(false);

    const onPressAccordian = () => setIsOpen(!isOpen)

    return (
        <View style={{ marginVertical: 10 }}>
            <TouchableOpacity onPress={onPressAccordian} style={styles.container}>
                <Text style={styles.label}>{data.nameOfTree}</Text>
                <View style={styles.treeCountCont}>
                    {!isOpen && <>
                        <Text style={styles.treeCount}>{data.treeCount}</Text>
                        <Text style={styles.trees}>Trees</Text>
                    </>}
                    <Image source={isOpen ? arrow_up : arrow_down} style={styles.arrowIcon} />
                </View>
            </TouchableOpacity>
            {isOpen && <>
                <Input label={'Name of trees'} value={data.nameOfTree} />
                <Input label={'Tree Count'} value={data.treeCount} />
            </>}
        </View>
    )
}
export default Accordian;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 5,
        justifyContent: 'space-between',

    },
    treeCountCont: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    label: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_22,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
    },
    treeCount: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_22,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.PRIMARY,
    },
    trees: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        marginHorizontal: 5
    },
    arrowIcon: {
        width: 35, height: 35
    }

})