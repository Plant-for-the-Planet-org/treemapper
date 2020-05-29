import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Colors, Typography } from '_styles';
import { arrow_down, arrow_up } from '../../../assets/';
import { Input, Label } from '../';
import { Accordian } from '../'
import { store } from '../../../Actions/store';
import { addSpeciesAction, updateLastScreen, getInventory, updatePlantingDate } from '../../../Actions'

const LabelAccordian = ({ data, onPressRightText, isEditShow, plantingDate, status }) => {
    const { state } = useContext(store);

    const [species, setSpecies] = useState([])

    useEffect(() => {
        if (data) setSpecies(data)
    }, [])

    const renderSubSpecie = (item, index) => (
        <Accordian onSubmitEditing={onSubmitEditing} onPressDelete={onPressDelete} onBlur={() => onPressContinue(true)} onChangeText={onChangeText} index={index} data={item} shouldExpand={false} status={status} />
    )

    const onChangeText = (text, dataKey, index) => {
        console.log('onChangeText', text, dataKey, index)
        species[index][dataKey] = text;
        setSpecies([...species])
    }

    const onSubmitEditing = () => {
        onPressContinue(true)
    }

    const onPressDelete = (index) => {
        console.log('onPressDelete=', index)
        species.splice(index, 1)
        setSpecies([...species])
    }

    const onPressContinue = (onBlur = false) => {
        onBlur !== true ? onBlur = false : null
        let data = { inventory_id: state.inventoryID, species, plantation_date: `${plantingDate.getTime()}` };
        if (!onBlur) {
            let totalTreeCount = 0
            for (let i = 0; i < species.length; i++) {
                totalTreeCount += Number(species[i].treeCount)
            }
            if (totalTreeCount < 2) {
                alert('Tree count should be greater than one.')
                return;
            }
        }
        console.log('addSpeciesAction reached')
        addSpeciesAction(data).then(() => {
            if (!onBlur) {
                if (route.params?.isEdit) {
                    navigation.navigate('InventoryOverview')
                } else {
                    navigation.navigate('LocateTree')
                }
            }
        })
    }

    const renderSpecieCont = ({ item, index }) => {
        return (<View>
            {renderSubSpecie(item, index)}
        </View>)
    }

    const addSpecies = () => {
        console.log('Add Species')
        species.push({ nameOfTree: '', treeCount: '' })
        setSpecies([...species])
    }
    console.log('species-', species)

    return (
        <View style={{ marginVertical: 10 }}>
            <Label leftText={'Species'} rightText={isEditShow && 'Edit'} onPressRightText={onPressRightText} />
            {species && <FlatList
                data={species}
                renderItem={renderSpecieCont}
            />}
            {status !== 'pending' && <TouchableOpacity onPress={addSpecies}>
                <Text style={styles.addSpecies}>+ Add Species</Text>
            </TouchableOpacity>}
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
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }

})