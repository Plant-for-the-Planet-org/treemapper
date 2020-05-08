import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Header, LargeButton, PrimaryButton, Input, Accordian } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import DateTimePicker from '@react-native-community/datetimepicker';


const MultipleTrees = () => {

    const [plantingDate, setPlantingDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);

    const onChange = (event, selectedDate) => {
        setShowDate(false)
        setPlantingDate(selectedDate);
    };

    const renderDatePicker = () => (
        showDate && <DateTimePicker
            testID="dateTimePicker"
            timeZoneOffsetInMinutes={0}
            value={plantingDate}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={onChange}
        />
    )

    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setShowDate(true)}>
                    <Input value={new Date(plantingDate).toLocaleDateString()} label={'Planting Date'} />
                </TouchableOpacity>
                <Accordian data={{ nameOfTree: 'Apple', treeCount: 2 }} />
                <Text style={styles.addSpecies}>+ Add Species</Text>
                <View style={{ flex: 1 }} />
                <PrimaryButton btnText={'Save & Continue'} />
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