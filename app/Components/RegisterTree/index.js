import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import Realm from 'realm'

const RegisterTree = ({ navigation }) => {

    const [treeType, setTreeType] = useState('single')

    const onPressSingleTree = () => setTreeType('single');
    const onPressMultipleTree = () => setTreeType('multiple');

    const onPressContinue = () => {
        // schema and start object 1588846833895.
        const Coordinates = {
            name: 'Coordinates',
            properties: {
                latlong: 'string',
                imageUrl: 'string',
                locationTitle: 'string'
            }
        }
        const Polygons = {
            name: 'Polygons',
            properties: {
                isPolygonComplete: 'string',
                coordinates: 'Coordinates[]',
            }
        }
        const Species = {
            name: 'Species',
            properties: {
                nameOfTree: 'string',
                treeCount: 'string',
            }
        }
        const Inventory = {
            name: 'Inventory',
            primaryKey: 'inventory_id',
            properties: {
                inventory_id: 'string',
                plantation_date: 'string?',
                tree_type: 'string',
                status: 'string',
                project_id: 'string?',
                donation_type: 'string?',
                locate_tree: 'string?',
                last_screen: 'string?',
                species: 'Species[]',
                polygons: 'Polygons[]'
            }
        };

        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    realm.create('Inventory', {
                        inventory_id: `${new Date().getTime()}`,
                        tree_type: treeType,
                        status: 'incomplete',
                    })
                    navigation.navigate('MultipleTrees')
                    // const Inventory = realm.objects('Inventory');
                    // console.log(JSON.parse(JSON.stringify(Inventory)), 'JSON.stringify(Inventory)')
                })
            })

    }

    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Register Trees'} subHeadingText={'You can find incomplete registrations on Tree Inventory'} />
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <LargeButton onPress={onPressSingleTree} heading={'Single Tree'} subHeading={'Allows high precision measurements'} active={treeType == 'single'} />
                <LargeButton onPress={onPressMultipleTree} heading={'Multiple Trees'} subHeading={'Add many trees with different counts'} active={treeType == 'multiple'} />
                <View style={{ flex: 1, }}>
                </View>
                <PrimaryButton onPress={onPressContinue} btnText={'Continue'} theme={'primary'} />
            </ScrollView>
        </SafeAreaView>
    )
}
export default RegisterTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25,
    }
})