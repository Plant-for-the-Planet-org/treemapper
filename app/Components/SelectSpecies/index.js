import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';


const SelectSpecies = ({ }) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header headingText={'Species'} subHeadingText={'Please select the species that has been planted'} />
                <View style={{ flex: 1 }}>
                    <View>
                        <Text>C</Text>
                        <Text>Image</Text>
                        <Text>Species Name</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}
export default SelectSpecies;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
})