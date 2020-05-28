import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import { arrow_down, arrow_up } from '../../../assets/';
import { Input } from '../';
import Ionicons from 'react-native-vector-icons/MaterialIcons'

const Accordian = ({ data, onChangeText, index, onBlur, onPressDelete, onSubmitEditing }) => {

    const [isOpen, setIsOpen] = useState(true);

    const onPressAccordian = () => setIsOpen(!isOpen)

    const label = data.nameOfTree ? data.nameOfTree : 'Species'
    return (
        <View style={{ marginVertical: 10 }}>
            <View style={styles.container}>
                <View style={{ flexDirection: 'row' }}>
                    <Text numberOfLines={1} style={[styles.label]}>{label}</Text>
                    {!isOpen && <View style={{ flexDirection: 'row', paddingHorizontal: 5 }}>
                        <Text style={styles.treeCount}>{data.treeCount}</Text>
                        <Text style={styles.trees}>Trees</Text>
                    </View>}
                </View>
                <View style={styles.treeCountCont}>
                    {!isOpen ? <View style={{ flexDirection: 'row' }}>
                        <Text onPress={() => onPressDelete(index)} style={styles.simpleText}>Delete</Text>
                        <Text onPress={onPressAccordian} style={[styles.simpleText, styles.primary]}>Edit</Text>
                    </View> :
                        <Ionicons onPress={onPressAccordian} name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={30} style={styles.arrowIcon} />}
                </View>
            </View>
            {
                isOpen && <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 2, marginRight: 10 }}>
                        <Input onSubmitEditing={onSubmitEditing} onBlur={onBlur} placeholder={label} index={index} value={data.nameOfTree} dataKey={'nameOfTree'} onChangeText={onChangeText} label={'Name of trees'} value={data.nameOfTree} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Input onSubmitEditing={onSubmitEditing} onBlur={onBlur} placeholder={'0'} keyboardType={'numeric'} index={index} value={data.treeCount} dataKey={'treeCount'} onChangeText={onChangeText} label={'Tree Count'} value={data.treeCount} />
                    </View>
                </View>
            }
        </View >
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
        justifyContent: 'space-between',
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
        // width: 35, height: 35
        // position : 'absolute',
        color: Colors.TEXT_COLOR,
        marginTop: 5
    },
    simpleText: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_30,
        paddingHorizontal: 5
    },
    primary: {
        color: Colors.PRIMARY
    }
})