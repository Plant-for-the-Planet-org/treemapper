import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Image, Dimensions, Platform } from 'react-native';
import { Header, SmallHeader, InventoryCard, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory, clearAllInventory, } from "../../Actions";
import { store } from '../../Actions/store';
import { Colors } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action'
import { empty_inventory_banner } from "../../assets";

const { height, width } = Dimensions.get('window')
const IS_ANDROID = Platform.OS == 'android'
const TreeInventory = ({ navigation }) => {
    const { dispatch } = useContext(store)

    const [allInventory, setAllInventory] = useState(null)
    console.log('allInventory', allInventory)
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


    const renderInventoryList = (inventoryList,) => {
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

    let pendingInventory = []
    let inCompleteInventory = []
    if (allInventory) {
        pendingInventory = allInventory.filter(x => x.status == 'pending')
        inCompleteInventory = allInventory.filter(x => x.status == 'incomplete')
    }

    const renderInventory = () => {
        return <View style={{ flex: 1 }}>
            {pendingInventory.length > 0 && <><SmallHeader leftText={'Pending Upload'} rightText={'Upload now'} icon={'cloud-upload'} />
                {renderInventoryList(pendingInventory)}</>}
            {inCompleteInventory.length > 0 && <><SmallHeader onPressRight={onPressClearAll} leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} />
                {renderInventoryList(inCompleteInventory)}</>}
        </View>
    }
    console.log('allInventory', allInventory, 'allInventory')
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <SafeAreaView />
            {allInventory && allInventory.length > 0 ?
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false} >
                        <Header headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
                        {renderTempComp()}
                        {renderInventory()}
                    </ScrollView>
                </View>
                :
                allInventory == null ? <View style={{ flex: 1, }}>
                    <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
                    <ActivityIndicator size={25} color={Colors.PRIMARY} />
                </View> : <View style={{ flex: 1, borderWidth: 0, }}>
                        <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
                        <Image source={empty_inventory_banner} resizeMode={'stretch'} style={styles.emptyInventoryBanner} />
                        <View style={styles.parimaryBtnCont}>
                            <PrimaryButton onPress={() => navigation.navigate('RegisterTree')} btnText={'Register Tree'} />
                        </View>
                    </View>}
        </View>
    )
}
export default TreeInventory;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    emptyInventoryBanner: {
        width: '109%', height: '80%', marginHorizontal: -5, bottom: -10
    },
    parimaryBtnCont: {
        position: 'absolute', width: '100%', justifyContent: 'center', bottom: 10, paddingHorizontal: 25
    }
})