import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, NavigatorIOS } from 'react-native';
import { Header, LargeButton, PrimaryButton, Label, LabelAccordian, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'
import { store } from '../../Actions/store'
import { getInventory, statusToPending, updateLastScreen } from '../../Actions'

const APLHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const InventoryOverview = ({ navigation, }) => {
    const { state } = useContext(store);

    const [inventory, setInventory] = useState(null)

    useEffect(() => {

        const unsubscribe = navigation.addListener('focus', () => {
            getInventory({ inventoryID: state.inventoryID }).then((inventory) => {
                inventory.species = Object.values(inventory.species);
                inventory.polygons = Object.values(inventory.polygons);
                setInventory(inventory)
            })

        });

        let data = { inventory_id: state.inventoryID, last_screen: 'InventoryOverview' }
        updateLastScreen(data)


    }, [])


    const renderPolygon = (polygons) => {
        return (
            <FlatList
                data={polygons}
                renderItem={({ item, index }) => {
                    return (<View>
                        <Label leftText={`Polygon ${APLHABETS[index]}`} rightText={''} />
                        <FlatList
                            data={Object.values(item.coordinates)}
                            renderItem={({ item: oneCoordinate, index }) => {
                                let normalizeData = { title: `Coordinate ${APLHABETS[index]}`, measurement: `${Number(oneCoordinate.latitude).toFixed(3)},${Number(oneCoordinate.longitude).toFixed(3)}`, date: 'View image', imageURL: oneCoordinate.imageUrl }
                                return (
                                    <InventoryCard data={normalizeData} />
                                )
                            }}
                        />

                    </View>)
                }}
            />

        )
    }

    const onPressSave = () => {
        let data = { inventory_id: state.inventoryID }
        statusToPending(data).then(() => {
            navigation.navigate('TreeInventory')
        })
    }

    const onPressEdit = () => {
        navigation.navigate('MultipleTrees', { isEdit: true })
    }

    return (
        <SafeAreaView style={styles.container}>
            {inventory !== null ? <ScrollView style={{ flex: 1, }} showsVerticalScrollIndicator={false}>
                <Header headingText={''} subHeadingText={'Trees will be added to your inventory to sync when you have internet.'} />
                <Label leftText={'Plant Date'} rightText={new Date(Number(inventory.plantation_date)).toLocaleDateString()} />
                <Label leftText={`On Site Registration`} rightText={''} />
                <LabelAccordian data={inventory.species} onPressRightText={onPressEdit} />
                {renderPolygon(inventory.polygons)}
                <LargeButton heading={'Export GeoJson'} active={false} medium />
            </ScrollView> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <PrimaryButton btnText={'Next Tree'} halfWidth theme={'white'} />
                <PrimaryButton onPress={onPressSave} btnText={'Save'} halfWidth />
            </View>
        </SafeAreaView>
    )
}
export default InventoryOverview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: '#fff'
    }
})