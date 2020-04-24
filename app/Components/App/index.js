import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'


const App = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={'Register Trees'} subHeadingText={'You can find incomplete registrations on Tree Inventory'} />
            <LargeButton heading={'Single Tree'} subHeading={'Allows high precision measurements'} active={false} />
            <LargeButton heading={'Multiple Trees'} subHeading={'Add many trees with different counts'} active={true} />
            <PrimaryButton btnText={'Continue'} theme={'primary'}/>
            <PrimaryButton btnText={'Continue'} theme={'white'}/>
            <PrimaryButton btnText={'Continue'} theme={'white'}/>
        </SafeAreaView>
    )
}
export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal : 25
    }
})