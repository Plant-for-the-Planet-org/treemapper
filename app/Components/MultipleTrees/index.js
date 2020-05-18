import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addSpeciesAction, updateLastScreen, getInventory } from '../../Actions'
import { store } from '../../Actions/store';

const MultipleTrees = ({ navigation, route }) => {

    const { state } = useContext(store);

    const [plantingDate, setPlantingDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [species, setSpecies] = useState([{ nameOfTree: '', treeCount: '' }]);

    useEffect(() => {
        initialState()
    }, [])
    useEffect(() => onPressContinue(true), [plantingDate])

    const initialState = () => {
        getInventory({ inventoryID: state.inventoryID }).then((data) => {
            if (data.plantation_date) {
                setPlantingDate(new Date(Number(data.plantation_date)))
                setSpecies(Object.values(data.species))
            }
        })
        if (route.params?.isEdit) {
        } else {
            let data = { inventory_id: state.inventoryID, last_screen: 'MultipleTrees' }
            updateLastScreen(data)
        }
    }

    const onChangeDate = (event, selectedDate) => {
        setShowDate(false)
        setPlantingDate(selectedDate);
    };

    const renderDatePicker = () => {
        return (
            showDate && <DateTimePicker
                testID="dateTimePicker"
                timeZoneOffsetInMinutes={0}
                value={plantingDate}
                mode={'date'}
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
            />
        )
    }

    const addSpecies = () => {
        species.push({ nameOfTree: '', treeCount: '' })
        setSpecies([...species])
    }

    const onChangeText = (text, dataKey, index) => {
        species[index][dataKey] = text;
        setSpecies([...species])
    }

    const renderOneSpecies = (item, index) => {
        return (<Accordian onBlur={() => onPressContinue(true)} onChangeText={onChangeText} index={index} data={item} />)
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
                alert('Tree COunt should be greater than 1')
                return;
            }
        }
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
                <TouchableOpacity onPress={() => setShowDate(true)}>
                    <Input editable={false} value={new Date(plantingDate).toLocaleDateString()} label={'Planting Date'} />
                </TouchableOpacity>
                <FlatList
                    data={species}
                    renderItem={({ item, index }) => renderOneSpecies(item, index)}
                />
                <TouchableOpacity onPress={addSpecies}>
                    <Text style={styles.addSpecies}>+ Add Species</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                {renderDatePicker()}
            </ScrollView>
            <PrimaryButton onPress={onPressContinue} btnText={'Save & Continue'} />
        </SafeAreaView>
    )
}
export default MultipleTrees;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})