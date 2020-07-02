import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import Realm from 'realm';
import { initiateInventory } from '../../Actions'
import { store } from '../../Actions/store';
import { Colors, Typography } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action';

const RegisterTree = ({ navigation }) => {
    const globalState = useContext(store);
    const { dispatch } = globalState;

    const [treeType, setTreeType] = useState('multiple')

    const onPressSingleTree = () => setTreeType('single');
    const onPressMultipleTree = () => setTreeType('multiple');

    const onPressContinue = () => {
        let data = { treeType };
        initiateInventory(data).then((inventoryID) => {
            dispatch(LocalInventoryActions.setInventoryId(inventoryID))
            if (treeType === 'multiple') {
                navigation.navigate('MultipleTrees')
            } else {
                navigation.navigate('RegisterSingleTree')
            }
        })
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <Header headingText={'Register Trees'} subHeadingText={'You can find incomplete registrations on Tree Inventory'} />
                    <LargeButton onPress={onPressSingleTree} heading={'Single Tree'} subHeading={'Allows high precision measurements'} active={treeType == 'single'} />
                    <LargeButton onPress={onPressMultipleTree} heading={'Multiple Trees'} subHeading={'Add many trees with different counts'} active={treeType == 'multiple'} />
                    <View style={{ flex: 1, }}>
                    </View>
                </ScrollView>
                <PrimaryButton onPress={onPressContinue} btnText={'Continue'} theme={'primary'} />
            </View>
        </SafeAreaView>
    )
}
export default RegisterTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    }
})