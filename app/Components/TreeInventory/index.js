import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList , ScrollView} from 'react-native';
import { Header, LargeButton, PrimaryButton, SmallHeader, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory, clearAllInventory, updateLastScreen } from "../../Actions";
import { store } from '../../Actions/store';

const TreeInventory = ({ navigation }) => {
    const { dispatch } = useContext(store)

    const [allInventory, setAllInventory] = useState([])

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getAllInventory().then((allInventory) => {
                setAllInventory(Object.values(allInventory))
            })
        });

        return unsubscribe
    }, [navigation])

    const onPressInventory = (item) => {
        setTimeout(() => {
            if (item.status !== 'pending') {
                dispatch({ type: 'SET_INVENTORY_ID', inventoryID: item.inventory_id })
                navigation.navigate(item.last_screen)
            }
        }, 0)
    }

    const renderTempComp = () => (
        <TouchableOpacity style={{ marginVertical: 10 }}>
            <SmallHeader onPressRight={() => navigation.navigate('RegisterTree')} leftText={''} rightText={'Register Tree Screen'} />
        </TouchableOpacity>
    )


    const renderInventoryList = (inventoryList) => {
        return (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={inventoryList}
                renderItem={({ item }) => {
                    let title = item.species ? item.species[0] ? `${item.species[0].treeCount} ${item.species[0].nameOfTree} Tree` : '0 Species Tree' : '0 Species Tree'
                    let data = { title: title, measurement: '10 cm', date: new Date(Number(item.plantation_date)).toLocaleDateString() }
                    return (<TouchableOpacity disabled={item.status == 'pending'} onPress={() => onPressInventory(item)}><InventoryCard data={data} /></TouchableOpacity>)
                }}
            />
        )
    }

    const onPressClearAll = () => {
        console.log('onPressClearAll')
        clearAllInventory().then(() => {
            getAllInventory().then((allInventory) => {
                setAllInventory(Object.values(allInventory))
            })
        })
    }

    const pendingInventory = allInventory.filter(x => x.status == 'pending')
    const inCompleteInventory = allInventory.filter(x => x.status == 'incomplete')
    console.log(inCompleteInventory, 'inCompleteInventory')

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Header hideBackIcon headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
            {renderTempComp()}
            {pendingInventory.length > 0 && <><SmallHeader leftText={'Pending Upload'} rightText={'Upload now'} icon={'upload_now'} />
                {renderInventoryList(pendingInventory)}</>}
            {inCompleteInventory.length > 0 && <><SmallHeader onPressRight={onPressClearAll} leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} icon={'upload_now'} />
                {renderInventoryList(inCompleteInventory)}</>}
            {allInventory.length == 0 && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No Inventory</Text>
            </View>}
            </ScrollView>
        </SafeAreaView>
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