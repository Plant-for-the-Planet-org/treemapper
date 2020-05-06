import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Header, LargeButton, PrimaryButton, SmallHeader, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'

const TreeInventory = () => {
    let data = { title: '1 Apple Tree', measurement: '10 cm', date: 'Feb 28, 2019' }
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
            <SmallHeader leftText={'Pending Upload'} rightText={'Upload Now'} rightTheme={'red'} icon={'upload_now'} />
            <InventoryCard data={data} />
        </SafeAreaView>
    )
}
export default TreeInventory;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    }
})