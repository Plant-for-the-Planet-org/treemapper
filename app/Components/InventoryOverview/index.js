import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton, Label, LabelAccordian, InventoryCard } from '../Common';
import { SafeAreaView } from 'react-native'


const InventoryOverview = () => {

    const renderPolygon = () => {
        let data = { title: 'Coordinate A', measurement: '34.25156,67.9879', date: 'View image' }
        return (
            <View>
                <Label leftText={'Polygon A'} rightText={'Edit'} />
                <InventoryCard data={data} />
                <InventoryCard data={data} />
                <InventoryCard data={data} />
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header headingText={''} subHeadingText={'Trees will be added to your inventory to sync when you have internet.'} />
            <ScrollView style={{ flex: 1, }} showsVerticalScrollIndicator={false}>
                <Label leftText={'Plant Date'} rightText={'Feb 20, 2010'} />
                <Label leftText={'On Site Registration'} rightText={'Edit'} />
                <Label leftText={'Project (if tpo)'} rightText={'Yucatan Reforestation'} />
                <Label leftText={'Type (if tpo)'} rightText={'External / Donated Trees'} />
                <LabelAccordian />
                {renderPolygon()}
                <LargeButton heading={'Export GeoJson'} active={false} medium />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PrimaryButton btnText={'Next Tree'} halfWidth theme={'white'} />
                    <PrimaryButton btnText={'Save'} halfWidth />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
export default InventoryOverview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    }
})