import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';


const ManageUsers = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header headingText={'Manage Users'} subHeadingText={'List of all users you’ve invited to use tree inventory'} />
                <View style={{flex:1}}>

                </View>
            </View>
        </SafeAreaView>
    )
}
export default ManageUsers;

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