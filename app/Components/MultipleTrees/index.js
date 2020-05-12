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

    useEffect(() => {
        initialState()
    }, [])

    const initialState = () => {
        // let isEditFlag = navigation.getPara
        if (route.params?.isEdit) {
            getInventory({ inventoryID: state.inventoryID }).then((data) => {
                setPlantingDate(new Date(Number(data.plantation_date)))
                setSpecies(Object.values(data.species))
            })
        } else {
            let data = { inventory_id: state.inventoryID, last_screen: 'MultipleTrees' }
            updateLastScreen(data)
        }
    }

    const [plantingDate, setPlantingDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [species, setSpecies] = useState([{ nameOfTree: 'Species', treeCount: '0' }]);

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
        species.push({ nameOfTree: 'Species', treeCount: '0' })
        setSpecies([...species])
    }

    const onChangeText = (text, dataKey, index) => {
        console.log(text, dataKey, index, 'Tre ')
        species[index][dataKey] = text;
        setSpecies([...species])
    }

    const renderOneSpecies = (item, index) => {
        return (<Accordian onChangeText={onChangeText} index={index} data={item} />)
    }

    const onPressContinue = () => {
        let data = { inventory_id: state.inventoryID, species, plantation_date: `${plantingDate.getTime()}` };
        addSpeciesAction(data).then(() => {
            if (route.params?.isEdit) {
                navigation.navigate('InventoryOverview')
            } else {
                navigation.navigate('LocateTree')
            }
        })
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                <PrimaryButton onPress={onPressContinue} btnText={'Save & Continue'} />
                {renderDatePicker()}
            </ScrollView>
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