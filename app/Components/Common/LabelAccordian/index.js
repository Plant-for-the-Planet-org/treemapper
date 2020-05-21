import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Colors, Typography } from '_styles';
import { arrow_down, arrow_up } from '../../../assets/';
import { Input, Label } from '../';


const LabelAccordian = ({ data, onPressRightText }) => {

    const renderSubSpecie = (item) => (
        <TouchableOpacity style={styles.oneSpecieCont}>
            <Text style={styles.label}>{item.nameOfTree ? item.nameOfTree : 'Species'}</Text>
            <View style={styles.treeCountCont}>
                <>
                    <Text style={styles.treeCount}>{item.treeCount}</Text>
                    <Text style={styles.trees}>Trees</Text>
                </>
            </View>
        </TouchableOpacity>
    )

    const renderSpecieCont = ({ item, index }) => {
        return (<View>
            {renderSubSpecie(item)}
        </View>)
    }

    return (
        <View style={{ marginVertical: 10 }}>
            <Label leftText={'Species'} rightText={'Edit'} onPressRightText={onPressRightText} />
            <FlatList
                data={data}
                renderItem={renderSpecieCont}
            />
        </View>
    )
}
export default LabelAccordian;

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
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
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
    },
    oneSpecieCont: {
        flexDirection: 'row',
        paddingVertical: 5,
        justifyContent: 'space-between',
        marginLeft: 25
    }

})