import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import Realm from 'realm';
import { initiateInventory } from '../../Actions'
import { store } from '../../Actions/store';

const RegisterTree = ({ navigation }) => {
    const globalState = useContext(store);
    const { dispatch } = globalState;

    const [treeType, setTreeType] = useState('multiple')

    const onPressSingleTree = () => setTreeType('single');
    const onPressMultipleTree = () => setTreeType('multiple');

    const onPressContinue = () => {
        let data = { treeType };
        initiateInventory(data).then((inventoryID) => {
            navigation.navigate('MultipleTrees')
            dispatch({ type: 'SET_INVENTORY_ID', inventoryID: inventoryID })
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