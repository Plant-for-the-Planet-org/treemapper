import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Header, SmallHeader, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory, clearAllInventory, } from "../../Actions";
import { store } from '../../Actions/store';
import { Colors } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action'

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
            dispatch(LocalInventoryActions.setInventoryId(item.inventory_id))
            navigation.navigate(item.last_screen)
        }, 0)
    }

    const renderTempComp = () => (
        <TouchableOpacity style={{ marginVertical: 10 }}>
            <SmallHeader onPressRight={() => navigation.navigate('RegisterTree')} leftText={''} rightText={'Register Tree Screen'} />
        </TouchableOpacity>
    )


    const renderInventoryList = (inventoryList, ) => {
        return (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={inventoryList}
                renderItem={({ item }) => {
                    let title = item.species ? item.species[0] ? `${item.species[0].treeCount} ${item.species[0].nameOfTree} Tree` : '0 Species Tree' : '0 Species Tree'
                    let data = { title: title, measurement: '10 cm', date: new Date(Number(item.plantation_date)).toLocaleDateString() }
                    return (<TouchableOpacity onPress={() => onPressInventory(item)}><InventoryCard icon={item.status == 'pending'} data={data} /></TouchableOpacity>)
                }}
            />
        )
    }

    const onPressClearAll = () => {
        clearAllInventory().then(() => {
            getAllInventory().then((allInventory) => {
                setAllInventory(Object.values(allInventory))
            })
        })
    }

    const pendingInventory = allInventory.filter(x => x.status == 'pending')
    const inCompleteInventory = allInventory.filter(x => x.status == 'incomplete')

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Header hideBackIcon headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
                    {renderTempComp()}
                    {pendingInventory.length > 0 && <><SmallHeader leftText={'Pending Upload'} rightText={'Upload now'} icon={'cloud-upload'} />
                        {renderInventoryList(pendingInventory)}</>}
                    {inCompleteInventory.length > 0 && <><SmallHeader onPressRight={onPressClearAll} leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} />
                        {renderInventoryList(inCompleteInventory)}</>}
                    {allInventory.length == 0 && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>No Inventory</Text>
                    </View>}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}
export default TreeInventory;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    }
})