import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'


const RegisterTree = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Register Trees'} subHeadingText={'You can find incomplete registrations on Tree Inventory'} />
            <LargeButton heading={'Single Tree'} subHeading={'Allows high precision measurements'} active={false} />
            <LargeButton heading={'Multiple Trees'} subHeading={'Add many trees with different counts'} active={true} />
            <View style={{ flex: 1, }}>

            </View>
            <PrimaryButton btnText={'Continue'} theme={'primary'} />
        </SafeAreaView>
    )
}
export default RegisterTree;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    }
})