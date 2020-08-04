import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Header, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addSpeciesAction, updateLastScreen, getInventory, updatePlantingDate } from '../../Actions'
import { store } from '../../Actions/store';

const MultipleTrees = ({ navigation, route }) => {

    const { state } = useContext(store);

    const [plantingDate, setPlantingDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [species, setSpecies] = useState([{ nameOfTree: '', treeCount: '' }]);

    useEffect(() => {
        initialState()
    }, [])

    const initialState = () => {
        let data = { inventory_id: state.inventoryID, last_screen: 'MultipleTrees' }
        updateLastScreen(data)
        getInventory({ inventoryID: state.inventoryID }).then((data) => {
            if (data.plantation_date) {
                setPlantingDate(new Date(Number(data.plantation_date)))
                setSpecies(Object.values(data.species))
            }
        })
    }

    const onChangeDate = (event, selectedDate) => {
        setShowDate(false)
        setPlantingDate(selectedDate);
        updatePlantingDate({ inventory_id: state.inventoryID, plantation_date: `${selectedDate.getTime()}` })
    };

    const renderDatePicker = () => {
        return (
            showDate && <DateTimePicker
                maximumDate={new Date()}
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

    const onPressDelete = (index) => {
        species.splice(index, 1)
        setSpecies([...species])
    }

    const onSubmitEditing = () => {
        onPressContinue(true)
    }

    const renderOneSpecies = (item, index) => {
        return (<Accordian onSubmitEditing={onSubmitEditing} onPressDelete={onPressDelete} onBlur={() => onPressContinue(true)} onChangeText={onChangeText} index={index} data={item} shouldExpand={species.length - 1 == index} />)
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

    let totalTreeCount = 0
    for (let i = 0; i < species.length; i++) {
        totalTreeCount += Number(species[i].treeCount)
    }

    let shouldDisable = totalTreeCount < 2
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <ScrollView keyboardShouldPersistTaps={'always'} style={styles.cont} showsVerticalScrollIndicator={false}>
                    <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
                    <TouchableOpacity onPress={() => setShowDate(true)} accessible={true} accessibilityLabel="Planting Date" testID="planting_date">
                        <Input editable={false} value={new Date(plantingDate).toLocaleDateString()} label={'Planting Date'} />
                    </TouchableOpacity>
                    {renderDatePicker()}
                    <FlatList
                        keyboardShouldPersistTaps={'always'}
                        data={species}
                        renderItem={({ item, index }) => renderOneSpecies(item, index)}
                    />
                    <TouchableOpacity onPress={addSpecies} accessibilityLabel="Add Species" testID="add_species" accessible={true}>
                        <Text style={styles.addSpecies}>+ Add Species</Text>
                    </TouchableOpacity>
                    <View style={styles.cont} />
                </ScrollView>
                <PrimaryButton disabled={shouldDisable} onPress={onPressContinue} btnText={'Save & Continue'} />
            </View>
        </SafeAreaView>
    )
}
export default MultipleTrees;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    cont: { flex: 1 },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})