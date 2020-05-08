import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import { Header, LargeButton, PrimaryButton, SmallHeader, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory } from "../../Actions";

const TreeInventory = ({ navigation }) => {

    const [allInventory, setAllInventory] = useState(null)

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getAllInventory().then((allInventory) => {
                // console.log('allInventory=',allInventory)
                setAllInventory(Object.values(allInventory))
            })
        });

        return unsubscribe
    }, [navigation])

    const renderTempComp = () => (
        <TouchableOpacity onPress={() => navigation.navigate('RegisterTree')} style={{ marginVertical: 10 }}>
            <SmallHeader leftText={''} rightText={'Register Tree Screen'} />
        </TouchableOpacity>
    )


    const renderInventoryList = () => {
        return (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={allInventory}
                renderItem={({ item }) => {
                    let title = item.species ? item.species[0] ? `${item.species[0].treeCount} ${item.species[0].nameOfTree} Tree` : '' : ''
                    let data = { title: title, measurement: '10 cm', date: new Date(Number(item.plantation_date)).toLocaleDateString() }
                    return (<InventoryCard data={data} />)
                }}
            />
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header hideBackIcon headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
            {renderTempComp()}
            <SmallHeader leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} icon={'upload_now'} />
            {renderInventoryList(allInventory)}
            {allInventory.lenght < 1 && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No Inventory</Text>
            </View>}
        </SafeAreaView >
    )
}
export default TreeInventory;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: '#fff'
    }
})