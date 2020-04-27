import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header, LargeButton, PrimaryButton , DateInput } from '../Common';
import { SafeAreaView } from 'react-native'


const MultipleTrees = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Multiple Trees'} subHeadingText={'Please enter the total number of trees and species.'} />
            <DateInput date={'June 28. 19'} label={'Planting Date'}/>
        </SafeAreaView>
    )
}
export default MultipleTrees;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    }
})