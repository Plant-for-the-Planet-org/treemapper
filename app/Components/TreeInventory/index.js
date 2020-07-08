import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Image, Dimensions, Platform } from 'react-native';
import { Header, SmallHeader, InventoryCard, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory, clearAllInventory, } from "../../Actions";
import { store } from '../../Actions/store';
import { Colors } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action'
import { empty_inventory_banner } from "../../assets";

const TreeInventory = ({ navigation }) => {
    const { dispatch } = useContext(store)

    const [allInventory, setAllInventory] = useState(null)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getAllInventory().then((allInventory) => {
                setAllInventory(Object.values(allInventory))
            })
        });

        return unsubscribe
    }, [navigation])

    const onPressInventory = (item) => {
        console.log(item.last_screen, 'item.last_screen')
        setTimeout(() => {
            dispatch(LocalInventoryActions.setInventoryId(item.inventory_id))
            navigation.navigate(item.last_screen)
        }, 0)
    }

    const renderInventoryList = (inventoryList) => {
        return (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={inventoryList}
                renderItem={({ item }) => {
                    let imageURL;
                    if (item.polygons[0] && item.polygons[0].coordinates) {
                        imageURL = item.polygons[0].coordinates[0].imageUrl
                    }
                    let measurement = '10cm';
                    if (item.specei_diameter) {
                        measurement = `${item.specei_diameter}cm`
                    }
                    let title = item.species ? item.species[0] ? `${item.species[0].treeCount} ${item.species[0].nameOfTree} Tree` : '0 Species Tree' : '0 Species Tree'
                    let data = { title: title, measurement: `${measurement}`, date: new Date(Number(item.plantation_date)).toLocaleDateString(), imageURL: imageURL }

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
        return <View style={styles.cont}>
            {pendingInventory.length > 0 && <><SmallHeader leftText={'Pending Upload'} rightText={'Upload now'} icon={'cloud-upload'} style={{ marginVertical: 15 }} />
                {renderInventoryList(pendingInventory)}</>}
            {inCompleteInventory.length > 0 && <><SmallHeader onPressRight={onPressClearAll} leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} style={{ marginVertical: 15 }} />
                {renderInventoryList(inCompleteInventory)}</>}
        </View>
    }

    const renderLoadingInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
            <ActivityIndicator size={25} color={Colors.PRIMARY} />
        </View>)
    }

    const renderEmptyInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
            <Image source={empty_inventory_banner} resizeMode={'stretch'} style={styles.emptyInventoryBanner} />
            <View style={styles.parimaryBtnCont}>
                <PrimaryButton onPress={() => navigation.navigate('RegisterTree')} btnText={'Register Tree'} />
            </View>
        </View>)
    }

    const renderInventoryListContainer = () => {
        return (<View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} >
                <Header headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
                {renderInventory()}
            </ScrollView>
            <PrimaryButton onPress={() => navigation.navigate('RegisterTree')} btnText={'Register Tree'} />
            <SafeAreaView />
        </View>)
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
            <SafeAreaView />
            {allInventory && allInventory.length > 0 ? renderInventoryListContainer() : allInventory == null ? renderLoadingInventoryList() : renderEmptyInventoryList()}
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
    cont: {
        flex: 1
    },
    emptyInventoryBanner: {
        width: '109%', height: '80%', marginHorizontal: -5, bottom: -10
    },
    parimaryBtnCont: {
        position: 'absolute', width: '100%', justifyContent: 'center', bottom: 10, paddingHorizontal: 25
    }
})