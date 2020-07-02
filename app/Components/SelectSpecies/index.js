import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal, Image, FlatList } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { placeholder_image, checkCircleFill, checkCircle } from '../../assets'
import { SvgXml } from 'react-native-svg';

const SelectSpecies = ({ }) => {

    const renderSpeciesCard = () => {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <View>
                    <SvgXml xml={checkCircleFill} />
                </View>
                <Image source={placeholder_image} resizeMode={'contain'} style={{ flex: 1 }} />
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.speciesName}>Pseudotsuga menziesii</Text>
                    <Text style={styles.treeCount}>5,000 Trees</Text>
                </View>
            </View>)
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <Header headingText={'Species'} subHeadingText={'Please select the species that has been planted'} />
                <FlatList style={{ flex: 1 }} data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]} showsVerticalScrollIndicator={false} renderItem={renderSpeciesCard} />
                <PrimaryButton btnText={'Save & Continue'} />
            </View>
        </SafeAreaView>
    )
}
export default SelectSpecies;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    speciesName: {
        marginVertical: 10,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
    },
    treeCount: {
        color: Colors.PRIMARY,
        fontSize: Typography.FONT_SIZE_16,
    }
})